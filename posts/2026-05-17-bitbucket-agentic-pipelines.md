84% of developer time goes to tasks outside writing code, per IDC. Keeping READMEs current, cleaning up feature flags, generating release notes, triaging security findings. Atlassian's answer: Bitbucket Agentic Pipelines, now in open beta.

You define an agent block in `bitbucket-pipelines.yml` alongside your existing jobs, give it a prompt and scope constraints, then tie it to an event or schedule. On a merged PR, the agent reads the diff, updates the relevant docs, and opens a pull request back to your branch. You review and merge. The agent carries read-only access; every change goes through your normal review process.

Six use cases ship today: keeping READMEs in sync, fixing security vulnerabilities, cleaning up feature flags, generating release notes, summarizing large PRs, and finding test coverage gaps. Teams running Playwright suites can point the coverage-gap agent at their CI reports; it raises a PR with additional tests against the low-coverage modules.

Setup requires a paid Bitbucket Cloud plan and a Rovo Dev license. Claude Code CLI support is on the roadmap; the current agent uses Atlassian's Rovo Dev model.

The scope is deliberate: automate the chores that matter but never make the sprint. Your engineers review everything. The agent handles the first draft.

#Bitbucket #DevOps #CICD #TestAutomation #SoftwareDevelopment
