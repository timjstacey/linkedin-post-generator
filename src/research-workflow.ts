import { Octokit } from '@octokit/rest';
import { loadResearchConfig } from './config.js';
import { research } from './research.js';
import { generatePost } from './post-generator.js';
import { createBranch, commitFiles, createPullRequest } from './github.js';

function parseRepo(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`);
  }
  return { owner: parts[0], repo: parts[1] };
}

async function listMarkdownFiles(octokit: Octokit, owner: string, repo: string, path: string): Promise<string[]> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data)) return [];

    const contents = await Promise.all(
      data
        .filter((f) => f.type === 'file' && f.name.endsWith('.md') && f.name !== '.gitkeep')
        .map(async (f) => {
          const { data: fileData } = await octokit.repos.getContent({
            owner,
            repo,
            path: f.path,
          });
          if ('content' in fileData && typeof fileData.content === 'string') {
            return Buffer.from(fileData.content, 'base64').toString('utf8');
          }
          return null;
        })
    );

    return contents.filter((c): c is string => c !== null) as string[];
  } catch {
    return [];
  }
}

async function main() {
  const config = loadResearchConfig();
  const octokit = new Octokit({ auth: config.githubToken });
  const { owner, repo } = parseRepo(config.githubRepo);

  console.log('Reading existing research and posts...');
  const [researchContents, postContents] = await Promise.all([
    listMarkdownFiles(octokit, owner, repo, 'research'),
    listMarkdownFiles(octokit, owner, repo, 'posts'),
  ]);

  // Pass first lines of research files as summaries to avoid duplication
  const existingResearch = researchContents.map((c) => c.split('\n')[0] ?? '');
  const existingPosts = postContents;

  const topic = config.researchTopic!;
  console.log(`Researching topic: "${topic}"`);
  const researchResult = await research(topic, existingResearch, existingPosts, config);

  console.log('Generating LinkedIn post...');
  const post = await generatePost(researchResult, existingPosts, config);

  const date = new Date().toISOString().split('T')[0]!;
  const branchName = `feature/${date}-${post.slug}`;

  const researchFileContent = [
    `# Research: ${post.title}`,
    '',
    `**Date range:** ${researchResult.dateRange}`,
    '',
    '## Summary',
    '',
    researchResult.summary,
    '',
    '## Sources',
    '',
    ...researchResult.sources.map((s) => `- ${s}`),
  ].join('\n');

  console.log(`Creating branch: ${branchName}`);
  await createBranch(config.githubToken, config.githubRepo, branchName);

  console.log('Committing files...');
  await commitFiles(
    config.githubToken,
    config.githubRepo,
    branchName,
    [
      { path: `research/${date}-${post.slug}.md`, content: researchFileContent },
      { path: `posts/${date}-${post.slug}.md`, content: post.content },
    ],
    `feat: add research and post for "${post.title}"`
  );

  const prBody = [
    `## ${post.title}`,
    '',
    '### Research Summary',
    '',
    researchResult.summary,
    '',
    '### Sources',
    '',
    ...researchResult.sources.map((s) => `- ${s}`),
    '',
    '---',
    '',
    '### Reviewer Instructions',
    '',
    `1. Review the generated post in \`posts/${date}-${post.slug}.md\``,
    '2. To iterate on the post locally:',
    '   ```',
    `   git checkout ${branchName}`,
    '   claude  # use Claude Code to refine the post',
    '   ```',
    '3. Push changes and merge when satisfied.',
    '4. Merging to `main` automatically publishes the post to LinkedIn.',
  ].join('\n');

  console.log('Creating pull request...');
  const prUrl = await createPullRequest(
    config.githubToken,
    config.githubRepo,
    branchName,
    `[Post] ${post.title}`,
    prBody
  );

  console.log(`Pull request created: ${prUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
