# Research: A Pull Request Title Ran Shell Commands in Nx's Pipeline

**Date range:** 2026-05-28 to 2026-06-25

## Summary

Failure mode: a GitHub Actions workflow interpolates untrusted input (a PR
title, branch name, or issue body) directly into a `run:` block via
`${{ github.event.pull_request.title }}`. Actions substitutes the expression
before the shell parses the line, so shell metacharacters in the title execute
as commands on the runner. When the workflow uses `pull_request_target`, that
code runs with the base repo's `GITHUB_TOKEN`, secrets, and default-branch
access even for a fork PR.

Concrete reported case — s1ngularity (Nx), August 2025: an attacker opened a
PR whose title carried shell commands. A title-validation workflow running on
`pull_request_target` echoed the title into a `run:` step, and the runner
executed the injected commands with repo permissions. The repo still had the
pre-Feb-2023 default of "Read and write" Actions permissions, so the token had
full access. The attacker stole the npm publishing token, published malicious
Nx packages for ~4 hours, and the malware leaked 2,349 distinct secrets
(GitHub PATs/OAuth keys, plus AWS, OpenAI, Anthropic, Datadog, Postgres
credentials) from developer machines — and weaponized installed AI CLIs with
`--dangerously-skip-permissions`-style flags for recon.

Scale: Datadog's 2026 State of DevSecOps report found a script-injection or
dangerous-trigger pattern in 38% of organizations; two-thirds harbor at least
one critical workflow vulnerability.

Documented fix (GitHub docs): never interpolate untrusted input into a `run`
block. Bind the value to an intermediate environment variable and reference
`"$TITLE"` (quoted) inside the script, so the shell treats it as data. Same
handling for branch names and issue bodies.

New default (within 4-week window): on 2026-06-18, GitHub shipped
`actions/checkout` v7, which refuses to fetch fork PR code under
`pull_request_target` (and `workflow_run` on PR events) by default. Maintainers
opt back in with the `allow-unsafe-pr-checkout` input after reading the
guidance. Backport to supported majors lands 2026-07-16, so a workflow pinned
to a floating tag like `actions/checkout@v4` inherits the guard automatically.

## Sources

- https://nx.dev/blog/s1ngularity-postmortem
- https://thehackernews.com/2025/08/malicious-nx-packages-in-s1ngularity.html
- https://docs.github.com/en/actions/concepts/security/script-injections
- https://cyberpress.org/github-actions-injection-risk/
- https://securitylabs.datadoghq.com/articles/case-for-github-actions-security/
- https://github.blog/changelog/2026-06-18-safer-pull_request_target-defaults-for-github-actions-checkout/
- https://thehackernews.com/2026/06/github-updates-actionscheckout-to-block.html
- https://www.infoworld.com/article/4188038/github-actions-hardens-checkout-security-to-block-pwn-request-attacks.html
