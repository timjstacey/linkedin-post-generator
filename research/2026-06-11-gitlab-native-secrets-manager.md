# Research: GitLab 19.0 Ships Native Secrets Management Into the Pipeline

**Date range:** 2026-05-14 to 2026-06-11

## Summary

GitLab released 19.0 on May 21, 2026. The headline CI/CD feature is the GitLab
Secrets Manager, now in open (public) beta for Premium and Ultimate customers on
both GitLab.com and Self-Managed.

Key mechanism:

- Built on **OpenBao**, the open-source fork of HashiCorp Vault. GitLab bundles
  OpenBao as the secrets service: the Rails backend and runners connect to the
  OpenBao API through a load balancer, and OpenBao stores data in PostgreSQL.
- Project/group Owners store, retrieve, and reference CI/CD secrets inside GitLab.
  A secret is scoped to a project or group and is readable only by pipeline jobs
  that explicitly request it by name.
- Scoping limits blast radius: GitLab decides which jobs can pull a given secret
  from job attributes — the environment it targets, the branch it runs on, and
  whether that branch is protected. A leaked feature-branch credential never
  unlocks a protected production job.
- Single permission model: GitLab translates its own roles into OpenBao policies
  on the user's behalf, so teams no longer maintain two access models. Audit logs
  are correlated natively in the GitLab UI alongside the pipeline that used the
  secret.

Why it matters / the angle: For years teams have pulled CI secrets out of
`.gitlab-ci.yml` by standing up a standalone HashiCorp Vault next to GitLab. That
solves the in-config-secrets problem but adds a permanent operational tax — a
second system to authenticate against, a second access model to keep in sync, and
a second audit stream to correlate during an incident. Native Secrets Manager
collapses that into the platform. It also runs alongside existing integrations
with HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, and Google Cloud
Secret Manager, so adoption is incremental.

Other 19.0 CI/CD notes (context, not the post focus): pipeline inputs now accept
multiple dropdown values combined into an array; Components Analytics surfaces
which CI/CD Catalog components and versions run across an org; Dependency Scanning
gains a default profile; GitLab Duo Agent Platform adds a Fix CI/CD Pipeline Flow.

## Sources

- https://docs.gitlab.com/releases/19/gitlab-19-0-released/
- https://docs.gitlab.com/ci/secrets/secrets_manager/
- https://thenewstack.io/gitlab-19-secrets-manager/
- https://www.helpnetsecurity.com/2026/05/22/gitlab-19-0-adds-ai-workflows-secrets-management-and-self-hosted-model-support/
- https://securitybrief.news/story/gitlab-19-0-adds-secrets-manager-ai-workflow-tools
- https://about.gitlab.com/blog/secrets-manager-in-public-beta/
- https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/secret_manager/decisions/007_openbao/
