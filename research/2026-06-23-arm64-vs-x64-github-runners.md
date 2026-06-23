# Research: x64 or arm64 GitHub Runners: Which Your CI Should Use

**Date range:** 2026-05-26 to 2026-06-23

## Summary

GitHub-hosted arm64 runners have crossed from a public-repo curiosity into a default cost
lever for any team paying for Actions minutes. The trade-off for a CI/test audience is cost and
speed against the native-dependency compatibility tail.

Key facts:

- **Price.** arm64 standard Linux/Windows runners are priced ~37% less per minute than the x64
  equivalent. The January 1, 2026 pricing change also cut GitHub-hosted runner base rates by up
  to 39% (largest on 64-core arm64), with a $0.002/min platform charge folded into the hosted
  meter.
- **Hardware / performance.** GitHub's arm64 hosted runners run on Microsoft Cobalt 100 cores.
  GitHub reports the 4 vCPU arm64 runners deliver up to a 40% performance gain over the previous
  generation of Azure Arm VMs. For typical Node/Python/Go suites, wall-clock time is the same or
  faster than x64.
- **Availability timeline.** arm64 larger runners (June 2024) → Linux/Windows arm64 standard GA
  in public repos (Aug 7, 2025) → arm64 standard runners in **private** repositories (Jan 29,
  2026). Public-repo arm64 standard = 4 vCPU; private-repo standard = 2 vCPU.
- **Fresh anchor (last 4 weeks).** Ubuntu 26.04 (x64 and arm64) shipped as a GitHub Actions
  runner image, released/validated **June 11, 2026**; selectable via the `ubuntu-26.04` label.
  Windows 11 arm64 with Visual Studio 2026 also entered public preview.
- **Compatibility tail (the deciding dimension).** A job runs natively on arm64 only when every
  native dependency ships an arm64 binary: node-gyp modules, prebuilt tool downloads, and the
  Docker base image. Miss one and the install fails, or the build falls back to QEMU emulation.
  Real-world Docker example: an arm64 image that builds in ~1m26s natively took over 33 minutes
  under QEMU emulation on an x64 runner (a ~22x slowdown). Building each architecture on its own
  native runner and combining manifests avoids the emulation tax; multi-arch builds are free on
  public-repo runners.

Angle / archetype: **Teardown** — x64 vs arm64 GitHub-hosted runners, deciding trade-off is
cost+speed vs the arm64 coverage of your toolchain. Not previously covered (existing GitHub
Actions posts cover caching, parallel steps, merge queue, Copilot CI fixes — none touch runner
architecture or pricing). Deliberately a non-AI infrastructure angle to vary an AI-heavy feed.

## Sources

- https://github.blog/changelog/2026-01-29-arm64-standard-runners-are-now-available-in-private-repositories/
- https://github.com/actions/runner-images/issues/14226
- https://github.blog/news-insights/product-news/arm64-on-github-actions-powering-faster-more-efficient-build-systems/
- https://docs.github.com/en/billing/reference/actions-runner-pricing
- https://github.blog/changelog/2025-08-07-arm64-hosted-runners-for-public-repositories-are-now-generally-available/
- https://github.blog/changelog/2026-01-01-reduced-pricing-for-github-hosted-runners-usage/
- https://www.blacksmith.sh/blog/building-multi-platform-docker-images-for-arm64-in-github-actions
- https://runs-on.com/benchmarks/github-actions-cpu-performance/
