# LinkedIn Post Generator — Implementation Guide

This document is the source of truth for implementing this project. A future Claude session should read this file and carry out each step in order. Do not begin implementation until explicitly asked.

## What This Project Does

Automated LinkedIn post generator that:
1. Runs on a GitHub Actions schedule
2. Uses Claude AI + Tavily web search to research a topic
3. Generates a LinkedIn post, commits it to a feature branch, and opens a PR
4. When the PR is merged to `main`, publishes the post via the LinkedIn API

## Technology Decisions

- **Runtime**: Node.js v24.15.0 (see `.nvmrc`)
- **Language**: TypeScript, executed directly via `tsx` (no separate build step)
- **Module system**: ES modules (`"type": "module"`)
- **AI**: `@anthropic-ai/sdk` with prompt caching enabled
- **Web search**: Tavily API, registered as a Claude tool
- **GitHub API**: `@octokit/rest` for branch/commit/PR operations
- **LinkedIn API**: native `fetch` → UGC Posts API
- **Topic source**: `RESEARCH_TOPIC` environment variable / GitHub Actions secret
- **Images**: text-only (deferred for later)

---

## Directory Structure (target state)

```
linkedin-post-generator/
├── .env.example
├── .gitignore
├── CLAUDE.md                         ← this file
├── .github/
│   └── workflows/
│       ├── research.yml              # scheduled: research → post → PR
│       └── publish.yml              # on merge to main: post to LinkedIn
├── src/
│   ├── config.ts                    # load + validate env vars
│   ├── research.ts                  # Claude + Tavily research module
│   ├── post-generator.ts            # Claude post generation module
│   ├── linkedin.ts                  # LinkedIn UGC Posts API client
│   ├── github.ts                    # branch / commit / PR via @octokit/rest
│   ├── research-workflow.ts         # orchestrates research → PR creation
│   └── publish-workflow.ts          # reads latest post → LinkedIn
├── posts/                           # generated posts (tracked in git)
│   └── .gitkeep
├── research/                        # research notes (tracked in git)
│   └── .gitkeep
└── tsconfig.json
```

---

## Implementation Steps

### Step 1 — Project Configuration

**`package.json` changes:**
- Change `"type"` from `"commonjs"` to `"module"`
- Change `"main"` to `"src/research-workflow.ts"`
- Add scripts:
  - `"research": "tsx src/research-workflow.ts"`
  - `"publish": "tsx src/publish-workflow.ts"`
- Add runtime dependencies:
  - `@anthropic-ai/sdk` — Claude AI
  - `@tavily/core` — Tavily web search
  - `dotenv` — env file loading
  - `@octokit/rest` — GitHub API for branch/PR
- Add dev dependencies:
  - `typescript`
  - `tsx`
  - `@types/node`

**`tsconfig.json`** (create):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

**`.env.example`** (create):
```
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_URN=          # urn:li:person:{id}
RESEARCH_TOPIC=               # e.g. "AI in software engineering"
HASHTAGS=                     # comma-separated, e.g. AI,SoftwareEngineering
GITHUB_TOKEN=                 # auto-provided in Actions; set manually for local runs
GITHUB_REPO=                  # owner/repo format
```

**`.gitignore`** (create/update): ensure `.env` and `node_modules/` are ignored.

---

### Step 2 — Core Modules

#### `src/config.ts`
- Load `.env` via `dotenv/config`
- Validate required vars are present; throw descriptive errors if not
- Export a typed `Config` object used by all other modules
- Split validation by workflow: research needs Anthropic + Tavily + GitHub creds; publish needs LinkedIn + GitHub creds

#### `src/research.ts`
- Signature: `research(topic: string, existingResearch: string[], existingPosts: string[]): Promise<ResearchResult>`
- Calls Claude (`claude-sonnet-4-6`) using `@anthropic-ai/sdk`
- Registers Tavily `search` as a Claude tool via the `tools` array
- Claude iteratively calls `search` to gather recent (last ~4 weeks) articles and data
- System prompt includes summaries of existing research notes and post titles to avoid duplication
- Returns: `{ summary: string, sources: string[], dateRange: string }`
- Uses **prompt caching** (`cache_control: { type: 'ephemeral' }`) on the system prompt + existing context block

#### `src/post-generator.ts`
- Signature: `generatePost(research: ResearchResult, existingPosts: string[], config: Config): Promise<PostResult>`
- Calls Claude with the research summary + existing post content for style reference
- Prompt instructs Claude to:
  - Write in first-person, professional but conversational LinkedIn voice
  - Target 150–300 words
  - End with exactly 3–5 hashtags (merge topic-relevant ones with `HASHTAGS` from config)
- Returns: `{ title: string, slug: string, content: string }`
- Uses **prompt caching** on the existing posts context block

#### `src/linkedin.ts`
- `createPost(text: string, accessToken: string, personUrn: string): Promise<string>`
- Uses native `fetch` (Node 24) to call `POST https://api.linkedin.com/v2/ugcPosts`
- Returns the LinkedIn post URN on success
- Throws on non-2xx with the API error body included

#### `src/github.ts`
- Uses `@octokit/rest` authenticated with `GITHUB_TOKEN`
- `createBranch(repo: string, branchName: string): Promise<void>` — creates branch off `main` HEAD
- `commitFiles(repo: string, branch: string, files: { path: string; content: string }[], message: string): Promise<void>` — creates/updates files via the Git tree API (works in GitHub Actions without a local checkout)
- `createPullRequest(repo: string, branch: string, title: string, body: string): Promise<string>` — returns the PR URL

---

### Step 3 — Workflow Entry Points

#### `src/research-workflow.ts`
Orchestration for the scheduled GitHub Actions job:
1. Load config (research mode)
2. Read all `research/*.md` and `posts/*.md` from the repo via Octokit
3. Call `research(topic, existingResearch, existingPosts)`
4. Call `generatePost(researchResult, existingPosts, config)`
5. Derive `DATE` (YYYY-MM-DD) and `POST-TITLE` slug from the post title
6. Call `createBranch` for `feature/${DATE}-${POST-TITLE}`
7. Call `commitFiles` with:
   - `research/${DATE}-${POST-TITLE}.md` — full research notes + sources
   - `posts/${DATE}-${POST-TITLE}.md` — the LinkedIn post content
8. Call `createPullRequest` titled `[Post] ${post.title}` with research summary + reviewer instructions as the PR body

#### `src/publish-workflow.ts`
Orchestration for the merge-to-main trigger:
1. Load config (publish mode)
2. Detect which post `.md` file was added in the triggering commit (via `GITHUB_SHA` + Octokit commit diff API)
3. Read that post's `.md` content
4. Extract the post body + hashtags
5. Call `createPost()` to publish to LinkedIn
6. Log the resulting LinkedIn post URL

---

### Step 4 — GitHub Actions Workflows

#### `.github/workflows/research.yml`
```yaml
name: Research & Generate Post

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday 09:00 UTC
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  research-and-post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run research
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
          RESEARCH_TOPIC: ${{ secrets.RESEARCH_TOPIC }}
          HASHTAGS: ${{ secrets.HASHTAGS }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
```

#### `.github/workflows/publish.yml`
```yaml
name: Publish Post to LinkedIn

on:
  push:
    branches: [main]
    paths:
      - 'posts/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run publish
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
          LINKEDIN_PERSON_URN: ${{ secrets.LINKEDIN_PERSON_URN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPO: ${{ github.repository }}
          GITHUB_SHA: ${{ github.sha }}
```

---

### Step 5 — Feedback Support (Local)

No separate script is needed. The PR body (generated by the research workflow) should instruct reviewers to:
1. `git checkout feature/DATE-POST-TITLE`
2. Open the post `.md` file
3. Run Claude Code (`claude`) and iterate on the post content directly
4. Commit changes and push to the branch

---

## Files to Create or Modify

| File | Action |
|---|---|
| `package.json` | Modify — add deps, scripts, change type to module |
| `tsconfig.json` | Create |
| `.env.example` | Create |
| `.gitignore` | Create/update |
| `src/config.ts` | Create |
| `src/research.ts` | Create |
| `src/post-generator.ts` | Create |
| `src/linkedin.ts` | Create |
| `src/github.ts` | Create |
| `src/research-workflow.ts` | Create |
| `src/publish-workflow.ts` | Create |
| `.github/workflows/research.yml` | Create |
| `.github/workflows/publish.yml` | Create |
| `posts/.gitkeep` | Create |
| `research/.gitkeep` | Create |

---

## Verification

1. **Local research run**: Populate `.env`, run `npm run research` — a feature branch and PR should appear in the repo containing research notes + post file
2. **Local publish run**: Set LinkedIn creds in `.env`, run `npm run publish` — post should appear on LinkedIn
3. **GitHub Actions**: Trigger `research.yml` via `workflow_dispatch`; verify branch + PR created. Merge the PR; verify `publish.yml` fires and posts to LinkedIn
4. **Lint**: `npx eslint src/` passes with no errors

---

## GitHub Actions Secrets Required

Configure these in the repository Settings → Secrets and variables → Actions:

| Secret | Required for |
|---|---|
| `ANTHROPIC_API_KEY` | Both workflows |
| `TAVILY_API_KEY` | Research workflow |
| `RESEARCH_TOPIC` | Research workflow |
| `HASHTAGS` | Research workflow (optional) |
| `LINKEDIN_ACCESS_TOKEN` | Publish workflow |
| `LINKEDIN_PERSON_URN` | Publish workflow |

`GITHUB_TOKEN` is auto-provided by Actions — no manual secret needed.
