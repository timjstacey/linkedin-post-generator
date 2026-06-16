# Research: Your Coverage Gate Rewards Tests That Assert Nothing

**Date range:** 2026-05-19 to 2026-06-16

## Summary

The settled assumption: a CI quality gate that fails any PR dropping line
coverage below a threshold (or below the previous run, "ratcheting") keeps a
test suite honest. The counter-position: coverage measures execution, not
validation. A test that calls a function and asserts nothing still counts the
line as covered, so a developer racing a coverage gate can pass it with empty
tests while the suite proves nothing about correctness.

Key facts gathered:

- Coverage counts a line as covered the moment a test executes it; the test
  never has to assert on the result. Line coverage used alone is a vanity
  metric (HackerNoon, QA.tech).
- Ratcheting gates (fail the build if coverage drops vs last analysis) are a
  common SonarQube pattern; they enforce a number, not assertion quality.
- Mutation testing measures what coverage cannot. Stryker (JS/.NET) and PIT
  (Java) make small code changes — flip `>` to `>=`, swap `+` for `-`, delete
  a line — then rerun the tests. A killed mutant means a test caught the
  change; a surviving mutant marks a line the tests execute but never verify
  (Stryker Mutator docs; oneuptime Stryker guide, Jan 2026).
- Mutation score = percent of mutants killed. A score below 70% signals a weak
  suite; 2026 reliability standards aim past 80% on important modules
  (testunity Test Metrics 2026; johal.in Stryker .NET/Python 2026).
- The metric that matters is defect/bug escape rate (Defect Detection Ratio):
  defects caught before production vs total. Run Stryker on critical modules,
  fix surviving mutants, measure the drop in escape rate.
- Coverage still has a job (showing a line ran, branch coverage showing logic
  paths); the argument is against using a coverage percentage as the merge
  gate instead of test effectiveness (forestwalk.ai; Medium line-vs-branch).

## Sources

- https://hackernoon.com/why-100percent-test-coverage-is-a-vanity-metric
- https://www.qa.tech/blog/why-100-test-coverage-isnt-the-goal
- https://medium.com/@sauradipta/line-vs-branch-coverage-which-metric-actually-guarantees-code-quality-32294f8fae14
- https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/
- https://oneuptime.com/blog/post/2026-01-25-mutation-testing-with-stryker/view
- https://forestwalk.ai/blog/test-coverage-wont-save-you-from-incoherence/
- https://blog.testunity.com/test-metrics-kpis-measure-qa-success/
- https://johal.in/mutation-testing-with-stryker-net-and-python-coverage-2026/
