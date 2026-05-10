import { Octokit } from '@octokit/rest';
import { loadEngageConfig } from './config.js';
import { getComments, replyToComment } from './linkedin.js';
import { draftReplies } from './engage.js';

const ENGAGEMENT_LOG_PATH = 'posts/.engagement-log.json';

function parseRepo(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`);
  }
  return { owner: parts[0], repo: parts[1] };
}

function parseLinkedInUrn(content: string): string | null {
  const match = content.match(/^---\nlinkedin_urn:\s*(.+?)\s*\n---/);
  return match?.[1] ?? null;
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\n[\s\S]*?\n---\n\n?/, '');
}

async function readEngagementLog(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<{ repliedUrns: Set<string>; fileSha: string | null }> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: ENGAGEMENT_LOG_PATH });
    if ('content' in data && typeof data.content === 'string') {
      const parsed = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8')) as {
        repliedUrns: string[];
      };
      return { repliedUrns: new Set(parsed.repliedUrns), fileSha: data.sha };
    }
  } catch {
    // file doesn't exist yet
  }
  return { repliedUrns: new Set(), fileSha: null };
}

async function writeEngagementLog(
  octokit: Octokit,
  owner: string,
  repo: string,
  repliedUrns: Set<string>,
  existingSha: string | null,
): Promise<void> {
  const content = Buffer.from(
    JSON.stringify({ repliedUrns: [...repliedUrns] }, null, 2) + '\n',
  ).toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: ENGAGEMENT_LOG_PATH,
    message: 'chore: update engagement log',
    content,
    ...(existingSha ? { sha: existingSha } : {}),
  });
}

async function main() {
  const config = loadEngageConfig();
  const octokit = new Octokit({ auth: config.githubToken });
  const { owner, repo } = parseRepo(config.githubRepo);

  const { repliedUrns, fileSha } = await readEngagementLog(octokit, owner, repo);

  const { data: postsDir } = await octokit.repos.getContent({ owner, repo, path: 'posts' });
  if (!Array.isArray(postsDir)) return;

  const postFiles = postsDir.filter(
    (f) => f.type === 'file' && f.name.endsWith('.md') && f.name !== '.gitkeep',
  );

  let totalReplies = 0;
  const newRepliedUrns = new Set(repliedUrns);

  for (const postFile of postFiles) {
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: postFile.path,
    });

    if (!('content' in fileData) || typeof fileData.content !== 'string') continue;

    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const postUrn = parseLinkedInUrn(content);

    if (!postUrn) continue;

    console.log(`Checking comments on: ${postFile.name}`);

    let comments;
    try {
      comments = await getComments(postUrn, config.linkedinAccessToken!);
    } catch (err) {
      console.warn(`  Failed to fetch comments: ${err}`);
      continue;
    }

    const unanswered = comments.filter(
      (c) => c.actorUrn !== config.linkedinPersonUrn && !repliedUrns.has(c.urn),
    );

    if (unanswered.length === 0) {
      console.log(`  No unanswered comments`);
      continue;
    }

    console.log(`  Drafting ${unanswered.length} repl${unanswered.length === 1 ? 'y' : 'ies'}...`);
    const postContent = stripFrontmatter(content);
    const drafted = await draftReplies(postContent, unanswered, config);

    for (const { commentUrn, commentText, reply } of drafted) {
      console.log(`  Replying to: "${commentText.slice(0, 60)}${commentText.length > 60 ? '...' : ''}"`);
      console.log(`  Reply: "${reply}"`);
      await replyToComment(postUrn, commentUrn, reply, config.linkedinAccessToken!, config.linkedinPersonUrn!);
      newRepliedUrns.add(commentUrn);
      totalReplies++;
    }
  }

  if (newRepliedUrns.size > repliedUrns.size) {
    console.log('Updating engagement log...');
    await writeEngagementLog(octokit, owner, repo, newRepliedUrns, fileSha);
  }

  console.log(`Done. Posted ${totalReplies} repl${totalReplies === 1 ? 'y' : 'ies'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
