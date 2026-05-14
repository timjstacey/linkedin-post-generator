You spend an afternoon writing Playwright tests. They pass on your machine. Push to CI and three fail on the checkout flow, two fail on random runs. You open traces, fix locators, push again. Two weeks later you are still at it.

Playwright v1.59, released April 1st, shipped a different approach. Three agents now cover the full test lifecycle. The Planner converts a feature description into a Markdown spec. The Generator converts that spec into TypeScript with role-based locators and fixture scaffolding. The Healer runs failing tests, reads accessibility-tree snapshots, distinguishes a stale locator from a real application bug, patches it, and confirms the fix passes.

The new `page.screencast` API produces a video with chapter markers and action annotations. When the Healer fixes a checkout test, that video lands in CI artifacts with a "Checkout" chapter you can scrub to. No log parsing.

`browser.bind()` exposes a running browser under a named session so your agent, MCP server, and CLI debugger all share one browser. You attach from a second terminal, watch the Healer work, intervene if it stalls, and detach.

You shift from debugging selectors to reviewing agent-produced evidence. Coverage decisions and novel failures become the actual work.

Start with `npx playwright agents --loop=vscode`. Feed the Generator a seed spec that shows your locator conventions and it matches your project's patterns.

#Playwright #TestAutomation #AITesting #QA #CI
