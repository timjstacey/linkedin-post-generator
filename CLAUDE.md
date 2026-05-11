# LinkedIn Post Generator — Implementation Guide

This document is the source of truth for implementing this project. A future Claude session should read this file and carry out each step in order. Do not begin implementation until explicitly asked.

## What This Project Does

Automated LinkedIn post generator that:

1. Runs on a GitHub Actions schedule
2. Uses `anthropics/claude-code-action` + Tavily MCP to research a topic and generate a LinkedIn post
3. Commits research notes and post to a feature branch, opens a PR
4. When the PR is merged to `main`, publishes the post via the LinkedIn API

## Technology Decisions

- **Runtime**: Node.js v24.15.0 (see `.nvmrc`)
- **Language**: TypeScript, executed directly via `tsx` (no separate build step)
- **Module system**: ES modules (`"type": "module"`)
- **AI + research orchestration**: `anthropics/claude-code-action@v1` — runs full Claude Code agent in GitHub Actions; no SDK needed
- **Web search**: Tavily MCP server (`tavily-mcp` via `npx`) — injected as an MCP server into the claude-code-action step; no npm package needed
- **LinkedIn API**: native `fetch` → UGC Posts API
- **Post file detection**: `git diff-tree` in the publish workflow — no GitHub API client needed
- **Images**: text-only (deferred for later)

### Why claude-code-action over @anthropic-ai/sdk

`claude-code-action` runs Claude Code (the full CLI agent) inside Actions. It natively handles file I/O, git, and `gh` CLI — replacing `@anthropic-ai/sdk`, `@octokit/rest`, and all TypeScript orchestration code for the research workflow. The publish workflow is thin enough that Node.js + `fetch` suffices.

### Why Tavily MCP over @tavily/core

Tavily MCP delivers the same search capability via MCP protocol rather than an npm import. It runs as an ephemeral `npx` process alongside the claude-code-action step. `@tavily/core` is not installed.

### Built-in WebSearch note

Claude Code has built-in `WebSearch` and `WebFetch` tools that could eventually replace Tavily entirely. As of 2025, enabling them via `--allowedTools` is broken in claude-code-action ([issue #690](https://github.com/anthropics/claude-code-action/issues/690)). When that is fixed, Tavily MCP can be dropped and `TAVILY_API_KEY` removed.

---

## Directory Structure

```
linkedin-post-generator/
├── .env.example
├── .gitignore
├── CLAUDE.md                         ← this file
├── .claude/
│   └── skills/
│       └── stop-slop/               # writing quality rules used in the research prompt
│           ├── stop-slop.md
│           └── references/
│               ├── phrases.md
│               └── structures.md
├── .github/
│   └── workflows/
│       ├── research.yml              # scheduled: claude-code-action → research → post → PR
│       └── publish.yml              # on merge to main: post to LinkedIn
├── src/
│   ├── config.ts                    # load + validate LinkedIn env vars (publish only)
│   ├── linkedin.ts                  # LinkedIn UGC Posts API client
│   └── publish-workflow.ts          # reads post file from disk → LinkedIn
├── scripts/
│   ├── linkedin-auth.ts             # OAuth flow to obtain access token
│   └── linkedin-refresh.ts          # refresh expired access token
├── posts/                           # generated posts (tracked in git)
│   └── INDEX.md                     # one-row-per-post index; read instead of all post files
├── research/                        # research notes (tracked in git)
│   └── INDEX.md                     # one-row-per-research index; read instead of all research files
└── tsconfig.json
```

---

## Research Workflow (`research.yml`)

The entire research + generation + PR creation cycle runs inside `anthropics/claude-code-action@v1`. There is no `npm run research` script.

### How it works

1. `actions/checkout@v4` checks out the repo (with `fetch-depth: 0`)
2. A step writes a Tavily MCP config to `/tmp/mcp-config.json`, injecting `TAVILY_API_KEY`
3. `claude-code-action` runs Claude Code with:
   - `--mcp-config /tmp/mcp-config.json` — makes Tavily search tools available
   - `--allowedTools "Bash,Read,Write,Edit,mcp__tavily__*"` — scopes tool access
   - `--max-turns 40` — enough for research + generation + git operations
   - A `prompt:` that instructs Claude to read existing posts/research, search, write files, create a branch, commit, and open a PR

### What Claude does (from the prompt)

1. Reads `posts/INDEX.md` and `research/INDEX.md` (not all post files) to avoid duplicating covered angles
2. Reads `.claude/skills/stop-slop/` rules for writing quality
3. Uses Tavily search to find 5-8 recent articles (last 4 weeks)
4. Writes `research/YYYY-MM-DD-slug.md` with summary and sources
5. Writes `posts/YYYY-MM-DD-slug.md` with the LinkedIn post (stop-slop rules applied)
6. Appends one row to `posts/INDEX.md` and `research/INDEX.md`
7. Runs `git checkout -b`, `git commit`, `git push`, `gh pr create`

### Index files

`posts/INDEX.md` and `research/INDEX.md` are the primary context source for each run. Reading two small index files instead of all individual post/research files keeps token cost flat as the archive grows.

| File                | Columns                              | Grows by  |
| ------------------- | ------------------------------------ | --------- |
| `posts/INDEX.md`    | Date, Title, Topic angle, Hashtags   | 1 row/run |
| `research/INDEX.md` | Date, Title, Key angle, Source count | 1 row/run |

At 50 posts, the index is ~2,500 tokens vs ~25,000 tokens for reading all post files individually.

### Secrets required

| Secret              | Purpose                          |
| ------------------- | -------------------------------- |
| `ANTHROPIC_API_KEY` | Authenticates claude-code-action |
| `TAVILY_API_KEY`    | Tavily MCP search                |
| `RESEARCH_TOPIC`    | Comma-separated topic list       |
| `HASHTAGS`          | Comma-separated hashtag list     |

`GITHUB_TOKEN` is auto-provided by Actions.

---

## Publish Workflow (`publish.yml`)

Triggered on push to `main` when `posts/**` changes.

### How it works

1. `actions/checkout@v4`
2. `git diff-tree` detects which `posts/*.md` file was added in the commit — stored as a step output
3. If a post file is found: `npm ci` then `npm run publish` with `POST_FILE_PATH` set to the detected file
4. `publish-workflow.ts` reads the file from disk, calls `createPost()`, logs the LinkedIn URN

### Secrets required

| Secret                  | Purpose                  |
| ----------------------- | ------------------------ |
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn API auth        |
| `LINKEDIN_PERSON_URN`   | LinkedIn author identity |

---

## Node.js Modules (publish only)

The npm package has only one runtime dependency: `dotenv`. All research/generation/git work runs inside `claude-code-action`.

### `src/config.ts`

- Loads `.env` via `dotenv/config`
- Exports `loadPublishConfig()` returning `{ linkedinAccessToken, linkedinPersonUrn }`
- Throws descriptive errors for missing vars

### `src/linkedin.ts`

- `createPost(text, accessToken, personUrn): Promise<string>`
- `POST https://api.linkedin.com/v2/ugcPosts` via native `fetch`
- Returns LinkedIn post URN on success; throws on non-2xx with error body

### `src/publish-workflow.ts`

- Reads `POST_FILE_PATH` env var (set by the workflow)
- Reads the file from disk
- Calls `createPost()` and logs the result

---

## Local Development

### LinkedIn auth (one-time setup)

```bash
cp .env.example .env
# Fill in LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET
npm run auth:linkedin    # opens browser OAuth flow, writes token to .env
```

### Test publish locally

```bash
# Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN in .env
POST_FILE_PATH=posts/some-post.md npm run publish
```

### Research workflow (local)

The research workflow requires GitHub Actions (claude-code-action runs in the Actions runner). To test locally, trigger `workflow_dispatch` on the `research.yml` workflow via the GitHub UI or `gh workflow run research.yml`.

---

## Verification

1. **Publish locally**: set LinkedIn creds in `.env`, set `POST_FILE_PATH` to an existing post file, run `npm run publish`
2. **Research via Actions**: trigger `research.yml` via `workflow_dispatch` — verify branch + PR created with research notes and post file
3. **Publish via Actions**: merge the PR to `main` — verify `publish.yml` fires and posts to LinkedIn
4. **Lint**: `npm run lint` passes with no errors
5. **Typecheck**: `npm run typecheck` passes with no errors

---

## GitHub Actions Secrets Required

Configure in repository Settings → Secrets and variables → Actions:

| Secret                  | Required for      |
| ----------------------- | ----------------- |
| `ANTHROPIC_API_KEY`     | Research workflow |
| `TAVILY_API_KEY`        | Research workflow |
| `RESEARCH_TOPIC`        | Research workflow |
| `HASHTAGS`              | Research workflow |
| `LINKEDIN_ACCESS_TOKEN` | Publish workflow  |
| `LINKEDIN_PERSON_URN`   | Publish workflow  |

`GITHUB_TOKEN` is auto-provided by Actions — no manual secret needed.
