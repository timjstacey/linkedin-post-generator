Teams running Node.js in GitHub Actions can cut build times from 15 minutes to under 3 with three caching changes that take an afternoon to add.

1. Cache dependencies on the lock file hash.

Add actions/cache keyed to hashFiles('**/package-lock.json'). On a cache hit, your workflow skips the registry entirely. Cache hit rates reach 70–90% in most projects. Install time drops from 3–4 minutes to 15–30 seconds. Cache the ~/.npm directory and let npm ci assemble from it. Caching node_modules directly breaks on Linux/Windows matrix splits.

2. Add restore-keys as a fallback.

A lock file update breaks the exact key match. With restore-keys, your workflow pulls the nearest matching cache and runs npm ci on top. You download only the changed packages, not everything. Even a partial miss skips 80% of downloads.

3. Enable Docker layer caching.

Add cache-from: type=gha and cache-to: type=gha,mode=max to your Docker build step. Unchanged layers pull from the Actions cache. Container builds that took 8 minutes drop to under 2. Order your Dockerfile so infrequent changes sit near the top and commit-specific changes near the bottom. Layer order decides how much each run saves.

Start with step 1. Open your workflow file, add actions/cache before your install command, use the hashFiles key pattern, and commit. Adding it cuts install time by 60% or more before you touch anything else.

#GitHubActions #CICD #DevOps #SoftwareDevelopment #TestAutomation
