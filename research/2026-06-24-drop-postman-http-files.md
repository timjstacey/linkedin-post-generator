# Research: Your API Requests Belong in Git, Not Postman's Cloud

**Date range:** 2026-01 to 2026-06-24

## Summary

A teardown that splits the two jobs teams stretch Postman across, and sends each to a better home: the quick "what does this response look like" check goes to cURL plus checked-in `.http` files (VS Code REST Client or the JetBrains built-in HTTP client); the automated e2e API tests go to Playwright (APIRequestContext). The angle: requests are code, so they belong in the repo next to the source they hit, not in a vendor's cloud workspace, and a saved request one developer runs by hand is not a test. This is the dedicated follow-up to the Playwright login-form post, which deliberately cut its Postman aside to give the topic its own piece.

Lived-experience opener (the author's, stated as the field reality): on many teams every developer keeps a private Postman collection — none checked in, none shared — so the same login request gets rebuilt by different people who never see each other's work. That privacy is the core failure the post attacks.

The argument and the supporting facts:

- Postman straddles two distinct jobs it should not hold together: (1) the exploratory "does my change work" check during development, and (2) the API test coverage that guards an endpoint in CI. Splitting them is the spine of the post.
- Job one (the check): cURL handles a one-off poke in a single line, no app and no account. A `.http` file handles the request worth keeping. Both the REST Client extension (VS Code) and the JetBrains built-in HTTP client read the same plain-text `.http` format, so the file is editor-agnostic and portable.
- Job two (the tests): write them in Playwright. APIRequestContext runs the API checks in the same project, runner, and CI job as the browser tests (this is the mechanism the 2026-06-18 post covers). A saved Postman request a single developer runs manually runs nowhere when that developer is away. Postman is not the place for e2e API tests; the test framework is.
- The load-bearing advantage is version control. A `.http` file lives beside the code it calls, travels in the same pull request, and shows up in code review. Rename an endpoint and the request change lands in the same diff. The API examples version with the source instead of drifting in a shared workspace.
- Postman's friction, all post-2023: the desktop app requires a login, the install is roughly 900MB, and collections sync to Postman's cloud. Scratch Pad (the offline mode) was retired.
- Cloud sync hazard: Postman has overwritten one teammate's collection edits with another's with no warning, and recovering the lost version means digging through version history, which sits behind a paid tier. A merge conflict in a checked-in `.http` file is an ordinary git conflict the team already knows how to resolve.
- Pricing pressure: the Postman free tier dropped to a single user in 2026, so adding a second teammate forces a paid plan. This is the cost of standardising a team on the tool.
- Wider context (not all needed in the post): a wave of account-free alternatives — Bruno, Hoppscotch, Requestly, Yaak — points the same direction, toward local-first, file-based, git-friendly API clients. The `.http` + cURL pairing is the zero-new-dependency version of that move.

**Scope note:** craft/opinion teardown. The Postman friction points (login, 900MB, cloud sync overwrite, free-tier shrink) are sourced facts; the "requests are code, keep them in git" stance is the editorial position and is stated without softening per stop-slop.

## Sources

- https://playwright.dev/docs/api-testing
- https://www.jetbrains.com/help/idea/http-client-in-product-code-editor.html
- https://testfully.io/blog/http-files/
- https://medium.com/codecodecode/ship-your-api-requests-as-code-a-practical-guide-to-http-e095a8c724ca
- https://aymalla.medium.com/apis-testing-using-http-files-and-rest-client-02137c3b67b3
- https://apidog.com/blog/postman-everything-app-strategy-why-developers-leaving/
- https://learning.postman.com/docs/getting-started/basics/syncing
- https://medium.com/@PlanB./goodbye-postman-why-devs-are-ditching-the-cloud-and-going-local-c13f88b43af2
- https://jonathansblog.co.uk/best-postman-alternatives-2026
