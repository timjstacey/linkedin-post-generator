# Research: 90% of Developers Use AI. Their CI Pipelines Don't.

**Date range:** 2026-04-19 to 2026-05-19

## Summary

JetBrains published a sharp disconnect in April 2026: AI tools now exceed 90% daily workplace adoption among developers (AI Pulse, January 2026), yet 73% of organizations report zero AI inside their CI/CD pipelines (State of CI/CD Tools, October 2025). The AI Pulse survey puts the abstention figure even higher, at 78.2%.

Key barriers cited by orgs holding back: 60% say unclear use cases or value, 36% lack trust in AI-generated results, 33% cite data privacy concerns.

The structural reason is pipeline determinism. IDE suggestions are cheap to reject with no lasting consequence. Pipeline signals determine what ships and must be reproducible and auditable. AI outputs are often probabilistic, which creates friction at that stage.

Where AI does enter CI/CD, it focuses on two narrow tasks:
- **Failure diagnosis**: TeamCity 2026.1 (May 2026) shipped MCP server support, enabling AI agents to parse failing builds and surface probable root causes from the terminal (e.g., TeamCity CLI + Claude Code integration).
- **Test selection**: CloudBees Smart Tests uses AI-driven analysis to identify which tests are relevant to a specific code change. CloudBees production benchmarks put roughly a third of CI failures as flaky, triggered by infrastructure noise rather than actual code changes. AI test selection reduces wasted compute and speeds feedback.

GitLab Duo (root cause analysis) and CircleCI (flaky test detection, pipeline insights) follow similar patterns: entering CI/CD through noise reduction rather than new signal generation.

CloudBees article notes AI-assisted development is increasing commit volume and pipeline pressure — more code triggers more CI runs, driving up cloud costs and slowing feedback loops.

## Sources

- https://blog.jetbrains.com/teamcity/2026/04/ai-in-devops/
- https://www.helpnetsecurity.com/2026/04/24/ai-in-ci-cd-engineering-teams/
- https://letsdatascience.com/news/ai-adoption-lags-in-cicd-pipelines-8df9d279
- https://www.cloudbees.com/blog/ai-is-writing-more-code-your-ci-pipeline-cant-keep-up
- https://blog.jetbrains.com/teamcity/2025/10/the-state-of-cicd/
- https://northflank.com/blog/top-ai-tools-cicd-pipeline-automation
