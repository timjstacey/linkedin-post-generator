On May 21 GitLab shipped a secrets manager inside 19.0, so you no longer stand up a second system to hold your CI credentials.

The manager runs on OpenBao, the HashiCorp Vault fork GitLab now bundles into the platform. You store a credential against a project or group, and a job can read it only when you name it in that job. GitLab scopes each secret by what the job targets and which branch runs it, and it treats a protected branch differently from a feature branch. Compromise one feature-branch token and you have not handed over your production deploy.

Teams have pulled CI secrets out of pipeline config for years by running HashiCorp Vault next to GitLab. That keeps secrets out of .gitlab-ci.yml and adds a standing tax: a second service to authenticate against and a second audit stream to reconcile at 2 a.m. when a credential leaks. GitLab now translates its own roles into OpenBao policies, so you reason about one access model. The audit log sits in the same UI as the pipeline that pulled the secret.

The beta covers Premium and Ultimate on GitLab.com and self-managed, and it runs alongside your existing Vault, AWS, Azure, or GCP integrations. If you run a standalone Vault only to feed GitLab pipelines, weigh that operational tax against what you now get inside the platform.

#GitLab #CICD #DevSecOps #SecretsManagement #DevOps
