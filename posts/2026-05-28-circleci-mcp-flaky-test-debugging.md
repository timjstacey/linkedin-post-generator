Flaky tests cost a 50-person engineering team over $400,000 a year. Google found 1 in 7 test runs hits a flaky failure. Microsoft measured 30 minutes of investigation per incident. Most teams respond by pressing rerun.

CircleCI built an MCP server with a `find_flaky_tests` tool that connects your AI assistant to your pipeline's test history. Type "Find flaky tests in my current project" in Cursor or Windsurf. The server reads your Git remote, calls the CircleCI API, and returns each unstable test by name, file location, and failure rate with full execution context. Your assistant can suggest fixes in the same conversation.

The server also includes `get_build_failure_logs`. When a job fails, you ask your assistant to pull the logs and explain what broke, without switching tools.

This problem is worsening. AI coding tools now generate 46% of code in active Copilot files. Teams ship faster. They refactor component hierarchies and rename selectors more often. Tests that relied on stable selectors fail intermittently as teams update the UI around them. Flaky test rates climb with development velocity.

CloudBees reported in April that SmartTests cut test execution from 54 minutes to 4 minutes for some customers, saving 2,000 developer hours per month. That scale of gain comes from identifying which failures are real before you decide what to run.

Are you tracking which tests in your suite fail for real and which are just noise?

#CICD #TestAutomation #DevOps #SoftwareTesting
