On a lot of teams, every developer keeps a private Postman collection. None of it gets checked in. None of it gets shared. The person beside you rebuilt the same login request last week, and you will not see it.

Postman gets stretched across two jobs it should not hold together. One is the quick "what does this response look like" check while you build a change. The other is the API tests that guard the endpoint in CI.

For the quick check, cURL answers a one-off in a single line. When the request is worth keeping, put it in a `.http` file: REST Client in VS Code, or the built-in HTTP client in any JetBrains IDE. The file sits in the repo next to the code it calls, rides the same pull request, and the whole team reads it. No private collection, no cloud account.

For the tests, write them in Playwright. Its APIRequestContext runs your API checks in the same project, runner, and CI job as the browser tests. A saved Postman request that one developer runs by hand is not a test. It runs nowhere the week that developer is on leave.

Adhoc check goes to cURL or a checked-in `.http` file. The e2e API tests go in Playwright. Postman was carrying two jobs, and the repo does both of them better.

#APITesting #Playwright #DeveloperExperience #cURL #SoftwareDevelopment
