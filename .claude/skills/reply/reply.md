---
name: reply
description: Draft a reply to a LinkedIn comment on one of our posts. Triggers when the user provides a path to a file under `posts/` together with comment text (quoted, pasted, or described as "a comment on this post"). Reads the post, applies stop-slop rules, optionally searches Tavily if the comment makes a factual claim worth verifying, and prints a drafted reply. Does not write files, commit, or push.
metadata:
  trigger: /reply
---

# Comment Reply Generation

## Inputs

The user supplies:

- A relative path to a post file under `posts/` (e.g. `posts/2026-05-14-playwright-1-59-healer-agent-ci.md`)
- The comment text to reply to (quoted or pasted)

If either is missing or ambiguous, ask once before proceeding.

## 1. Read the post

Read the supplied post file in full. Note the post's specific claims, stance, examples, and voice.

## 2. Read writing rules

Read all three files in full before drafting:

- `.claude/skills/stop-slop/stop-slop.md`
- `.claude/skills/stop-slop/references/phrases.md`
- `.claude/skills/stop-slop/references/structures.md`

Every rule applies to the reply. No exceptions.

## 3. Classify the comment

Pick one category. The category drives the reply shape:

- **Agreement / amplification** — commenter agrees, adds an example. Reply: thank by acknowledging the specific point they added, extend with one concrete detail. Do not restate the post.
- **Counter / disagreement** — commenter pushes back. Reply: name the specific point of disagreement, concede what is valid, hold the line on what stands and say why in one sentence. No hedging, no "great point".
- **Question** — commenter asks something. Reply: answer directly in the first sentence, then add at most one sentence of context. If the answer requires facts not in the post, go to step 4.
- **Tangent / unrelated** — commenter raises a related-but-different topic. Reply: acknowledge the connection in one clause, redirect to the post's actual scope, or engage briefly if cheap.
- **Spam / low-effort** — no reply worth drafting. Tell the user and stop.

## 4. Optional research

Only if the comment makes a factual claim that needs verification, or asks a question whose answer is not in the post or the original research notes:

- Check `research/SAME-SLUG.md` first (matching the post filename)
- If still unanswered, run one or two targeted Tavily searches
- Cite the source URL in the reply only when it adds load-bearing evidence; otherwise keep the reply source-free

## 5. Draft the reply

Constraints:

- 40–120 words. Shorter is better. LinkedIn comment replies that scroll lose readers.
- First-person, conversational, same voice as the post
- Open with substance, not pleasantry. No "Great point", "Thanks for sharing", "Absolutely". No throat-clearing.
- One idea per reply. Do not stack a thank-you, a counter, and a question.
- No hashtags. No emoji unless the original commenter used one and matching tone helps.
- Apply every stop-slop rule: no adverbs, no passive voice, no binary contrasts, no em-dashes, active voice, no inanimate subjects performing human actions.
- Address the commenter by first name only if the user supplies it; otherwise no name.

## 6. Output

Print the drafted reply to the conversation in a fenced code block so the user can copy it cleanly. Below the block, in one line, state which category you classified the comment as and any source URL used. Do not write files, do not stage, do not commit, do not push.

If the user asks for revisions, iterate in the conversation. Each revision re-applies the stop-slop rules.
