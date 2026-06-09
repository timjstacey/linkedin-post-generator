# Research: CI Logs or Observability Backend: Where Test Health Belongs

**Date range:** 2026-05-12 to 2026-06-09

## Summary

Test suites emit health signals every run (pass rate, duration, flake count), but
that data usually dies in CI logs where nobody reviews trends. Two degradation
thresholds teams watch: CI suite duration climbing more than 30% over baseline,
and flake rate crossing 1%. Both hide in pipeline logs until someone clicks
through runs and eyeballs them.

OpenTelemetry is now the bridge. On 2026-05-21 the CNCF graduated OpenTelemetry at
the Observability Summit, naming it the de facto observability standard (12,000+
contributors from 2,800+ companies; the OTel JavaScript API package was downloaded
more than 1.36 billion times in the past 12 months). Test tools can export test
metrics via OTLP so test health flows into the same dashboards, alerts, and
correlation views as production telemetry — Datadog, Grafana Cloud, New Relic,
Honeycomb.

For Playwright specifically, OpenTelemetry reporters (aergonaut, endform) emit a
span per test case and per test step; you initialize the OTel SDK in globalSetup
and point OTEL_EXPORTER_OTLP_ENDPOINT at a collector. A full stack pattern is OTEL
Collector → Tempo/Loki/Prometheus → Grafana, surfacing pass rates, durations, and
flakiness as test-centric metrics. Example from Gaffer: a Datadog timeseries widget
querying tests.pass_rate grouped by project, with a monitor that alerts when pass
rate drops below 95% for two consecutive runs. Trace correlation links a browser
action through the backend span it triggered, so a slow test points at its cause in
one trace.

Angle (Teardown): compare where test health data lives — CI logs vs an
observability backend reached via OTLP. CI logs win for diagnosing a single failing
run; the dashboard wins for spotting suite rot over weeks, alerting, and
production-trace correlation. Treat the test suite as a service and monitor it like
one.

## Sources

- https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/
- https://opentelemetry.io/blog/2026/otel-graduates/
- https://gaffer.sh/blog/opentelemetry-test-metrics/
- https://github.com/aergonaut/playwright-opentelemetry-reporter
- https://chrisfung.dev/posts/playwright-opentelemetry-reporter/
- https://oneuptime.com/blog/post/2026-02-06-tracetest-playwright-browser-testing/view
- https://docs.datadoghq.com/tests/test_health/
- https://www.datadoghq.com/blog/best-practices-for-monitoring-software-testing/
