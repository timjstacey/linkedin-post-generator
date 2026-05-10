import { Octokit } from '@octokit/rest';
import { loadPublishConfig } from './config.js';
import { createPost } from './linkedin.js';

function parseRepo(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`);
  }
  return { owner: parts[0], repo: parts[1] };
}

async function main() {
  const config = loadPublishConfig();
  const octokit = new Octokit({ auth: config.githubToken });
  const { owner, repo } = parseRepo(config.githubRepo);

  const sha = process.env['GITHUB_SHA'];
  if (!sha) {
    throw new Error('Missing required environment variable: GITHUB_SHA');
  }

  console.log(`Detecting new post file in commit ${sha}...`);
  const { data: commit } = await octokit.repos.getCommit({ owner, repo, ref: sha });

  const postFile = commit.files?.find(
    (f: { filename: string; status: string }) =>
      f.filename.startsWith('posts/') &&
      f.filename.endsWith('.md') &&
      f.status === 'added',
  );

  if (!postFile) {
    console.log('No new post file found in this commit. Skipping.');
    return;
  }

  console.log(`Found post file: ${postFile.filename}`);

  const { data: fileData } = await octokit.repos.getContent({
    owner,
    repo,
    path: postFile.filename,
    ref: sha,
  });

  if (!('content' in fileData) || typeof fileData.content !== 'string') {
    throw new Error(`Could not read file content: ${postFile.filename}`);
  }

  const postContent = Buffer.from(fileData.content, 'base64').toString('utf8');

  console.log('Publishing to LinkedIn...');
  const postUrn = await createPost(
    postContent,
    config.linkedinAccessToken!,
    config.linkedinPersonUrn!,
  );

  console.log(`Published successfully. LinkedIn post URN: ${postUrn}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
