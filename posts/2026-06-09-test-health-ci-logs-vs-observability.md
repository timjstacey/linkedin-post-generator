Every run, your test suite produces health data: how long it took, how much of it flaked. That data lands in two places, and the gap between them decides whether you ever act on it.

Place one is the CI log. To learn your suite is slowing down, you open pipeline runs and read them. A 30 percent jump in duration or a flake rate creeping past 1 percent sits there in plain sight until someone scrolls far enough to catch it. You never scroll far enough.

Place two is your observability backend. On May 21 the CNCF graduated OpenTelemetry, the standard developers pulled 1.36 billion times last year in JavaScript alone. A Playwright OTLP reporter emits a span per test and per step. You point OTEL_EXPORTER_OTLP_ENDPOINT at a collector, and your pass rate flows into the same Grafana or Datadog board as your production traffic.

From there you do what the log never allowed. You query pass_rate grouped by project and graph six months of it. You set an alert to page you when the rate drops below 95 percent across two runs, and you tie a slow test to the backend span it fired inside one trace.

Pick by the question you ask. For one failing run, the log tells you what broke. For whether the suite rotted over a month, you read the answer off the dashboard in a glance and the log wastes your afternoon.

Wire your reporter to the collector this sprint. Your test suite is a service. Monitor it like one.

#TestAutomation #OpenTelemetry #TestObservability #CICD #DevOps
