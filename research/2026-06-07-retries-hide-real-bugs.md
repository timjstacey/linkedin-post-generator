# Research: Retrying Flaky Tests Deletes the Evidence of Real Bugs

**Date range:** 2026-05-10 to 2026-06-07

## Summary

The field consensus treats a test that fails then passes on rerun as "flaky" and reaches
for an auto-retry (retryTimes, jest.retryTimes, blanket CI reruns) to keep the pipeline
green. The contrarian counter-position: blanket retries throw away the data that proves a
real bug exists.

Key evidence:

- A defect that fails one run in four (25% failure rate) statistically passes 99.6% of the
  time under retryTimes(3). CI reports green on a bug a quarter of real users hit.
  (Mergify, "Why jest.retryTimes() is hiding bugs")
- Research across 200+ teams found 60-70% of failures teams labeled "flaky" were real
  production bugs the retry logic masked. (Katalon / aggregated 2026 reporting)
- TestDino Flaky Test Benchmark 2026: async wait issues account for 45% of flaky cases,
  concurrency/race conditions another 20%; 46.5% of flaky tests are RAFTs
  (resource-affected). Google spends ~2% of coding time on flaky investigation, ~$120K/yr
  for a 50-dev team. Most teams target under 5% flaky rate.
- Quarantine (with a time-bound SLA) beats blanket retry: pull the test out of the blocking
  path, keep it running for data, and set a deadline. Microsoft cut flakiness 18% in six
  months with a "fix or remove within two weeks" policy. Atlassian's Flakinator recovered
  22,000+ builds; Slack and Datadog run auto-detection plus quarantine rather than blind
  reruns.

Angle is distinct from the 2026-05-28 CircleCI post (that covered MCP-based flaky-test
*detection* tooling). This post argues *strategy*: retry vs quarantine, and why retries hide
real defects.

## Sources

- https://mergify.com/blog/why-jest-retrytimes-hides-bugs
- https://testdino.com/blog/flaky-test-benchmark
- https://katalon.com/resources-center/blog/flaky-tests-in-test-automation
- https://www.minware.com/guide/best-practices/flaky-test-quarantine
- https://articles.mergify.com/how-to-get-rid-of-flaky-tests-lethal-tools/
- https://www.atlassian.com/blog/atlassian-engineering/taming-test-flakiness-how-we-built-a-scalable-tool-to-detect-and-manage-flaky-tests
- https://slack.engineering/handling-flaky-tests-at-scale-auto-detection-suppression/
