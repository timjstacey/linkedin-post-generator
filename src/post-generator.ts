import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ResearchResult } from './research.js';
import type { Config } from './config.js';

const skillsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'skills');

async function loadStopSlopRules(): Promise<string> {
  const [core, phrases, structures] = await Promise.all([
    readFile(join(skillsDir, 'stop-slop.md'), 'utf8'),
    readFile(join(skillsDir, 'references', 'phrases.md'), 'utf8'),
    readFile(join(skillsDir, 'references', 'structures.md'), 'utf8'),
  ]);
  return `${core}\n\n${phrases}\n\n${structures}`;
}

export interface PostResult {
  title: string;
  slug: string;
  content: string;
}

export async function generatePost(
  researchResult: ResearchResult,
  existingPosts: string[],
  config: Config,
): Promise<PostResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  const hashtagHint =
    config.hashtags.length > 0
      ? `Incorporate these hashtags where relevant: ${config.hashtags.map((h) => `#${h}`).join(' ')}. Add 1-2 more topic-relevant hashtags to reach 3-5 total.`
      : 'End with 3-5 relevant hashtags.';

  const stopSlopRules = await loadStopSlopRules();

  const systemPrompt =
    'You are a LinkedIn content writer for a software engineering professional. ' +
    'Write posts that are professional but conversational, in first-person voice, 150-300 words. ' +
    hashtagHint +
    '\n\n' +
    stopSlopRules +
    '\n\n' +
    'Respond with valid JSON only: { "title": "short filename-friendly title", "content": "full post text" }';

  const existingPostsContext =
    existingPosts.length > 0
      ? `Here are existing posts for style and tone reference:\n\n${existingPosts.join('\n\n---\n\n')}`
      : 'No existing posts yet — establish a clear professional voice.';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: existingPostsContext,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text:
              `Write a LinkedIn post based on this research:\n\n${researchResult.summary}\n\n` +
              `Key sources: ${researchResult.sources.slice(0, 5).join(', ')}\n\n` +
              `Respond with JSON only.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Could not parse JSON from Claude response: ${textBlock.text}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as { title: string; content: string };

  const slug = parsed.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return { title: parsed.title, slug, content: parsed.content };
}
