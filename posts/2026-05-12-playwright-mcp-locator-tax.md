A designer renames CSS classes during a rebrand sprint. Forty-seven Playwright tests snap. Nothing broke in the product.

Someone pages the QA lead. The QA lead pages a senior dev. Two hours disappear. The sprint board shows zero bugs closed.

Teams call this the locator tax. They pay it after every UI deploy.

Playwright MCP changes the calculation. The Model Context Protocol server (`npx @playwright/mcp@latest`) gives AI agents direct access to the browser's accessibility tree. The AI reads the DOM structure, detects that a selector no longer resolves, finds the element by role and label, and writes the fix.

Currents.dev mapped the full agent stack in their 2026 ecosystem review: planner, generator, and healer agents running in sequence. The healer re-runs a failing test, inspects current UI state, determines whether it's a stale selector or a genuine regression, and patches the code. The healer flags real regressions for human review.

The cost data is concrete. Industry estimates put the flaky test tax at $2,200 per developer per month in large enterprises. Bug0 found two or three senior engineers handling test maintenance lose $75K–$120K per year to this work. Forrester estimates AI self-healing cuts those costs by more than 50%.

The mechanism holds at scale because AI reads intent from the accessibility tree. Class name changes don't break the intent.

Two caveats before you adopt: token costs at CI scale reach ~114K tokens per MCP-based test. Pilot on a stable subset before running it across your regression pack.

QA engineers on teams using this shift from triaging every red build to reviewing failures that are genuine bugs.

#Playwright #TestAutomation #SoftwareTesting #CI #DevOps
