import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';
import { setLinkedInUrl } from './post-index.js';

const INDEX_PATH = 'posts/INDEX.md';

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

  const postFilePath = process.env['POST_FILE_PATH'];
  if (!postFilePath) {
    throw new Error('Missing required environment variable: POST_FILE_PATH');
  }

  console.log(`Reading post file: ${postFilePath}`);
  const postContent = await readFile(postFilePath, 'utf8');

  console.log('Publishing to LinkedIn...');
  const postUrn = await createPost(postContent, config.linkedinAccessToken, config.linkedinPersonUrn);
  const postUrl = linkedInPostUrl(postUrn);
  console.log(`Published successfully. URN: ${postUrn}`);
  console.log(`Post URL: ${postUrl}`);

  // Filename is YYYY-MM-DD-slug.md — derive the date (for the index row) and slug.
  const stem = basename(postFilePath).replace(/\.md$/, '');
  const postDate = stem.slice(0, 10);
  const slug = stem.slice(11);

  // Record the URL in the index so the blog routine can link back to the post.
  // A posting failure already threw above; an index miss must not fail the run.
  try {
    const index = await readFile(INDEX_PATH, 'utf8');
    await writeFile(INDEX_PATH, setLinkedInUrl(index, postDate, postUrl));
    console.log(`Recorded LinkedIn URL in ${INDEX_PATH} for ${postDate}`);
  } catch (err) {
    console.warn(`Could not record LinkedIn URL in ${INDEX_PATH}: ${(err as Error).message}`);
  }

  await emitOutput('slug', slug);
  await emitOutput('post_url', postUrl);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
