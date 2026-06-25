# LinkedIn Post Generator

Automatically researches a topic, generates a LinkedIn post, and opens a PR for review. Merging the PR publishes the post to LinkedIn and cross-posts a long-form blog version to the site repo.

## How it works

```
Schedule (Mon/Wed/Fri)
       │
       ▼
 Research routine (Claude Code, Anthropic cloud)
       │
       ├─ Claude (WebSearch) finds recent articles on RESEARCH_TOPIC
       ├─ Claude picks an unused archetype and writes the post
       ├─ Commits research notes + post to a claude/… branch
       └─ Opens a PR for review (gh)
              │
              ▼
       You review & edit the post in the PR
              │
              ▼
        Merge to main
              │
              ▼
 GitHub Actions (publish.yml)
       │
       ├─ Publishes the post to LinkedIn
       └─ Fires the blog routine (passing the post URL)
              │
              ▼
 Blog routine (Claude Code) → long-form PR on resume-static-site
```

---

## First-time setup

### API keys and accounts

- **Claude** — a Pro/Max subscription (routines run on subscription quota). Sign in to [claude.ai/code](https://claude.ai/code) with the GitHub account connected.
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com), for local `npm run research` only.
- **Tavily** — [app.tavily.com](https://app.tavily.com) — local `npm run research` only; the routine uses WebSearch (WebSearch is US-only, so local non-US runs fall back to Tavily)
- **LinkedIn OAuth app** — [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
  - Create an app, add the **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** products
  - Add `http://localhost:8080/callback` as an authorized redirect URL
  - Note the **Client ID** and **Client Secret**

### Local environment (for `npm run research` / `publish` / `auth:linkedin`)

```bash
npm ci
cp .env.example .env
```

Fill in `.env`:

| Variable                 | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `ANTHROPIC_API_KEY`      | Anthropic API key (local research)                      |
| `TAVILY_API_KEY`         | Tavily API key (local search fallback)                  |
| `LINKEDIN_CLIENT_ID`     | LinkedIn OAuth app client ID                            |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth app client secret                        |
| `RESEARCH_TOPIC`         | Topic to research, e.g. `"AI in software engineering"`  |
| `HASHTAGS`               | Comma-separated hashtags, e.g. `AI,SoftwareEngineering` |

Leave `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` blank — `auth:linkedin` fills them.
Local PR creation uses your `gh` login, so run `gh auth login` once.

```bash
npm run auth:linkedin   # opens a browser, writes the two LINKEDIN_* values into .env
```

> **Token expiry:** LinkedIn access tokens last ~60 days. When the token expires, re-run `npm run auth:linkedin` and update the `LINKEDIN_ACCESS_TOKEN` GitHub Actions secret.

### GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**. Add as
**Secrets** (not Variables — only Secrets are masked in logs):

| Secret                    | Where to get it                                |
| ------------------------- | ---------------------------------------------- |
| `LINKEDIN_ACCESS_TOKEN`   | Copy from `.env` after running `auth:linkedin` |
| `LINKEDIN_PERSON_URN`     | Copy from `.env` after running `auth:linkedin` |
| `BLOG_ROUTINE_FIRE_URL`   | The blog routine's API `/fire` URL (see below) |
| `BLOG_ROUTINE_FIRE_TOKEN` | The blog routine's API bearer token            |

`GITHUB_TOKEN` is provided automatically by Actions — do not add it manually. The publish
workflow no-ops the blog-routine fire step until `BLOG_ROUTINE_FIRE_*` are set.

### Routines

Create two routines at [claude.ai/code/routines](https://claude.ai/code/routines), both pointed
at this repo:

1. **Research** — a **schedule** trigger (Mon/Wed/Fri). Prompt: run the research skill. Set
   env vars `RESEARCH_TOPIC`, `HASHTAGS`. Searches with WebSearch — no Tavily key or
   `mcp.tavily.com` allowlist needed in the cloud.
2. **Blog** — an **API** trigger, with **both** repos (`linkedin-post-generator` +
   `resume-static-site`) as sources. Prompt: run the blog skill for the slug + URL passed in
   `text` (the prompt locates the checkouts itself, so no `BLOG_REPO_DIR` or setup script is
   needed — `gh` isn't required, the GitHub MCP opens the PR). Copy its `/fire` URL + token
   into the `BLOG_ROUTINE_FIRE_*` GitHub secrets above.

---

## Day-to-day usage

### Reviewing a generated post

A PR titled `[Post] <title>` appears on the schedule. To review:

1. Open the PR on GitHub
2. Read `posts/YYYY-MM-DD-slug.md` — published to LinkedIn verbatim
3. Read `research/YYYY-MM-DD-slug.md` — the source research and citations
4. To edit locally:
   ```bash
   git fetch && git checkout claude/YYYY-MM-DD-slug
   claude   # or edit posts/YYYY-MM-DD-slug.md directly
   git commit -am "refine post" && git push
   ```
5. Merge the PR when happy — this triggers publish + the blog routine

### Turning a post into a blog post (manually)

The blog routine does this automatically on merge. To run it by hand:

```
/blog                      # newest research pair
/blog 2026-05-24-some-slug # a specific pair
```

It writes into `BLOG_REPO_DIR` (default `~/Repositories/resume-static-site`), needs a local
`gh` login, and lands the post gated behind the site's blog flag.

### Running locally end-to-end

```bash
npm run research                                    # research + open a PR (uses .env)
POST_FILE_PATH=posts/2026-05-24-some-slug.md npm run publish   # publish one post
```

---

## Project structure

```
src/
  config.ts             load + validate LinkedIn env vars
  linkedin.ts           LinkedIn UGC Posts API client (returns the post URN)
  publish-workflow.ts   POST_TEXT → LinkedIn (blog-first); legacy fallback reads merged post file
scripts/
  linkedin-auth.ts      OAuth flow to get tokens
  linkedin-refresh.ts   refresh an expired access token
  research-local        local research runner (loads .env, calls claude --print)
.claude/skills/
  research/             research + post generation (+ references/archetypes.md)
  blog/                 long-form cross-post to resume-static-site
  reply/                draft a reply to a LinkedIn comment
  stop-slop/            writing-quality rules
.github/workflows/
  post-to-linkedin.yml  dispatched linkedin_text from the site repo → post to LinkedIn (blog-first)
  publish.yml           legacy LinkedIn-first path (removed in #29)
  comment-on-blog.yml   legacy comment-back loop (removed in #29)
  pr-checks.yml         lint + typecheck on PRs
.mcp.json               Tavily remote HTTP MCP server
posts/                  generated posts (committed) + INDEX.md
research/               research notes (committed) + INDEX.md
```
