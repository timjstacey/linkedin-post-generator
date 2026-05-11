# Research: Playwright's Healer Agent Automates Selector Fixes. Budget the Token Cost.

**Date range:** 2026-04-13 to 2026-05-11

## Summary

Playwright 1.56 (late 2025) shipped three built-in AI agents: Planner (natural language → test plan), Generator (test plan → Playwright TypeScript), and Healer (auto-patches broken selectors on CI failure). The Healer re-inspects the live accessibility tree after a failure, identifies the correct element, and submits a selector fix as a PR for human review.

Key findings:

- Autonoma's State of QA 2025 reports 40% of QA team time goes to test maintenance, with selector rot as the primary driver.
- The Healer invocation costs ~114,000 tokens per failing test in CI (Currents.dev). Manageable for occasional failures; expensive on a flaky suite.
- Playwright MCP uses structured accessibility tree snapshots (2-5KB YAML) rather than screenshots (500KB-2MB), making it 10-100x more token-efficient for interactive steps vs. vision-based approaches.
- The Generator defaults to `getByRole()` and `getByText()` locators (accessibility-tree-first), which break less often than CSS or XPath selectors. This reduces Healer invocation frequency upstream.
- Currents.dev: "Treat AI-generated changes with care. Maintain human oversight through review gates, such as merge blocks, until PRs are validated."
- Teams going from demo to production-ready self-healing (flake handling, reporting, governance): 6-12 months, $100K-$200K (Bug0.com).

Practical angle: The teams getting ROI pair the Generator (with accessibility-first locators) with selective Healer use and human review gates, rather than running the Healer on every failure.

## Sources

- https://getautonoma.com/blog/flaky-tests
- https://currents.dev/posts/state-of-playwright-ai-ecosystem-in-2026
- https://testdino.com/blog/playwright-ai-ecosystem/
- https://stackabuse.com/ai-powered-playwright-building-a-self-healing-ci-cd-testing-pipeline/
- https://bug0.com/blog/playwright-mcp-changes-ai-testing-2026
- https://devot.team/blog/playwright-ai
- https://www.testleaf.com/blog/playwright-mcp-ai-test-automation-2026/
