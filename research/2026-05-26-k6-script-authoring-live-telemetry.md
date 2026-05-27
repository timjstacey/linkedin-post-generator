# Research: k6 Script Authoring Generates Load Tests from Live Grafana Telemetry

**Date range:** 2026-04-15 to 2026-05-26

## Summary

Grafana released k6 Script Authoring on April 15, 2026 as a mode inside Grafana Assistant in Grafana Cloud. Three generation modes:

1. **Natural language prompt** — describe the scenario, get back structured JavaScript with checks, thresholds, and URL grouping.
2. **Discover from telemetry** — name a service; Assistant queries Grafana Cloud metrics, logs, and traces to find endpoints by category with real RPS and p95 latency. The generated script inherits that observed traffic profile.
3. **OpenAPI spec or existing script** — paste a Postman collection, curl commands, or an OpenAPI spec; Script Authoring converts it to k6 format.

Output always includes URL grouping (to keep metric cardinality under control) and optional Tempo tracing and Pyroscope profiling hooks so load test results land in the same Grafana dashboards as production observability data.

The telemetry-grounded "Discover" mode is the distinguishing capability: instead of guessing VU counts and thresholds, teams describe a service and get a script calibrated to what the service actually handles in production.

This is distinct from the k6 v2.0 CLI agent command and mcp-k6 server (announced at GrafanaCON 2026), which are editor-based tools for recording browser sessions and converting Playwright tests. Script Authoring lives inside Grafana Cloud and reads live observability data.

## Sources

- https://grafana.com/whats-new/2026-04-15-create-k6-tests-with-grafana-assistant-and-k6-script-authoring-mode
- https://grafana.com/blog/generate-test-scripts-from-natural-language-with-grafana-assistant-introducing-k6-script-authoring
- https://grafana.com/docs/grafana-cloud/testing/k6/author-run/k6-script-authoring-mode
- https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant
- https://grafana.com/events/grafanacon/agenda/ai-assisted-testing-k6-v2
