# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

Automated LinkedIn post generator:

1. A scheduled **Claude Code routine** (Anthropic cloud) runs the research skill (WebSearch) to research a topic and write a post
2. The routine commits research notes + post to a `claude/`-prefixed branch and opens a PR via `gh`
3. Merging the PR to `main` triggers the publish GitHub Action → LinkedIn API
4. Publishing captures the post's public URL and passes it to a second **blog routine** that cross-posts a long-form version to the `resume-static-site` repo

## Commands

```bash
npm run lint          # ESLint on src/
npm run lint:fix      # ESLint --fix on src/
npm run typecheck     # tsc --noEmit
npm run format        # Prettier on everything
npm run research      # run research locally (reads .env, calls claude --print)
npm run publish       # publish a post (requires POST_FILE_PATH + LinkedIn env vars)
npm run comment       # comment a blog link on a post (requires LINKEDIN_POST_URL + COMMENT_TEXT + LinkedIn env vars)
npm run auth:linkedin # OAuth flow → writes LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN to .env
npm run refresh:linkedin # refresh an expired LinkedIn token
```

**Git hooks (husky):**

- `pre-commit` — runs `lint-staged` (prettier + eslint on staged files)
- `pre-push` — runs `npm run typecheck`

## Architecture

**This is a GitHub repo** (`timjstacey/linkedin-post-generator`). Workflows live in
`.github/workflows/`. The `gh` CLI (not `tea`) creates PRs. Research runs as a Claude Code
routine on Anthropic-managed cloud infrastructure (claude.ai/code), drawing down the Claude
subscription quota rather than metered API billing.

### Triggers

| Trigger                                 | Kind                                                        | What it does                                                                                             |
| --------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Research routine                        | Claude routine, schedule (Mon/Wed/Fri)                      | Runs the research skill → writes files → opens a `claude/…` PR via `gh`                                  |
| Blog routine                            | Claude routine, API trigger                                 | Fired by the publish Action → cross-posts a long-form blog to the site repo                              |
| `.github/workflows/publish.yml`         | Push to `main` when `posts/**` changes                      | Detects the new post → `npm run publish` → fires blog routine (with the post URL)                        |
| `.github/workflows/comment-on-blog.yml` | `repository_dispatch` (`blog-published`) from the site repo | Polls the blog URL until live → `npm run comment` → comments the blog link on the original LinkedIn post |
| `.github/workflows/pr-checks.yml`       | PR to `main`                                                | `npm run lint` + `npm run typecheck`                                                                     |

Routines are created and managed at [claude.ai/code/routines](https://claude.ai/code/routines)
(or via `/schedule`); their config lives in the Claude account, not in the repo. The repo's
in-tree contribution to a routine is `.mcp.json`, the research/blog skills, and the
environment variables you set on the routine.

### Research routine detail

The routine runs the research skill as a full cloud session. It searches with **WebSearch**
(available in the US-based cloud). **Tavily** is the local fallback only — WebSearch is
region-restricted to the US, so local runs (e.g. AU) use the Tavily MCP server declared in
`.mcp.json`. The routine needs neither `TAVILY_API_KEY` nor a `mcp.tavily.com` allowlist entry.

**`.claude/skills/research/research.md` is the single source of truth for research.** Both the
routine and `npm run research` (via `scripts/research-local`) use it. The skill:

1. Reads `RESEARCH_TOPIC` + `HASHTAGS` env vars
2. Reads `posts/INDEX.md` + `research/INDEX.md` to avoid duplicate angles
3. Reads all stop-slop rule files (`.claude/skills/stop-slop/`)
4. Selects a post **archetype** not used in the last 3 posts (`.claude/skills/research/references/archetypes.md`)
5. Searches the web (WebSearch; Tavily MCP fallback for local non-US runs) for 5–8 recent articles
6. Writes `research/YYYY-MM-DD-slug.md` and `posts/YYYY-MM-DD-slug.md`
7. Appends a row to each index (the `posts/INDEX.md` row carries the archetype)
8. Creates a `claude/…` branch, commits, pushes, opens a PR via `gh`

### Index files (token efficiency)

`posts/INDEX.md` and `research/INDEX.md` grow by one row per run. Read these instead of
individual post/research files — at 50 posts, indices are ~2,500 tokens vs ~25,000 tokens for
all files. `posts/INDEX.md` columns: Date, Title, Topic angle, Archetype, Hashtags.

### Publish workflow detail

A net `git diff --diff-filter=A` between the previous `main` tip and the merge commit detects
which `posts/*.md` file was added → sets `POST_FILE_PATH` → `npm run publish`. (A per-commit
`git log` would misread an in-branch rename as an add of the old path; the tree diff reports
only the file that exists now.) A `workflow_dispatch` with a `post_file` input publishes a
specific file by hand. `src/publish-workflow.ts` reads the file, calls
`createPost()`, then builds the public post URL from the returned `X-RestLi-Id` URN
(`https://www.linkedin.com/feed/update/<urn>`) and emits it as a workflow output. The workflow
then fires the blog routine's API endpoint, passing the slug + URL in the payload (the URL is
the blog post's backlink). `main` is PR-protected, so the workflow never pushes to it.

### Comment-on-blog workflow detail

Closes the loop after a blog cross-post goes live. The site repo (`resume-static-site`) writes
`linkedinUrl` + `linkedinComment` into each routine-generated blog post's frontmatter (the blog
skill does this). When that blog PR merges, a workflow in the site repo reads those fields and
sends a `repository_dispatch` (`event_type: blog-published`) here with `linkedin_url`,
`blog_url`, `comment_text`, and `slug`. `comment-on-blog.yml` polls `blog_url` until it returns
200 (Cloudflare Pages deploy lag), then runs `npm run comment`. `src/comment-workflow.ts`
derives the post URN from `LINKEDIN_POST_URL`, skips if an identical comment already exists
(dedup on the blog URL), and calls `createComment()` → `POST /v2/socialActions/{urn}/comments`.
The same `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_PERSON_URN` secrets the publish workflow uses cover
this (scope `w_member_social`); no new secret here. The site repo holds the cross-repo PAT.

### Source modules (`src/`)

| File                  | Purpose                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `config.ts`           | `loadPublishConfig()` — loads + validates LinkedIn env vars                                 |
| `linkedin.ts`         | `createPost()` — POST to LinkedIn UGC Posts API via `fetch`, returns the URN                |
| `publish-workflow.ts` | Publish entry point: reads `POST_FILE_PATH` → `createPost()` → emits the URL                |
| `comment.ts`          | `createComment()` / `getExistingComments()` — LinkedIn socialActions comments API           |
| `comment-workflow.ts` | Comment entry point: reads `LINKEDIN_POST_URL` + `COMMENT_TEXT` → dedup → `createComment()` |

Only runtime dependency is `dotenv`. No SDK, no Octokit — native `fetch` only.

### Writing quality rules

`.claude/skills/stop-slop/` contains rules applied to every generated post: no adverbs, no
passive voice, no binary contrasts, no em-dashes, no throat-clearing openers. The research
skill reads all three files before writing.

### Comment replies (`.claude/skills/reply/`)

Manual workflow. User supplies a post path + comment text; the `reply` skill reads the post,
applies stop-slop rules, optionally Tavily-searches if the comment needs fact-checking, and
prints a drafted reply. No files, commits, or PRs — output goes to the conversation for the
user to paste into LinkedIn.

### Blog posts (`.claude/skills/blog/`)

`/blog [slug]` takes a research/posts pair (defaults to the newest) and expands it into a
long-form blog post for the separate **`resume-static-site`** repo (GitHub) — section
headings, code examples, and outbound links to the research sources, plus a backlink to the
original LinkedIn post (the publish workflow passes its URL in the routine trigger text). The skill
reads stop-slop rules and the site's live content-collection schema
(`src/content.config.ts`), writes `src/content/posts/<slug>.md` into the site checkout, runs
the site's `pnpm typecheck` to validate the schema, then branches, commits, and opens a PR
with `gh`. It skips if the site post already exists.

Runs two ways: **locally** (`/blog`, using `BLOG_REPO_DIR`, default
`$HOME/Repositories/resume-static-site`) or as the **blog routine**, fired by the publish
Action after a post merges. The routine lists **both** repos as sources (so both are checked
out) and its prompt locates the `resume-static-site` checkout itself; it opens the site PR via
the GitHub MCP, so no setup script or `gh` install is needed. Posts land gated behind the
site's `FEATURES.blog` flag; the skill never flips it.

## Key operational notes

- LinkedIn access tokens expire every ~60 days. Run `npm run auth:linkedin`, then update `LINKEDIN_ACCESS_TOKEN` in the GitHub Actions secrets.
- `scripts/research-local` is the local research runner — loads `.env`, writes a Tavily MCP config, calls `claude --print`.
- No build step — TypeScript runs directly via `tsx`.
- `GITHUB_SHA` and `github.event.before` are set automatically by GitHub Actions.

## Secrets and environment

**GitHub Actions secrets** (Settings → Secrets and variables → Actions). Store all of these as
**Secrets**, not Variables — only Secrets are masked in logs:

| Secret                    | Used by                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `LINKEDIN_ACCESS_TOKEN`   | publish                                                     |
| `LINKEDIN_PERSON_URN`     | publish                                                     |
| `BLOG_ROUTINE_FIRE_URL`   | publish (blog routine `/fire` endpoint; optional until set) |
| `BLOG_ROUTINE_FIRE_TOKEN` | publish (blog routine bearer token; optional until set)     |

**Routine environment variables** (set on the routine at claude.ai/code/routines): `TAVILY_API_KEY`
(also interpolated into `.mcp.json`), `RESEARCH_TOPIC`, `HASHTAGS`, and `BLOG_REPO_DIR` for the
blog routine. Routine env vars are visible to anyone who can edit the environment.
