# Research: Three Caching Changes That Cut GitHub Actions Build Times by 80%

**Date range:** 2026-05-07 to 2026-06-04

## Summary

Dependency caching is the single highest-leverage optimization in GitHub Actions pipelines. Most teams leave significant build time on the table by skipping or misconfiguring the `actions/cache` step.

**Key insights:**

- Dependency caching cuts Node.js install times by 60–80%. A cache hit drops `npm install` from 3–4 minutes to 15–30 seconds.
- `hashFiles('**/package-lock.json')` as the cache key achieves 70–90% cache hit rates in most projects when the lock file changes infrequently.
- `restore-keys` fallback enables partial cache hits on lock file updates, downloading only changed packages rather than the full dependency tree. Teams skip 80% of downloads even on a partial miss.
- Docker layer caching via `cache-from: type=gha` and `cache-to: type=gha,mode=max` drops container builds from 8+ minutes to under 2 by restoring unchanged layers from the Actions cache.
- Combined caching strategies cut 45-minute pipelines to 8 minutes in documented team case studies; 15-minute Node.js pipelines drop to under 3 minutes.
- Turborepo remote caching extends these gains to monorepos, sharing task artifacts across all CI runs. Mercari Engineering reported a 50% reduction in Turbo task duration and 30% reduction in total job duration after enabling remote caching in February 2026.
- Proper Dockerfile layer ordering (infrequent changes near top, commit-specific changes near bottom) determines how much Docker layer caching saves per run.
- Cache size vs. freshness is the key trade-off: caching `node_modules` directly can cause cross-platform issues on Linux/Windows splits; caching `~/.npm` (the global npm cache) and letting `npm ci` assemble is the safer pattern.

## Sources

- https://medium.com/@Rohan_Dutt/10-techniques-for-managing-build-cache-in-ci-cd-pipelines-a694c4b7758d
- https://eastondev.com/blog/en/posts/dev/20260407-github-actions-cache-strategy/
- https://dev.to/alex_aslam/optimizing-cicd-pipelines-slash-build-times-with-smarter-dependency-caching-59na
- https://engineering.mercari.com/en/blog/entry/20260216-turborepo-remote-cache-accelerating-ci-to-move-fast/
- https://www.datadoghq.com/blog/cache-purge-ci-cd/
- https://dasroot.net/posts/2026/04/ci-cd-performance-optimization-faster-builds-deployments/
- https://www.askantech.com/cicd-pipeline-optimization-reduce-build-times/
