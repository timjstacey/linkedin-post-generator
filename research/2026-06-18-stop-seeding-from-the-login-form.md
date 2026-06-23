# Research: Stop Seeding Your Playwright Suite From the Login Form

**Date range:** 2026-05-21 to 2026-06-18

## Summary

**Angle (the post's thesis):** A playbook for authenticating a Playwright suite without
coupling every test to the login form. Driving the login form to seed the whole suite couples
every test to the form: when the form breaks, unrelated tests go red and bury the one signal
that matters (the login form broke). The fix Playwright's own auth guide points to is to
authenticate through the API where the app supports it, save the session as storageState, and
reuse it. This post argues the position from the documentation; it narrates no personal
anecdote and uses no first person.

## What the official Playwright auth guide actually recommends

Source of truth: https://playwright.dev/docs/auth. The load-bearing recommendations, quoted or
paraphrased directly from the doc, so the blog cites the framework and not just the post:

- **Prefer API auth when the app supports it.** The doc frames API auth conditionally:
  "Your web application supports authenticating via API that is easier/faster than interacting
  with the app UI." It is the recommended path *when available*, not an unconditional rule.
- **The UI-login setup project is still a first-class, documented pattern.** Playwright's
  primary example signs in once in a `setup` project and saves `storageState`. Apps that
  authenticate only through SSO, a third-party identity provider, captcha, or MFA have no login
  API to call, so the UI login is the correct and only option there. The post must not present
  API auth as universally available; it is the better path when an endpoint exists.
- **Authenticate once, reuse the state.** "Tests can load existing authenticated state. This
  eliminates the need to authenticate in every test and speeds up test execution." Store under
  `playwright/.auth` and load via the `storageState` setting (project-level or per test).
- **Capture the API-authenticated session into storageState.** `APIRequestContext` exposes
  `request.storageState({ path })`, which serializes cookies + origin storage from an
  API login into the same file format a browser context consumes. This is the bridge that lets
  the post's "auth via API" marry Playwright's "authenticate once, reuse" benefit: log in over
  HTTP in a setup fixture, write storageState, every browser test loads it.
- **One account per parallel worker — but only when tests mutate shared server state.** The doc
  scopes this precisely: use per-worker accounts when "your tests modify shared server-side
  state" (e.g. one test renders the settings page while another changes the setting in
  parallel). For stateless / read-only suites "a single shared account is acceptable." Each
  worker loads its own auth file keyed by `testInfo.parallelIndex`.
- **State expires; plan to refresh or delete it.** "You need to delete the stored state when it
  expires." Writing the state to `testProject.outputDir` lets Playwright clean it up; otherwise
  re-authenticate periodically.
- **Security: never commit storageState.** The doc "strongly discourages" checking the state
  file into a repository: "The browser state file may contain sensitive cookies and headers
  that could be used to impersonate you or your test account." Gitignore `playwright/.auth`.

## The mechanism and supporting facts

- **Why not seed every test from the UI form.** Routing the whole suite's session through one
  form makes the form a single point of failure for tests that never touch login. A selector or
  layout change on the form turns the entire suite red and conflates two distinct questions:
  "does the login form render and submit" and "does an authenticated session exist". Splitting
  them keeps the signal legible.
- **The split.** Write ONE dedicated test that drives the login form and asserts it works (that
  is the form's test). Authenticate everything else through the API. When the form breaks while
  the API holds, the login test points at the form and the rest of the suite keeps reporting
  what works.
- **Built-in HTTP client.** Playwright ships `APIRequestContext`, an HTTP client that runs in
  the same test file, runner, and reporter as the browser tests. No third-party HTTP library,
  no separate CI job. This is what makes API-level auth and seeding available right next to the
  browser tests.
- **storageState defined.** storageState is Playwright's serialization of a logged-in session
  (all cookies plus per-origin localStorage/sessionStorage), interchangeable between
  `BrowserContext` and `APIRequestContext`. The post rejects sourcing it by *driving the form*,
  not storageState itself; the session artifact is exactly what Playwright wants reused.
- **Factory fixture for test data.** Go past a single shared session. Build a factory fixture
  that registers a fresh user per worker through the API: `createUser({ balance: 5000 })`
  returns a registered, funded user. One composable fixture beats a drawer of named fixtures
  (`testUser`, `testUserWithMoney`, `testUserWithMoneyAndKyc`); state is passed as arguments,
  not baked into fixture names. NOTE for the blog: this factory pattern is a design opinion
  layered on top of Playwright's auth guidance, not a recommendation lifted from the auth doc.
  Present it as the author's extension, distinct from the doc-sourced points above.
- **Scope honesty (the load-bearing caveat).** Worker-scoped fixtures isolate workers from each
  other, NOT tests within the same worker. Tests in one worker run in order against the same
  user, so a test that spends the balance leaves the next one broke. Use test scope when a flow
  mutates state another test reads. Either way add teardown that deletes the created users, or
  the test database fills with dead registrations.
- **Token APIs fit the same model.** APIs that use `Authorization` headers instead of cookies:
  the fixture captures the token at login and injects it via `extraHTTPHeaders`. storageState
  also persists origin localStorage, so token-in-storage flows reuse the same save/load path.
- **Testing-pyramid context.** Common guidance puts ~20% of tests at the API/integration layer
  and ~10% at E2E; pulling auth and seeding down to the API layer is what keeps the browser
  tests thin and fast.

## Code shapes for the blog (illustrative)

- Setup fixture logging in over HTTP and saving state:
  `const ctx = await request.newContext(); await ctx.post('/api/login', { data: creds }); await ctx.storageState({ path: 'playwright/.auth/user.json' });`
- Consuming the state in a project: `use: { storageState: 'playwright/.auth/user.json' }`.
- Per-worker file: key the path on `test.info().parallelIndex` inside a worker-scoped fixture.
- Factory fixture signature: `createUser: async ({}, use) => { const users = []; await use(async (opts) => { const u = await api.register(opts); users.push(u); return u; }); for (const u of users) await api.delete(u); }`

## Alignment notes (post vs docs)

- Post now qualifies API auth with "when your app exposes a login endpoint" and names SSO /
  third-party IdP as the case where UI login stays. Matches the doc's conditional framing.
- Post now references `request.storageState()` and "authenticate once, reuse", matching the
  doc's headline benefit rather than implying a fresh login per test.
- Post now scopes per-worker accounts to suites that "write shared server state" and notes
  read-only suites can share one account, matching the doc.
- Post now flags gitignoring `playwright/.auth` and the impersonation risk, matching the doc's
  security warning.

**Out of scope (deliberately cut):** an earlier draft closed by replacing Postman with cURL +
checked-in `.http` files (REST Client / JetBrains HTTP client). That felt like an afterthought
tacked onto the auth argument. Dropping Postman deserves its own dedicated post, so it is held
back for a future angle and removed from this one.

## Sources

- https://playwright.dev/docs/auth (primary — authentication best practices, storageState, per-worker, security)
- https://playwright.dev/docs/api-testing
- https://playwright.dev/docs/api/class-apirequestcontext (request.storageState, newContext, extraHTTPHeaders)
- https://playwright.dev/docs/test-fixtures (worker vs test scope, fixture teardown)
- https://qaskills.sh/blog/playwright-apirequestcontext-storagestate-guide
- https://getautonoma.com/blog/playwright-api-testing-guide
- https://testdino.com/blog/playwright-api-testing
- https://dev.to/gregobhm/api-testing-frameworks-comparison-rest-assured-vs-postman-vs-playwright-16pd
- https://www.browserstack.com/guide/playwright-api-test
