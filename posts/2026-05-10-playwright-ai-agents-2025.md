Playwright v1.56 shipped three AI agents directly inside the test runner, and I think most teams haven't fully processed what that means yet.

The Planner explores your app and writes a Markdown test plan. The Generator turns that plan into executable code. The Healer finds broken tests and fixes them.

That's a full QA loop running without a human trigger.

I've been tracking how teams adopt this, and the part that stands out isn't the test generation — everyone expected that. It's the Healer. When your UI changes and locators break, the agent repairs the tests before your CI pipeline fails. One documented case shows 67 test scenarios generated and passing E2E tests for an e-commerce app, built autonomously.

The other piece worth paying attention to is Playwright MCP, which launched in March. Microsoft built a standardized protocol so LLMs like Claude and GitHub Copilot can control browser automation directly through the accessibility tree. It's now baked into GitHub Copilot's Coding Agent and Azure App Testing.

Most conversation focuses on AI writing tests. The real shift is MCP standardizing how AI talks to browsers at all. That's infrastructure, not a feature.

For QA engineers, this creates a genuine skills question. Playwright Agents run inside Claude Code, VS Code Copilot, and Cursor. Teams using these tools are starting to expect engineers to understand prompt engineering and how LLM function calling works. That gap is real and it's widening fast.

82% of testers still use manual testing daily according to Katalon's 2025 survey of 1,400 QA professionals. AI handles the repetitive work. Humans handle judgment calls. The tooling is built for that split — but only if you understand both sides of it.

What's your team's experience with the new Playwright agents so far?

#Playwright #SoftwareTesting #AI #TestAutomation #QualityAssurance