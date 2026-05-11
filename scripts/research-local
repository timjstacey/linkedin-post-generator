#!/usr/bin/env bash
set -euo pipefail

# Load .env if present
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
fi

# Validate required vars
: "${ANTHROPIC_API_KEY:?Missing ANTHROPIC_API_KEY}"
: "${TAVILY_API_KEY:?Missing TAVILY_API_KEY}"
: "${RESEARCH_TOPIC:?Missing RESEARCH_TOPIC}"
: "${HASHTAGS:=}"

TODAY=$(date -u +%Y-%m-%d)

# Write Tavily MCP config
cat > /tmp/mcp-config-local.json << EOF
{
  "mcpServers": {
    "tavily": {
      "command": "npx",
      "args": ["-y", "tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    }
  }
}
EOF

claude \
  --max-turns 40 \
  --model claude-sonnet-4-6 \
  --mcp-config /tmp/mcp-config-local.json \
  --allowedTools "Bash,Read,Write,Edit,mcp__tavily__*" \
  --print "Today is ${TODAY}. Research a topic and generate a LinkedIn post.

**Topic:** ${RESEARCH_TOPIC}
**Hashtags to include:** ${HASHTAGS}

## Steps

1. Read \`posts/INDEX.md\` and \`research/INDEX.md\` to understand what angles and topics are already covered. Do not duplicate any angle listed there.

2. Read the writing rules in \`.claude/skills/stop-slop/stop-slop.md\`, \`.claude/skills/stop-slop/references/phrases.md\`, and \`.claude/skills/stop-slop/references/structures.md\`. Apply these rules when writing the post.

3. Use the Tavily search tool to find 5-8 recent articles (last 4 weeks) on the topic. Run multiple searches with different queries to find a fresh, specific angle not already in the index.

4. Derive a short slug from the post title: lowercase, hyphens only, no special characters. Call this SLUG.

5. Write a research summary to \`research/${TODAY}-SLUG.md\`:
   \`\`\`markdown
   # Research: POST_TITLE

   **Date range:** FOUR_WEEKS_AGO to ${TODAY}

   ## Summary

   KEY_INSIGHTS_HERE

   ## Sources

   - URL_1
   - URL_2
   \`\`\`

6. Write the LinkedIn post to \`posts/${TODAY}-SLUG.md\`:
   - First-person, professional but conversational voice
   - 150-300 words
   - End with 3-5 hashtags (include the provided hashtags, add 1-2 topic-relevant ones)
   - Apply all stop-slop rules strictly: no adverbs, no passive voice, no binary contrasts, no em-dashes, no throat-clearing openers, active voice throughout

7. Append one row to \`posts/INDEX.md\` (keep existing rows, add at the end):
   \`\`\`
   | ${TODAY} | POST_TITLE | ONE_SENTENCE_ANGLE | #Hashtag1 #Hashtag2 |
   \`\`\`

8. Append one row to \`research/INDEX.md\` (keep existing rows, add at the end):
   \`\`\`
   | ${TODAY} | POST_TITLE | ONE_SENTENCE_KEY_ANGLE | NUMBER sources |
   \`\`\`

9. Create a branch, commit, and open a PR:
   \`\`\`bash
   BRANCH=\"feature/${TODAY}-SLUG\"
   git checkout -b \"\$BRANCH\"
   git add posts/ research/
   git commit -m \"feat: add post - POST_TITLE\"
   git push origin \"\$BRANCH\"
   gh pr create \\
     --title \"[Post] POST_TITLE\" \\
     --body \"## POST_TITLE

   ### Research Summary

   RESEARCH_SUMMARY

   ### Sources

   SOURCES_LIST

   ---

   ### Reviewer Instructions

   1. Review the post in \\\`posts/${TODAY}-SLUG.md\\\`
   2. To iterate locally:
      \\\`\\\`\\\`
      git checkout \$BRANCH
      claude
      \\\`\\\`\\\`
   3. Push changes and merge when satisfied.
   4. Merging to \\\`main\\\` automatically publishes the post to LinkedIn.\"
   \`\`\`

Replace SLUG, POST_TITLE, RESEARCH_SUMMARY, SOURCES_LIST, ONE_SENTENCE_ANGLE, ONE_SENTENCE_KEY_ANGLE, and FOUR_WEEKS_AGO with actual values derived from your research."
