# LinkedIn Post Generator

A thin LinkedIn poster. Content is authored in
[`resume-static-site`](https://github.com/timjstacey/resume-static-site) (blog-first — the blog is
the canonical artifact and the LinkedIn copy is written alongside it). When a blog post merges
there, it dispatches the finished LinkedIn copy here and this repo posts it. Also drafts replies to
LinkedIn comments.

## How it works

```
resume-static-site: blog post merges to main
       │
       ▼
 publish-linkedin.yml → repository_dispatch (linkedin-publish)
       │   client_payload: { linkedin_text, blog_url, slug, comment_text?, image_url? }
       ▼
 post-to-linkedin.yml (this repo)
       │
       └─ npm run publish → createPost() → LinkedIn
              └─ createComment() → blog link as the first comment
                 (LinkedIn demotes posts with external links in the body)
```

The blog post links to LinkedIn? No — the **LinkedIn post links to the blog**, via a comment on
the post. One-way, no write-back. If the copy already contains the blog URL, the comment is
skipped.

`image_url` in `client_payload` is optional. When present, the workflow downloads the PNG and
uploads it as native LinkedIn post media before creating the post. If the upload fails, it falls
back to a text-only post — the publish never fails due to an image error.

---

## First-time setup

### LinkedIn OAuth app

[linkedin.com/developers/apps](https://www.linkedin.com/developers/apps):

- Create an app, add the **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect** products
- Add `http://localhost:8080/callback` as an authorized redirect URL
- Note the **Client ID** and **Client Secret**

### Local environment

```bash
npm ci
cp .env.example .env
```

Fill in `.env`:

| Variable                 | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `LINKEDIN_CLIENT_ID`     | LinkedIn OAuth app client ID                              |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth app client secret                          |
| `TAVILY_API_KEY`         | Optional — only for the `reply` skill's fact-check search |

Leave `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` blank — `auth:linkedin` fills them.

```bash
npm run auth:linkedin   # opens a browser, writes the two LINKEDIN_* values into .env
```

> **Token expiry:** LinkedIn access tokens last ~60 days. When the token expires, re-run
> `npm run auth:linkedin` (or `npm run refresh:linkedin`) and update the `LINKEDIN_ACCESS_TOKEN`
> GitHub Actions secret.

### GitHub Actions secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**. Add as
**Secrets** (not Variables — only Secrets are masked in logs):

| Secret                  | Where to get it                                |
| ----------------------- | ---------------------------------------------- |
| `LINKEDIN_ACCESS_TOKEN` | Copy from `.env` after running `auth:linkedin` |
| `LINKEDIN_PERSON_URN`   | Copy from `.env` after running `auth:linkedin` |

`GITHUB_TOKEN` is provided automatically by Actions. The cross-repo dispatch PAT that fires the
`linkedin-publish` event lives in `resume-static-site`, not here.

---

## Day-to-day usage

Posting is automatic: merge a blog post in `resume-static-site` and it dispatches here. To post by
hand, use the `post-to-linkedin.yml` **workflow_dispatch** (Actions tab) with `linkedin_text` (and
optionally `blog_url`), or locally:

```bash
POST_TEXT="$(cat some-post.txt)" npm run publish
```

### Drafting a reply to a comment

```
/reply <post-path> <comment text>
```

The `reply` skill reads the post, applies stop-slop rules, optionally fact-checks via Tavily, and
prints a drafted reply to paste into LinkedIn. No files, commits, or PRs.

---

## Project structure

```
src/
  config.ts             load + validate LinkedIn env vars
  linkedin.ts           LinkedIn UGC Posts API client (returns the post URN)
  publish-workflow.ts   POST_TEXT → createPost() → LinkedIn
scripts/
  linkedin-auth.ts      OAuth flow to get tokens
  linkedin-refresh.ts   refresh an expired access token
.claude/skills/
  reply/                draft a reply to a LinkedIn comment
  stop-slop/            writing-quality rules (used by reply)
.github/workflows/
  post-to-linkedin.yml  dispatched linkedin_text from the site repo → post to LinkedIn
  pr-checks.yml         lint + typecheck on PRs
.mcp.json               Tavily remote HTTP MCP server (reply fact-check)
posts/ research/        archive of posts authored under the old LinkedIn-first flow (no longer written)
```
