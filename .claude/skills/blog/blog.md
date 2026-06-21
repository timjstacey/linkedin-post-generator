---
name: blog
description: Expand an existing LinkedIn-post research pair into a long-form blog post in the resume-static-site repo and open a GitHub PR. Triggers on /blog with an optional slug (the research/posts filename stem). Reads research/ + posts/, applies stop-slop, writes the post in the site's Astro content-collection schema, validates, branches, commits, and opens the PR. Run it locally after the LinkedIn PR merges. Leaves the site's blog feature flag untouched.
metadata:
  trigger: /blog
---

# Blog Post Generation

Take one LinkedIn-post research pair from this repo and write a long-form blog
post into the `resume-static-site` repo, then open a GitHub PR. This runs either
**locally** (`/blog`) or as an automated **Claude Code routine** after a LinkedIn
post merges. The LinkedIn post is short; the blog post is the expanded,
evidence-backed version of the same research — with section headings, code
examples, and outbound links to the sources.

When this runs as a routine, both `linkedin-post-generator` and `resume-static-site`
are listed as routine sources, so both are checked out; the routine prompt locates
the `resume-static-site` checkout and exports `BLOG_REPO_DIR`. The PR is opened via
the GitHub MCP, so no `gh` install is needed. Locally both repos already exist and
`gh` is on your PATH. Either way the steps below are identical.

## 1. Runtime context and target repo

Run these to get required values:

```bash
date -u +%Y-%m-%d                               # TODAY
DIR="${BLOG_REPO_DIR:-$HOME/Repositories/resume-static-site}"
test -d "$DIR" || echo "MISSING: $DIR"          # site repo must be checked out
git -C "$DIR" status --porcelain                # must be empty (clean tree)
```

Stop and tell the user if `$DIR` is missing or its working tree is dirty. Do not
stash or discard their changes.

## 2. Pick the source pair

The user may pass a slug — the dated filename stem, e.g.
`2026-05-24-playwright-ai-test-explosion`. With no argument, list `research/*.md`
(exclude `INDEX.md`), sort by filename descending, and use the newest.

Read both files in full:

- `research/STEM.md` — the title (`# Research: TITLE`), the `## Summary`, and the
  `## Sources` URL list. The sources are the outbound links and the evidence.
- `posts/STEM.md` — the LinkedIn post. Use it for the angle, the core claims, and
  voice calibration. The blog post expands this; it does not copy it. The post ends
  with a line of `#Hashtags` — capture those (see step 5, `hashtags`).
  Capture the **LinkedIn URL** for the backlink in step 5 as `LINKEDIN_URL`: when run as the
  blog routine, the publish workflow passes the live post URL in the trigger text — use it. For
  a manual `/blog` run there is no URL, so skip the backlink.

Derive the **site slug** by stripping the date prefix from the stem:
`2026-05-24-playwright-ai-test-explosion` → `playwright-ai-test-explosion`. The
stripped date (`2026-05-24`) becomes the post's `date`. Also drop a trailing
`-YYYY` subject year if the slug still carries one (`playwright-ai-agents-2025` →
`playwright-ai-agents`) — the `date` field already records when it was written.

**Dedup.** If `$DIR/src/content/posts/SITE_SLUG.md` already exists, this pair has
already been blogged. Stop and report it — do not open a duplicate PR. This guard
matters most for the routine, which may fire for a pair that was blogged on an
earlier run.

## 3. Read writing rules

Read all three files in full before writing anything:

- `.claude/skills/stop-slop/stop-slop.md`
- `.claude/skills/stop-slop/references/phrases.md`
- `.claude/skills/stop-slop/references/structures.md`

Every rule applies to the blog prose. No exceptions. (Code blocks and the commit
message are exempt — write those normally.)

## 4. Read the target schema and calibrate

Do not hardcode the schema — read it live from the site repo:

- `$DIR/src/content.config.ts` — the `posts` collection schema (authoritative).
- The "Blog data" section of `$DIR/CLAUDE.md`.
- One or two existing posts under `$DIR/src/content/posts/*.md` — match their
  frontmatter shape, `preview` block style, and prose voice.
- `$DIR/astro.config.mjs` — read the `site` value (the base URL, e.g.
  `https://tim.sillysamoyed.com`). You need it to build the live blog URL for the
  auto-comment field below: `BLOG_URL = <site>/blog/SITE_SLUG`.

Required frontmatter fields (confirm against `content.config.ts`):

| Field      | Type                                            | Notes                                               |
| ---------- | ----------------------------------------------- | --------------------------------------------------- |
| `title`    | string                                          | The post title.                                     |
| `date`     | bare `YYYY-MM-DD` (parses to a JS Date)         | Unquoted, from the source stem.                     |
| `tag`      | `Strategy \| Practice \| Meta \| Team \| Tools` | Bare enum value. See mapping below.                 |
| `excerpt`  | string                                          | One sentence. Quote it if it contains a colon.      |
| `readMins` | integer                                         | `ceil(word_count / 220)`.                           |
| `preview`  | list of `[prefix, text]` tuples                 | 8–12 lines; the terminal-style cover.               |
| `hashtags` | list of strings                                 | The LinkedIn footer tags, `#` stripped (see below). |

Two more **optional** fields drive the auto-comment back to LinkedIn (see step 5). Write
them only when `LINKEDIN_URL` is set (the routine run); omit both on a manual `/blog`
run that has no source LinkedIn post:

| Field             | Type   | Notes                                                                     |
| ----------------- | ------ | ------------------------------------------------------------------------- |
| `linkedinUrl`     | string | The source LinkedIn post URL = `LINKEDIN_URL` from step 2, verbatim.      |
| `linkedinComment` | string | The comment text CI posts on that LinkedIn post once this blog goes live. |

**`hashtags`** — copy the tags from the last line of `posts/STEM.md` verbatim,
dropping the leading `#` and any surrounding whitespace. `#Playwright #SoftwareTesting`
becomes `[Playwright, SoftwareTesting]`. Preserve their casing — they drive the
Tags sidebar on the site's `/blog` page, so they must match across posts (write
`TestAutomation`, not `testautomation`). Do not invent new ones; use exactly what
the LinkedIn post shipped with.

**Tag mapping** (pick the closest; fall back to `Practice`):

- testing strategy, what-to-test, quality direction → `Strategy`
- how-to, craft, hands-on technique → `Practice`
- a specific tool / release / framework → `Tools`
- process, team, ways of working → `Team`
- writing about the blog/site itself → `Meta`

## 5. Write the post

Write `$DIR/src/content/posts/SITE_SLUG.md`.

**Frontmatter** — mirror an existing post exactly. `preview` is a `cat SITE_SLUG.md`
terminal cover: a `'$'` shell line, a `'#'` title line, a blank line, then `' '`
body lines paraphrasing the opening. Example shape:

```yaml
---
title: Pushing validation out of the UI
date: 2026-05-24
tag: Strategy
excerpt: 'Most E2E suites are a contract test in a trench coat. Four checks earn a real browser.'
readMins: 8
hashtags: [Playwright, TestAutomation, SoftwareTesting, QualityAssurance]
preview:
  - ['$', 'cat pushing-validation-out-of-the-ui.md']
  - ['#', '# Pushing validation out of the UI']
  - [' ', '']
  - [' ', 'Most E2E suites I review are a contract']
  - [' ', 'test in a trench coat. Slow, flaky,']
  - [' ', 'expensive. Most assertions belong in']
  - [' ', 'the API layer, not the browser.']
# Only on a routine run (LINKEDIN_URL set) — omit both on a manual /blog run:
linkedinUrl: https://www.linkedin.com/feed/update/urn:li:ugcPost:1234567890
linkedinComment: >
  I expanded this into a full write-up, with code and the sources it draws on:
  https://tim.sillysamoyed.com/blog/pushing-validation-out-of-the-ui
---
```

**`linkedinComment`** — when `LINKEDIN_URL` is set, write a 1–2 sentence comment that points
readers to this blog post. It must end with the live `BLOG_URL` (`<site>/blog/SITE_SLUG`, the
`site` you read in step 4). CI posts this text verbatim as a comment on the original LinkedIn
post once the blog is live, so apply every stop-slop rule and do not write a placeholder URL.

**Body** — long-form, the expanded version of the LinkedIn angle. Requirements:

- **`##` section headings** structure the piece. They drive the site's on-this-page
  TOC rail and the numbered section index, so write 3–6 real sections.
- **Code examples** in fenced blocks with a language and a file title so Expressive
  Code renders the window chrome:

  ````markdown
  ```ts title="checkout.spec.ts"
  test('checkout rejects an expired card', async ({ page }) => {
    // ...
  });
  ```
  ````

  Open the body with a code fence where it fits — the site has no hero imagery by
  design, so the lead code block is the visual hero. Add `showLineNumbers` to the
  fence meta when a block is long enough to reference by line.

- **Outbound links** `[anchor text](https://…)` to the `## Sources` URLs from the
  research file, placed inline where they back a specific claim. Every load-bearing
  fact should trace to a source. This is the evidence requirement.
- A `>` blockquote renders as a callout on the site — use one for the key takeaway
  if it earns it.
- **Backlink to LinkedIn.** If `LINKEDIN_URL` (step 2) is set, link to the original
  post once — a closing line such as `I first shared this [on LinkedIn](LINKEDIN_URL).`
  Skip it when `LINKEDIN_URL` is empty.
- Apply every stop-slop rule, same as the LinkedIn post: no adverbs, no passive
  voice, no binary contrasts, no em-dashes, no throat-clearing openers, active voice,
  no inanimate subjects performing human actions.

Aim for 700–1,400 words — a real read, not a stretched LinkedIn post.

## 6. Validate before pushing

The site validates the content-collection schema at type-check time. Run it and fix
any error before going near git:

```bash
( cd "$DIR" && pnpm typecheck )   # astro check — fails on bad frontmatter
```

Bad `tag` enum value, missing field, or malformed `preview` tuples surface here.
Re-run until clean.

## 7. Branch, commit, open the PR

The site repo is GitHub; it uses `gh`, conventional commits, and the branch
convention `type/slug`. It rebase-merges PRs. Use the `claude/blog-SITE_SLUG`
branch — the blog routine only pushes `claude/`-prefixed branches, and the site's
branch-name hook accepts the `claude` type.

```bash
cd "$DIR"
git checkout main && git pull --ff-only
git checkout -b "claude/blog-SITE_SLUG"
git add "src/content/posts/SITE_SLUG.md"
git commit -m "feat(blog): POST_TITLE"
git push -u origin "claude/blog-SITE_SLUG"    # site pre-push hook re-runs typecheck
gh pr create \
  --base main --head "claude/blog-SITE_SLUG" \
  --title "feat(blog): POST_TITLE" \
  --body "$(cat <<'EOF'
Long-form blog post generated from LinkedIn research (STEM).

## Summary

ONE_PARAGRAPH_SUMMARY

## Sources

- URL_1
- URL_2

---

Lands gated behind \`FEATURES.blog\` (still \`false\`) — the build emits no
\`/blog/*\` page for it. Review the markdown here; flip the flag when ready.
EOF
)"
```

Replace `SITE_SLUG`, `POST_TITLE`, `STEM`, `ONE_PARAGRAPH_SUMMARY`, and the source
URLs with real values. After the PR opens, print its URL to the conversation and
stop. Do not merge, and do not touch `src/lib/features.ts`.
