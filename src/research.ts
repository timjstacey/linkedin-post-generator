import Anthropic from '@anthropic-ai/sdk';
import { tavily } from '@tavily/core';
import type { Config } from './config.js';

export interface ResearchResult {
  summary: string;
  sources: string[];
  dateRange: string;
}

export async function research(
  topic: string,
  existingResearch: string[],
  existingPosts: string[],
  config: Config
): Promise<ResearchResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const tavilyClient = tavily({ apiKey: config.tavilyApiKey! });

  const systemPrompt =
    'You are a research assistant specializing in technology and professional topics. ' +
    'Research the given topic using web search to find recent articles, data, and insights ' +
    'from the last 4 weeks. Focus on novel angles not covered in existing research or posts. ' +
    'After gathering sufficient information (3-5 searches), produce a comprehensive summary ' +
    'with key insights, statistics, and quotes suitable for a LinkedIn post.';

  const existingContext =
    existingResearch.length > 0 || existingPosts.length > 0
      ? `\n\nExisting research summaries already covered:\n${existingResearch.map((r, i) => `${i + 1}. ${r}`).join('\n')}` +
        `\n\nExisting post titles (avoid duplicating these angles):\n${existingPosts.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '';

  const tools: Anthropic.Messages.Tool[] = [
    {
      name: 'search',
      description: 'Search the web for recent articles and information on a topic',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find relevant articles and data',
          },
        },
        required: ['query'],
      },
    },
  ];

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: 'user',
      content: `Research this topic for a LinkedIn post: "${topic}"${existingContext}\n\nUse the search tool to find recent relevant articles and data. After gathering sufficient information, provide a comprehensive research summary with key insights.`,
    },
  ];

  const sources: string[] = [];
  let summary = '';
  let continueLoop = true;
  let searchCount = 0;

  while (continueLoop) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        summary = textBlock.text;
      }
      continueLoop = false;
    } else if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use' && block.name === 'search') {
          const input = block.input as { query: string };

          if (searchCount >= config.tavilyMaxSearches) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Search limit of ${config.tavilyMaxSearches} reached. Write your summary now using the information already gathered.`,
            });
          } else {
            searchCount++;
            console.log(`Search ${searchCount}/${config.tavilyMaxSearches}: ${input.query}`);
            const result = await tavilyClient.search(input.query, {
              maxResults: 5,
              includeAnswer: true,
            });

            for (const r of result.results) {
              if (r.url && !sources.includes(r.url)) {
                sources.push(r.url);
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            });
          }
        }
      }

      messages.push({ role: 'user', content: toolResults });
    } else {
      continueLoop = false;
    }
  }

  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const dateRange = `${fourWeeksAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`;

  return { summary, sources, dateRange };
}
