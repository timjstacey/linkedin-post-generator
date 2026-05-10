# LinkedIn Post Generator

Automatically researches a topic, generates a LinkedIn post, and opens a PR for review. Merging the PR publishes the post to LinkedIn.

## How it works

```
Every Monday 09:00 UTC
       │
       ▼
 GitHub Actions (research.yml)
       │
       ├─ Claude + Tavily search recent articles on RESEARCH_TOPIC
       ├─ Claude generates LinkedIn post
       ├─ Commits research notes + post to feature branch
       └─ Opens PR for review
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
       └─ Publishes post to LinkedIn
```

---

## First-time setup

### Step 1 — Get API keys

You need accounts and API keys for:

- **Anthropic** — [console.anthropic.com](https://console.anthropic.com)
- **Tavily** — [app.tavily.com](https://app.tavily.com)
- **LinkedIn OAuth app** — [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
  - Create an app, add the **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** products
  - Add `http://localhost:8080/callback` as an authorized redirect URL
  - Note the **Client ID** and **Client Secret**

### Step 2 — Install dependencies

```bash
npm ci
```

### Step 3 — Configure local environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable                 | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`      | Anthropic API key                                             |
| `TAVILY_API_KEY`         | Tavily API key                                                |
| `LINKEDIN_CLIENT_ID`     | LinkedIn OAuth app client ID                                  |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth app client secret                              |
| `RESEARCH_TOPIC`         | Topic to research, e.g. `"AI in software engineering"`        |
| `HASHTAGS`               | Comma-separated hashtags, e.g. `AI,SoftwareEngineering`       |
| `GITHUB_TOKEN`           | Personal access token with `contents` + `pull-requests` write |
| `GITHUB_REPO`            | Your repo in `owner/repo` format, e.g. `timjstacey/my-repo`  |

Leave `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` blank — the next step fills them in.

### Step 4 — Authenticate with LinkedIn

```bash
npm run auth:linkedin
```

This opens a browser, asks you to authorise the app, then writes `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` into `.env`.

> **Token expiry:** LinkedIn access tokens last 60 days. When the token expires, re-run `npm run auth:linkedin` and repeat Step 5 to update the GitHub secret.

### Step 5 — Add GitHub Actions secrets

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret                  | Where to get it                                    |
| ----------------------- | -------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | Anthropic console                                  |
| `TAVILY_API_KEY`        | Tavily dashboard                                   |
| `RESEARCH_TOPIC`        | Your chosen topic string                           |
| `HASHTAGS`              | Comma-separated, optional                          |
| `LINKEDIN_ACCESS_TOKEN` | Copy from `.env` after running `auth:linkedin`     |
| `LINKEDIN_PERSON_URN`   | Copy from `.env` after running `auth:linkedin`     |

`GITHUB_TOKEN` is provided automatically by Actions — do not add it manually.

### Step 6 — Add GitHub Actions workflow files

Create `.github/workflows/research.yml` and `.github/workflows/publish.yml` using the YAML in `CLAUDE.md` Step 4. These activate the scheduled research and publish-on-merge behaviours.

---

## Day-to-day usage

### Reviewing a generated post

Each Monday a PR will appear titled `[Post] <title>`. To review:

1. Open the PR on GitHub
2. Read `posts/YYYY-MM-DD-slug.md` — this is what gets published to LinkedIn verbatim
3. Read `research/YYYY-MM-DD-slug.md` — the source research and citations
4. To edit the post locally:
   ```bash
   git fetch && git checkout feature/YYYY-MM-DD-slug
   # edit posts/YYYY-MM-DD-slug.md directly, or use Claude Code:
   claude
   git add posts/YYYY-MM-DD-slug.md && git commit -m "refine post"
   git push
   ```
5. Merge the PR when happy — this triggers the publish workflow

### Triggering research manually

Go to **Actions → Research & Generate Post → Run workflow** in the GitHub UI, or:

```bash
npm run research
```

### Running locally end-to-end

```bash
# Research and open a PR (uses .env for all config)
npm run research

# Publish a specific post (simulates what Actions does on merge)
GITHUB_SHA=<merge-commit-sha> npm run publish
```

---

## Maintenance

### Rotating the LinkedIn access token (every ~60 days)

```bash
npm run auth:linkedin
```

Then update `LINKEDIN_ACCESS_TOKEN` in GitHub secrets with the new value from `.env`.

---

## Project structure

```
src/
  config.ts             load + validate env vars
  research.ts           Claude + Tavily research loop
  post-generator.ts     Claude post generation
  linkedin.ts           LinkedIn UGC Posts API client
  github.ts             branch / commit / PR via Octokit
  research-workflow.ts  orchestrates research → PR
  publish-workflow.ts   reads merged post → LinkedIn
scripts/
  linkedin-auth.ts      OAuth flow to get tokens
  linkedin-refresh.ts   refresh an expired access token (requires refresh token support)
posts/                  generated posts (committed to git)
research/               research notes (committed to git)
.github/workflows/
  research.yml          scheduled: research → post → PR
  publish.yml           on merge to main: post to LinkedIn
```
