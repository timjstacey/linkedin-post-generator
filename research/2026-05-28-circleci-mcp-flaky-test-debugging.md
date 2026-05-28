# Research: CircleCI's MCP Server Puts Flaky Test Debugging in Your IDE

**Date range:** 2026-04-30 to 2026-05-28

## Summary

CircleCI built an MCP server with a `find_flaky_tests` tool that connects AI assistants (Cursor, Windsurf, Augment Code) to historical pipeline test data. You prompt your assistant from the IDE, the server reads your Git remote, calls the CircleCI API, and returns each flaky test by name, file location, failure rate, and full execution context. The server also includes `get_build_failure_logs` for pulling failure logs without leaving the editor. Both tools are available via `npx @circleci/mcp-server-circleci` and work with any MCP-compatible IDE. Augment Code added 1-click Easy MCP integration. The server is also available in the AWS Marketplace AI Agents and Tools storefront via Amazon Bedrock AgentCore Runtime.

Autonoma's 2026 analysis puts flaky test costs at over $400,000/year for a 50-person engineering team (developer time + compute reruns + delayed deployments). Google data: 1 in 7 test runs hits a flaky failure. Microsoft: 30 minutes of investigation per incident. TestDino's Flaky Test Benchmark 2026 shows the share of teams experiencing flakiness rose from 10% (2022) to 26% (2025) across 10M+ builds.

AI coding tools worsen the problem: tools like Copilot now generate 46% of code in active files (GitHub data). Higher code velocity means faster UI changes — component hierarchy refactors, selector renames — which destabilize tests that relied on stable DOM structure. The flaky test rate compounds with pipeline frequency, not independent of it.

CloudBees SmartTests went GA on April 2, 2026. Customer results: 54-minute test execution cut to 4 minutes, 40% infrastructure reduction, 2,000 developer hours saved per month. The gains come from test intelligence — identifying real failures before deciding what to run.

## Sources

- https://circleci.com/blog/fix-flaky-tests-with-ai
- https://circleci.com/blog/circleci-mcp-server
- https://circleci.com/docs/guides/toolkit/using-the-circleci-mcp-server
- https://getautonoma.com/blog/flaky-tests-ci-cd-engineering-cost
- https://testdino.com/blog/flaky-test-benchmark
- https://aws.amazon.com/blogs/awsmarketplace/transform-ci-cd-pipelines-with-circleci-mcp-and-aws-agentic-ai
- https://www.cloudbees.com/newsroom/cloudbees-smart-tests-brings-control-to-ai-generated-code
