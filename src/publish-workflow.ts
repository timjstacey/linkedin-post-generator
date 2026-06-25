import { readFile, appendFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';

/** Public URL for a created post, from the `urn:li:share:…` / `urn:li:ugcPost:…` URN. */
function linkedInPostUrl(urn: string): string {
  return `https://www.linkedin.com/feed/update/${urn}`;
}

/** Emit a key=value pair to $GITHUB_OUTPUT so later workflow steps can read it. */
async function emitOutput(key: string, value: string): Promise<void> {
  const outputPath = process.env['GITHUB_OUTPUT'];
  if (outputPath) {
    await appendFile(outputPath, `${key}=${value}\n`);
  }
}

async function main() {
  const config = loadPublishConfig();

  // Blog-first path (post-to-linkedin.yml): the finished LinkedIn copy is dispatched
  // here as text, already carrying the blog link. Just post it — one-way link, so the
  // returned URL is logged, not forwarded.
  const postText = process.env['POST_TEXT'];
  if (postText && postText.trim()) {
    const blogUrl = process.env['BLOG_URL'];
    if (blogUrl) {
      console.log(`Canonical blog URL (already in the copy): ${blogUrl}`);
    }
    console.log('Publishing dispatched text to LinkedIn...');
    const postUrn = await createPost(postText, config.linkedinAccessToken, config.linkedinPersonUrn);
    console.log(`Published successfully. URN: ${postUrn}`);
    console.log(`Post URL: ${linkedInPostUrl(postUrn)}`);
    return;
  }

  // Transitional fallback — the legacy LinkedIn-first path (publish.yml) reads a
  // posts/*.md file and emits slug + URL for its blog-routine-fire step. Removed in
  // #29 once the blog-first dispatch is confirmed and the old path is torn down.
  const postFilePath = process.env['POST_FILE_PATH'];
  if (!postFilePath) {
    throw new Error('Missing required environment variable: POST_TEXT (or legacy POST_FILE_PATH)');
  }

  console.log(`Reading post file: ${postFilePath}`);
  const postContent = await readFile(postFilePath, 'utf8');

  console.log('Publishing to LinkedIn...');
  const postUrn = await createPost(postContent, config.linkedinAccessToken, config.linkedinPersonUrn);
  const postUrl = linkedInPostUrl(postUrn);
  console.log(`Published successfully. URN: ${postUrn}`);
  console.log(`Post URL: ${postUrl}`);

  const slug = basename(postFilePath).replace(/\.md$/, '').slice(11);
  await emitOutput('slug', slug);
  await emitOutput('post_url', postUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
