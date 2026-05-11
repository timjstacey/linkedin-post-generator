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

## 3. Check existing coverage

Read `posts/INDEX.md` and `research/INDEX.md`. Do not duplicate any listed angle or topic.

## 4. Research

Use the Tavily search tool to find 5–8 recent articles (last 4 weeks). Run multiple searches with different queries. Target a fresh, specific angle not already in the index.

Derive a short SLUG from the post title: lowercase, hyphens only, no special characters.

## 5. Write research notes

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

## 6. Write LinkedIn post

Write `posts/TODAY-SLUG.md`:

- First-person, professional but conversational voice
- 150–300 words
- End with 3–5 hashtags: include HASHTAGS env var values, add 1–2 topic-relevant ones
- Apply every stop-slop rule: no adverbs, no passive voice, no binary contrasts, no em-dashes, no throat-clearing openers, active voice throughout, no inanimate subjects performing human actions

## 7. Update indexes

Append one row to `posts/INDEX.md` (preserve existing rows):

```
| TODAY | POST_TITLE | ONE_SENTENCE_ANGLE | #Hashtag1 #Hashtag2 |
```

Append one row to `research/INDEX.md` (preserve existing rows):

```
| TODAY | POST_TITLE | ONE_SENTENCE_KEY_ANGLE | NUMBER sources |
```

## 8. Create branch and open PR

```bash
BRANCH="feature/TODAY-SLUG"
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
4. Merging to \`main\` automatically publishes the post to LinkedIn."
```

Replace TODAY, SLUG, POST_TITLE, RESEARCH_SUMMARY, SOURCES_LIST, ONE_SENTENCE_ANGLE, ONE_SENTENCE_KEY_ANGLE, and FOUR_WEEKS_AGO with actual values.
