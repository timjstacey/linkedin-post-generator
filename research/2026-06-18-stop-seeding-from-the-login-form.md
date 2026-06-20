# Research: Stop Seeding Your Playwright Suite From the Login Form

**Date range:** 2026-05-21 to 2026-06-18

## Summary

**Angle (the post's thesis):** A contrarian playbook against the widely-recommended "authenticate through the login form once, save storageState, reuse it for every test" pattern. Driving the login form to seed the whole suite couples every test to the form: when the form breaks, hundreds of unrelated tests go red and bury the one signal that matters (the login form broke). The fix is to separate authentication of the form from authentication of the suite, and to authenticate the suite through the login API inside a fixture. This post argues the position; it does not narrate a personal anecdote (no first person).

The mechanism and the supporting facts:

- Playwright ships a built-in HTTP client, APIRequestContext, that runs in the same test file, test runner, and reporter as the browser tests. No third-party HTTP library, no separate CI job. This is what makes API-level auth and seeding available right next to the browser tests.
- storageState is Playwright's serialization of a logged-in session (all cookies plus per-origin localStorage/sessionStorage), interchangeable between BrowserContext and APIRequestContext. The common 2026 guidance is a dedicated setup project that signs in **through the UI form** once and saves storageState for every test to reuse. **This post rejects the UI-login part of that pattern**, not storageState itself: the session is fine, sourcing it by driving the form is the smell.
- The split: write ONE dedicated test that drives the login form and asserts it works (that is the form's test). Authenticate everything else through the login API. When the form breaks while the API holds, the login test points at the form and the rest of the suite keeps reporting what actually works. You stop conflating "the form renders/submits" with "a session exists".
- Go past a single shared session. Build a **factory fixture** that registers a fresh user per worker through the API — `createUser({ balance: 5000 })` returns a registered, funded user. One composable fixture beats a drawer of named fixtures (`testUser`, `testUserWithMoney`, `testUserWithMoneyAndKyc`); state is passed as arguments, not baked into fixture names. Each worker gets its own user, so parallel workers stop trampling each other's data.
- Scope honesty (the load-bearing caveat): worker-scoped fixtures isolate workers from each other, NOT tests within the same worker. Tests in one worker run in order against the same user, so a test that spends the balance leaves the next one broke. Use test scope when a flow mutates state another test reads. Either way add teardown that deletes the created users, or the test database fills with dead registrations.
- Token APIs that use Authorization headers fit the same model: the fixture captures the token at login and injects it via extraHTTPHeaders instead of cookies/storageState.
- Context: testing-pyramid guidance puts ~20% of tests at the API/integration layer and ~10% at E2E; pulling auth and seeding down to the API layer is what lets the browser tests stay thin and fast.

**Out of scope (deliberately cut):** an earlier draft closed by replacing Postman with cURL + checked-in `.http` files (REST Client / JetBrains HTTP client). That felt like an afterthought tacked onto the auth argument. Dropping Postman deserves its own dedicated post, so it is held back for a future angle and removed from this one.

## Sources

- https://playwright.dev/docs/api-testing
- https://playwright.dev/docs/api/class-apirequestcontext
- https://playwright.dev/docs/auth
- https://playwright.dev/docs/test-fixtures
- https://qaskills.sh/blog/playwright-apirequestcontext-storagestate-guide
- https://getautonoma.com/blog/playwright-api-testing-guide
- https://testdino.com/blog/playwright-api-testing
- https://dev.to/gregobhm/api-testing-frameworks-comparison-rest-assured-vs-postman-vs-playwright-16pd
- https://www.browserstack.com/guide/playwright-api-test
