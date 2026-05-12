# Research: k6 2.0 Brings AI to Performance Testing

**Date range:** 2026-04-14 to 2026-05-12

## Summary

Grafana previewed k6 2.0 at GrafanaCON 2026 in April. The major change is AI-assisted authoring built into the CLI via four new subcommands: `agent`, `mcp`, `docs`, and `explore`. These let engineers describe load scenarios in plain language and receive working k6 scripts.

The experimental `mcp-k6` server (already functional, labeled experimental) connects Claude, Cursor, and VS Code to k6 for script authoring, validation, local execution, and Playwright-to-k6 script conversion. k6 2.0 has not yet GA'd as of early May 2026.

k6 Studio v1.10.0 (January 2026) shipped AI-powered Autocorrelation: it detects dynamic values in recordings (CSRF tokens, session IDs, resource IDs) and generates extraction rules automatically. This historically required hours of senior engineering time.

k6's design keeps AI in adjacent tooling rather than inside the runner. The OSS engine stays scriptable and transparent; users bring their own LLM key (OpenAI required for Autocorrelation). AI capabilities activate when k6 connects to Grafana Cloud, Grafana AI Assistant, or external tooling.

For teams already writing Playwright E2E tests, the Playwright-to-k6 converter enables reuse of existing user journey scripts as load tests without full rewrites.

## Sources

- https://grafana.com/blog/grafanacon-2026-announcements/
- https://gatling.io/blog/best-ai-load-testing-tools
- https://www.linkedin.com/pulse/grafanacon-2026-what-matters-performance-efficiency-cost-ruiz-na7me
- https://pflb.us/blog/top-ai-load-testing-tools/
- https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/
- https://grafana.com/oss/k6/
