# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

A **thin LinkedIn poster + reply tool**. Content authoring lives in
[`resume-static-site`](https://github.com/timjstacey/resume-static-site) (blog-first: the blog
is the canonical artifact and the LinkedIn copy is written alongside it). This repo keeps only
LinkedIn-domain tooling:

1. `resume-static-site` merges a blog post → its `publish-linkedin.yml` `repository_dispatch`es a
   `linkedin-publish` event here with the finished LinkedIn copy.
2. `post-to-linkedin.yml` posts that copy verbatim via the LinkedIn API, then comments the blog
   link on the new post (LinkedIn demotes posts with external links in the body, so the link rides
   in a comment). The link runs **one way** (LinkedIn → blog) — nothing is written back. If the
   copy already contains the blog URL, the comment is skipped.
3. The `reply` skill drafts replies to LinkedIn comments (manual), and the OAuth scripts manage the
   ~60-day token lifecycle.

## Commands

```bash
npm run lint          # ESLint on src/
npm run lint:fix      # ESLint --fix on src/
npm run typecheck     # tsc --noEmit
npm run format        # Prettier on everything
npm run publish       # post to LinkedIn (requires POST_TEXT + LinkedIn env vars)
npm run auth:linkedin # OAuth flow → writes LINKEDIN_ACCESS_TOKEN + LINKEDIN_PERSON_URN to .env
npm run refresh:linkedin # refresh an expired LinkedIn token
```

**Git hooks (husky):**

- `pre-commit` — runs `lint-staged` (prettier + eslint on staged files)
- `pre-push` — runs `npm run typecheck`

## Architecture

**This is a GitHub repo** (`timjstacey/linkedin-post-generator`). Workflows live in
`.github/workflows/`. The `gh` CLI creates PRs. No build step — TypeScript runs directly via `tsx`.
The only runtime dependency is `dotenv`; native `fetch` only, no SDK / Octokit.

### Triggers

| Trigger                                  | Kind                                                                   | What it does                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/post-to-linkedin.yml` | `repository_dispatch` (`linkedin-publish`) from the site repo + manual | Posts the dispatched `linkedin_text` verbatim via `npm run publish`, then comments the blog link on the new post. The poster path. |
| `.github/workflows/pr-checks.yml`        | PR to `main`                                                           | `npm run lint` + `npm run typecheck`                                                                                               |

### Post-to-LinkedIn workflow detail

`resume-static-site` authors the blog **and** the LinkedIn copy, then on merge dispatches the
finished text here (`repository_dispatch`, `event_type: linkedin-publish`, `client_payload:
{ linkedin_text, blog_url, slug, comment_text?, image_url? }`). `post-to-linkedin.yml` reads `linkedin_text` +
`blog_url` + `comment_text` via `env:` (script-injection-safe — never interpolated into the run
script) and runs `npm run publish`. `src/publish-workflow.ts` reads `POST_TEXT`, calls
`createPost()`, logs the resulting URL, then calls `createComment()` on the new URN with
`COMMENT_TEXT` (default: `Full write-up: <blog_url>`). The comment is skipped when the blog URL is
already in the copy (no double link) or when neither `comment_text` nor `blog_url` is supplied.
`slug` is unused here. A `workflow_dispatch` with `linkedin_text` / `blog_url` / `comment_text`
inputs posts by hand. `image_url` (optional public PNG URL) is uploaded as native post media via
`uploadImage()` before `createPost()`; if the upload fails, the post falls back to text-only.

The cross-repo dispatch PAT lives in `resume-static-site` (scoped to write this repo); it fires the
`linkedin-publish` event. This repo only needs the `LINKEDIN_*` secrets to post.

### Source modules (`src/`)

| File                  | Purpose                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `config.ts`           | `loadPublishConfig()` — loads + validates LinkedIn env vars                                                                 |
| `linkedin.ts`         | `createPost()` + `uploadImage()` — LinkedIn UGC Posts API + image asset upload; `createPost` takes optional image asset URN |
| `comment.ts`          | `createComment()` — POST to the LinkedIn socialActions API, returns the URN                                                 |
| `publish-workflow.ts` | Publish entry point: `POST_TEXT` → `createPost()` → comment the blog link                                                   |

### Writing quality rules

`.claude/skills/stop-slop/` contains rules applied to drafted replies: no adverbs, no passive
voice, no binary contrasts, no em-dashes, no throat-clearing openers. The `reply` skill reads
these before drafting.

### Comment replies (`.claude/skills/reply/`)

Manual workflow. User supplies a post path + comment text; the `reply` skill reads the post,
applies stop-slop rules, optionally Tavily-searches (`.mcp.json`) if the comment needs
fact-checking, and prints a drafted reply. No files, commits, or PRs — output goes to the
conversation for the user to paste into LinkedIn.

## Key operational notes

- LinkedIn access tokens expire every ~60 days. Run `npm run auth:linkedin`, then update
  `LINKEDIN_ACCESS_TOKEN` in the GitHub Actions secrets (`npm run refresh:linkedin` refreshes one).
- `GITHUB_SHA` and `github.event.before` are set automatically by GitHub Actions.

## Secrets and environment

**GitHub Actions secrets** (Settings → Secrets and variables → Actions). Store as **Secrets**,
not Variables — only Secrets are masked in logs:

| Secret                  | Used by |
| ----------------------- | ------- |
| `LINKEDIN_ACCESS_TOKEN` | publish |
| `LINKEDIN_PERSON_URN`   | publish |

**Local `.env`** (for `npm run publish` / `auth:linkedin`): the same `LINKEDIN_*` values, plus
`TAVILY_API_KEY` if you use the `reply` skill's optional fact-check search.
