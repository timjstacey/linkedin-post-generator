# Playwright's Healer Agent Automates Selector Fixes. Budget the Token Cost.

QA teams spend 40% of their time on test maintenance, according to Autonoma's State of QA 2025. If you work with Playwright, most of that goes to broken selectors after UI changes.

Playwright 1.56 shipped three built-in AI agents: a Planner that converts natural language scenarios into test plans, a Generator that writes Playwright TypeScript from those plans, and a Healer that patches broken selectors when tests fail in CI.

The Healer changes the maintenance equation. After a UI change breaks a selector, the Healer re-inspects the accessibility tree, identifies the correct element, and updates the selector. The fix lands in a PR for human review before it merges.

Two things worth knowing before adopting this:

Selector strategy matters upstream. The Generator defaults to `getByRole()` and `getByText()` locators. Those accessibility-tree-first selectors break less often than CSS or XPath, so the Healer runs less. Stable locators reduce the surface area the Healer has to cover as your suite grows.

Budget the token cost. Each Healer invocation in CI runs around 114,000 tokens. Occasional failures are manageable. A flaky suite will cost you. Fix root causes before layering AI repair on top.

The teams seeing real returns use the Generator with accessibility-first locators, invoke the Healer on specific failures, and treat AI-generated patches as code requiring review before merge.

#AI #SoftwareTesting #Playwright #TestAutomation #DevOps
