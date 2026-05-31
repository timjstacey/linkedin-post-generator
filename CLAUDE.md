# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Automated LinkedIn post generator:

1. Gitea Actions schedule runs `claude --print` + Tavily MCP to research a topic and write a post
2. Claude commits research notes + post to a feature branch, opens a PR via `tea`
3. Merging the PR to `main` triggers the publish workflow → LinkedIn API

## Commands

```bash
npm run lint          # ESLint on src/
npm run lint:fix      # ESLint --fix on src/
npm run typecheck     # tsc --noEmit
npm run format        # Prettier on everything
npm run research      # run research locally (reads .env, calls claude --print)
npm run publish       # publish a post (requires POST_FILE_PATH + LinkedIn env vars)
npm run auth:linkedin # OAuth flow → writes LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN to .env
npm run refresh:linkedin # refresh an expired LinkedIn token
```

**Git hooks (husky):**

- `pre-commit` — runs `lint-staged` (prettier + eslint on staged files)
- `pre-push` — runs `npm run typecheck`

## Architecture

### Two workflows (`.gitea/workflows/`)

| Workflow        | Trigger                                                | What it does                                           |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| `research.yml`  | Schedule (Mon/Wed/Fri 22:00 UTC) + `workflow_dispatch` | Runs `claude --print` → writes files → `tea pr create` |
| `publish.yml`   | Push to `main` when `posts/**` changes                 | `git diff-tree` detects new post → `npm run publish`   |
| `pr-checks.yml` | PR to `main`                                           | `npm run lint` + `npm run typecheck`                   |

**This is a Gitea repo** (`git.sillysamoyed.com`), not GitHub. Workflows live in `.gitea/workflows/`. The `tea` CLI (not `gh`) creates PRs. The `GIT_PAT` secret authenticates `tea`.

### Research workflow detail

The workflow installs `claude` CLI globally, writes a Tavily MCP config to `/tmp/mcp-config.json`, then runs:

```bash
claude --print \
  --max-turns 40 \
  --model claude-sonnet-4-6 \
  --mcp-config /tmp/mcp-config.json \
  --allowedTools "Bash,Read,Write,Edit,mcp__tavily__*" \
  -- "Read and execute the instructions in .claude/skills/research/research.md exactly."
```

**`.claude/skills/research/research.md` is the single source of truth for the research workflow.** Both CI and `npm run research` (via `scripts/research-local`) use it. The skill:

1. Reads `RESEARCH_TOPIC` + `HASHTAGS` env vars
2. Reads `posts/INDEX.md` + `research/INDEX.md` to avoid duplicate angles
3. Reads all stop-slop rule files (`.claude/skills/stop-slop/`)
4. Searches via Tavily MCP for 5–8 recent articles
5. Writes `research/YYYY-MM-DD-slug.md` and `posts/YYYY-MM-DD-slug.md`
6. Appends a row to each index
7. Creates branch, commits, pushes, opens PR via `tea`

### Index files (token efficiency)

`posts/INDEX.md` and `research/INDEX.md` grow by one row per run. Read these instead of individual post/research files — at 50 posts, indices are ~2,500 tokens vs ~25,000 tokens for all files.

### Publish workflow detail

`git diff-tree` detects which `posts/*.md` file was added in the merge commit → sets `POST_FILE_PATH` → `npm run publish` → `src/publish-workflow.ts` reads the file and calls `createPost()`.

### Source modules (`src/`)

| File                  | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `config.ts`           | `loadPublishConfig()` — loads + validates LinkedIn env vars            |
| `linkedin.ts`         | `createPost()` — POST to LinkedIn UGC Posts API via `fetch`            |
| `publish-workflow.ts` | Entry point for publish: reads `POST_FILE_PATH` → calls `createPost()` |

Only runtime dependency is `dotenv`. No SDK, no Octokit — native `fetch` only.

### Writing quality rules

`.claude/skills/stop-slop/` contains rules applied to every generated post: no adverbs, no passive voice, no binary contrasts, no em-dashes, no throat-clearing openers. The research skill reads all three files before writing.

### Comment replies (`.claude/skills/reply/`)

Manual workflow. User supplies a post path + comment text; the `reply` skill reads the post, applies stop-slop rules, optionally Tavily-searches if the comment needs fact-checking, and prints a drafted reply. No files, commits, or PRs — output goes to the conversation for the user to paste into LinkedIn.

### Blog posts (`.claude/skills/blog/`)

Manual workflow, run **locally** after a LinkedIn PR merges. `/blog [slug]` takes a research/posts pair (defaults to the newest) and expands it into a long-form blog post for the separate **`resume-static-site`** repo (GitHub) — section headings, code examples, and outbound links to the research sources. The skill reads stop-slop rules and the site's live content-collection schema (`src/content.config.ts`), writes `src/content/posts/<slug>.md` into the site checkout, runs the site's `pnpm typecheck` to validate the schema, then branches, commits, and opens a PR with `gh`.

The two repos never talk over CI — this is the only bridge, and it's a local command. The site repo path comes from `BLOG_REPO_DIR` (default `$HOME/Repositories/resume-static-site`). Posts land gated behind the site's `FEATURES.blog` flag; the skill never flips it.

## Key operational notes

- LinkedIn access tokens expire every ~60 days. Run `npm run auth:linkedin`, then update `LINKEDIN_ACCESS_TOKEN` in Gitea secrets.
- `scripts/research-local` is the local research runner — loads `.env`, writes MCP config, calls `claude --print`.
- No build step — TypeScript runs directly via `tsx`.
- `GITHUB_SHA` is set automatically by Gitea Actions (same env var name).

## Secrets

| Secret                  | Workflow                             |
| ----------------------- | ------------------------------------ |
| `ANTHROPIC_API_KEY`     | research                             |
| `TAVILY_API_KEY`        | research                             |
| `RESEARCH_TOPIC`        | research (comma-separated topics)    |
| `HASHTAGS`              | research (comma-separated, optional) |
| `GIT_PAT`               | research (`tea` authentication)      |
| `LINKEDIN_ACCESS_TOKEN` | publish                              |
| `LINKEDIN_PERSON_URN`   | publish                              |
