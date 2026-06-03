I didn't hand-write my resume site. Claude Code wrote it, commit by commit, and I reviewed and merged.

I set the direction in plain language: build the job board, add the rule that ghosts an application after 28 silent days, extract that logic so a test can reach it. Claude Code wrote the code and a failing-first test for each change, ran the suite and the typecheck, and opened the PR. Every commit in the history carries both our names.

That loop leans harder on the tests. The site runs 460 of them before it deploys: 247 unit tests over the logic, 213 Playwright tests over the browser slice. They are how I check a change I did not type line by line. A green suite, a passing typecheck, and a coverage gate turn "the agent says it works" into something I verify before it merges.

The data stays mine: my real applications, my CV, my projects. The code that renders them, and the tests that guard it, came from the pair.

The full write-up is on the blog: every page, the unit-first test split, and the pipeline that gates each merge.

https://tim.sillysamoyed.com/blog/resume-site-behind-460-tests

#ClaudeCode #AIAssistedDevelopment #Playwright #TestAutomation #Astro
