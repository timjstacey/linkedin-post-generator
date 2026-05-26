Performance test scripts fail at the load profile. Writing the HTTP calls takes ten minutes. Deciding what counts as a passing threshold, how many VUs to ramp to, and whether your latency numbers reflect actual traffic. That's the part that stops teams.

Grafana shipped k6 Script Authoring on April 15. It's a mode inside Grafana Assistant in Grafana Cloud. You name a service, and Assistant queries your telemetry to find endpoints by category, each with real RPS and p95 latency from your Grafana stack. The script it generates inherits that observed traffic profile.

The output is structured JavaScript: checks, thresholds, URL grouping to control metric cardinality, and Tempo and Pyroscope hooks so your load test results land in the same dashboards where you watch production.

You can also start from an OpenAPI spec, a plain-language prompt, or an existing Postman or curl script. Script Authoring converts them to k6 format.

The k6 2.0 release in May added a CLI agent command and the mcp-k6 server for converting Playwright browser tests into k6 load tests. Script Authoring takes a different path: it runs inside Grafana Cloud, reads your live observability data, and calibrates the script to what your service handles in production.

Teams that skip load testing cite the same friction: the setup cost for a realistic script exceeds the test run itself. Script Authoring eliminates that cost.

#PerformanceTesting #k6 #Grafana #TestAutomation #DevOps
