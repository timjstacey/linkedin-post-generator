---
name: research
description: Research a topic and generate a LinkedIn post. Reads RESEARCH_TOPIC and HASHTAGS from environment, creates a feature branch with research notes and post file, opens a PR.
metadata:
  trigger: /research
---

# Research & Post Generation

## 1. Get runtime context

Run these commands to get required values:

```bash
date -u +%Y-%m-%d     # TODAY
echo "$RESEARCH_TOPIC" # topic — pick one specific angle from the list
echo "$HASHTAGS"       # hashtags to include
```

## 2. Read writing rules

Read all three files in full before writing anything:

- `.claude/skills/stop-slop/stop-slop.md`
- `.claude/skills/stop-slop/references/phrases.md`
- `.claude/skills/stop-slop/references/structures.md`

Every rule applies to the post. No exceptions.

## 3. Read recent posts

List `posts/*.md` excluding `INDEX.md`, sort by filename descending (YYYY-MM-DD prefix ensures lexicographic sort is correct), and read the three most recent files in full.

Use these posts for two purposes:

**Overlap detection.** Note the specific claims, statistics, product names, and mechanisms each post covers. A new post must not repeat the same specific facts or arguments even if the angle label looks different. "Playwright MCP enables AI agents" and "Playwright MCP cuts locator maintenance costs" share the same core mechanism — both are off-limits for a new Playwright MCP post.

**Style calibration.** Note sentence length distribution, paragraph density, how each post opens (a number, a cost figure, a direct claim — not a question, not a scene-setter), and how each post closes (a direct statement or reader question, never a summary). Match this voice in the new post.

## 4. Check existing coverage

Read `posts/INDEX.md` and `research/INDEX.md`. Do not duplicate any listed angle or topic.

## 5. Research

Use the Tavily search tool to find 5–8 recent articles (last 4 weeks). Run multiple searches with different queries. Target a fresh, specific angle not already in the index.

Derive a short SLUG from the post title: lowercase, hyphens only, no special characters.
Omit any subject year — the dated filename prefix already records when the post was
written, so the slug should not repeat it (`playwright-ai-agents`, not
`playwright-ai-agents-2025`).

## 6. Write research notes

Write `research/TODAY-SLUG.md`:

```markdown
# Research: POST_TITLE

**Date range:** FOUR_WEEKS_AGO to TODAY

## Summary

KEY_INSIGHTS_HERE

## Sources

- URL_1
- URL_2
```

## 7. Write LinkedIn post

Write `posts/TODAY-SLUG.md`:

- First-person, professional but conversational voice
- 150–300 words
- End with 3–5 hashtags using this logic:
  - If `HASHTAGS` is empty or unset: generate 3–5 hashtags from the post content and topic
  - If `HASHTAGS` is set: use every value from it, then add topic-relevant hashtags until the total reaches 3–5
  - Never exceed 5 hashtags total
- Apply every stop-slop rule: no adverbs, no passive voice, no binary contrasts, no em-dashes, no throat-clearing openers, active voice throughout, no inanimate subjects performing human actions

## 8. Update indexes

Append one row to `posts/INDEX.md` (preserve existing rows):

```
| TODAY | POST_TITLE | ONE_SENTENCE_ANGLE | #Hashtag1 #Hashtag2 |
```

Append one row to `research/INDEX.md` (preserve existing rows):

```
| TODAY | POST_TITLE | ONE_SENTENCE_KEY_ANGLE | NUMBER sources |
```

## 9. Create branch and open PR

```bash
BRANCH="feature/TODAY-SLUG"
git checkout -b "$BRANCH"
git add posts/ research/
git commit -m "feat: add post - POST_TITLE"
git push origin "$BRANCH"
tea pr create \
  --title "[Post] POST_TITLE" \
  --description "## POST_TITLE

### Research Summary

RESEARCH_SUMMARY

### Sources

SOURCES_LIST

---

### Reviewer Instructions

1. Review the post in \`posts/TODAY-SLUG.md\`
2. To iterate locally:
   \`\`\`
   git checkout $BRANCH
   claude
   \`\`\`
3. Push changes and merge when satisfied.
4. Merging to \`main\` automatically publishes the post to LinkedIn." \
  --head "$BRANCH" \
  --base main
```

Replace TODAY, SLUG, POST_TITLE, RESEARCH_SUMMARY, SOURCES_LIST, ONE_SENTENCE_ANGLE, ONE_SENTENCE_KEY_ANGLE, and FOUR_WEEKS_AGO with actual values.
