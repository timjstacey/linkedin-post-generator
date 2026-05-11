import { Octokit } from '@octokit/rest';

function parseRepo(repo: string): { owner: string; repo: string } {
  const parts = repo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`Invalid repo format: "${repo}". Expected "owner/repo".`);
  }
  return { owner: parts[0], repo: parts[1] };
}

export async function createBranch(token: string, repo: string, branchName: string): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const { owner, repo: repoName } = parseRepo(repo);

  const { data: mainRef } = await octokit.git.getRef({
    owner,
    repo: repoName,
    ref: 'heads/main',
  });

  await octokit.git.createRef({
    owner,
    repo: repoName,
    ref: `refs/heads/${branchName}`,
    sha: mainRef.object.sha,
  });
}

export async function commitFiles(
  token: string,
  repo: string,
  branch: string,
  files: { path: string; content: string }[],
  message: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  const { owner, repo: repoName } = parseRepo(repo);

  const { data: branchData } = await octokit.repos.getBranch({
    owner,
    repo: repoName,
    branch,
  });

  const baseTreeSha = branchData.commit.commit.tree.sha;
  const latestCommitSha = branchData.commit.sha;

  const blobs = await Promise.all(
    files.map((f) =>
      octokit.git.createBlob({
        owner,
        repo: repoName,
        content: Buffer.from(f.content).toString('base64'),
        encoding: 'base64',
      })
    )
  );

  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    base_tree: baseTreeSha,
    tree: files.map((f, i) => ({
      path: f.path,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: blobs[i]!.data.sha,
    })),
  });

  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message,
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  await octokit.git.updateRef({
    owner,
    repo: repoName,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });
}

export async function createPullRequest(
  token: string,
  repo: string,
  branch: string,
  title: string,
  body: string
): Promise<string> {
  const octokit = new Octokit({ auth: token });
  const { owner, repo: repoName } = parseRepo(repo);

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo: repoName,
    title,
    body,
    head: branch,
    base: 'main',
  });

  return pr.html_url;
}
