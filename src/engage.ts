import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from './config.js';
import type { LinkedInComment } from './linkedin.js';

const skillsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '.claude',
  'skills',
  'stop-slop',
);

async function loadStopSlopRules(): Promise<string> {
  const [core, phrases, structures] = await Promise.all([
    readFile(join(skillsDir, 'stop-slop.md'), 'utf8'),
    readFile(join(skillsDir, 'references', 'phrases.md'), 'utf8'),
    readFile(join(skillsDir, 'references', 'structures.md'), 'utf8'),
  ]);
  return `${core}\n\n${phrases}\n\n${structures}`;
}

export interface DraftedReply {
  commentUrn: string;
  commentText: string;
  reply: string;
}

export async function draftReplies(
  postContent: string,
  comments: LinkedInComment[],
  config: Config,
): Promise<DraftedReply[]> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const stopSlopRules = await loadStopSlopRules();
  const results: DraftedReply[] = [];

  for (const comment of comments) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system:
        'You are the author of a LinkedIn post replying to a comment on that post. ' +
        'Write 1-3 sentences. Address what the commenter said specifically. ' +
        'No platitudes, no "great question!", no "absolutely!", no emojis. ' +
        'Output the reply text only, no preamble.' +
        '\n\n' +
        stopSlopRules,
      messages: [
        {
          role: 'user',
          content: `Original post:\n${postContent}\n\nComment:\n${comment.text}\n\nWrite a reply.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      results.push({
        commentUrn: comment.urn,
        commentText: comment.text,
        reply: textBlock.text.trim(),
      });
    }
  }

  return results;
}
