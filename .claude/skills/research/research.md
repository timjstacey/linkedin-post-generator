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

**Style calibration.** Note sentence length distribution and paragraph density, and match this voice in the new post. Do not copy how the recent posts open and close — the opener and closer come from the archetype you select in the next step, not from these posts. A post never closes with a summary, whatever its archetype.

## 4. Check existing coverage

Read `posts/INDEX.md` and `research/INDEX.md`. Do not duplicate any listed angle or topic.

## 5. Select archetype

Read `.claude/skills/research/references/archetypes.md`.

Read the `Archetype` column of `posts/INDEX.md`. Collect the archetype labels from the **last
three rows** — those are off-limits this run. From the remaining archetypes, pick the one that
best fits the research you are about to do. Read that archetype's opener / body / closer shape;
you write the post to it in step 8.

The archetype controls structure only. Every stop-slop rule still applies regardless of which
archetype you pick.

## 6. Research

Use the Tavily search tool to find 5–8 recent articles (last 4 weeks). Run multiple searches with different queries. Target a fresh, specific angle not already in the index.

Derive a short SLUG from the post title: lowercase, hyphens only, no special characters.
Omit any subject year — the dated filename prefix already records when the post was
written, so the slug should not repeat it (`playwright-ai-agents`, not
`playwright-ai-agents-2025`).

## 7. Write research notes

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

## 8. Write LinkedIn post

Write `posts/TODAY-SLUG.md`:

- First-person, professional but conversational voice
- Structure the post to the archetype you selected in step 5: its opener shape, body movement, and closer shape
- 150–300 words
- End with 3–5 hashtags using this logic:
  - If `HASHTAGS` is empty or unset: generate 3–5 hashtags from the post content and topic
  - If `HASHTAGS` is set: use every value from it, then add topic-relevant hashtags until the total reaches 3–5
  - Never exceed 5 hashtags total
- Apply every stop-slop rule: no adverbs, no passive voice, no binary contrasts, no em-dashes, no throat-clearing openers, active voice throughout, no inanimate subjects performing human actions

## 9. Update indexes

Append one row to `posts/INDEX.md` (preserve existing rows). Put the archetype Label you
selected in step 5 in the `Archetype` column, verbatim from `references/archetypes.md`:

```
| TODAY | POST_TITLE | ONE_SENTENCE_ANGLE | ARCHETYPE_LABEL | #Hashtag1 #Hashtag2 |
```

Append one row to `research/INDEX.md` (preserve existing rows):

```
| TODAY | POST_TITLE | ONE_SENTENCE_KEY_ANGLE | NUMBER sources |
```

## 10. Create branch and open PR

The branch must be `claude/`-prefixed: routines only push to `claude/`-prefixed branches by
default.

```bash
BRANCH="claude/TODAY-SLUG"
git checkout -b "$BRANCH"
git add posts/ research/
git commit -m "feat: add post - POST_TITLE"
git push origin "$BRANCH"
gh pr create \
  --title "[Post] POST_TITLE" \
  --body "## POST_TITLE

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
