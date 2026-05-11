import { readFile } from 'node:fs/promises';
import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';

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

  console.log(`Published successfully. LinkedIn post URN: ${postUrn}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
