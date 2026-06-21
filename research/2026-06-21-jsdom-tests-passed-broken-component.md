# Research: My jsdom Component Tests Passed While the Component Was Broken

**Date range:** 2026-05-24 to 2026-06-21

## Summary

Component tests that run in jsdom (or happy-dom) execute a JavaScript approximation of
the DOM, not a real browser. jsdom parses CSS but runs no layout or paint engine, so a
component can be visibly broken while a functional test stays green. Concrete failure
modes called out across 2026 sources:

- transitionend / animationend events never fire in jsdom because there is no real
  transition, so any test that awaits them resolves immediately and asserts against an
  element the real browser has not finished animating.
- IntersectionObserver, ResizeObserver, Shadow DOM, CSS custom properties, hover, focus,
  and scroll behavior are missing or behave differently.
- A misaligned button or broken modal backdrop still passes a functional test (the click
  fires, the form submits); only real rendering or visual regression catches it.
- jsdom 27.3.0 crashed on valid CSS due to an @acemir/cssom regression (jsdom issue #3997),
  illustrating the maintenance cost of stubbing a browser in JS.

The 2026 fix is real-browser component testing. Playwright component testing (experimental)
mounts a real React/Vue component in a real Chromium/Firefox/WebKit instance, drives it with
real locators, and captures traces, all without standing up the full app. Vitest 3/4 Browser
Mode does the same on top of Playwright and shares a Chromium context across tests.

Network mocking in component tests now reuses existing MSW handlers: Playwright's experimental
router fixture exposes router.route(url, handler) (like page.route) and router.use(handlers)
to pass MSW http handlers directly. The @msw/playwright package bridges the same handlers via
page.route until cross-process interception ships.

Trade-off: real-browser component tests run roughly 2-4x slower per case than jsdom because of
layout/paint/engine overhead, so teams keep jsdom for pure logic and reserve the browser for
components that animate or depend on layout. Playwright 1.59 also dropped
@playwright/experimental-ct-svelte and limited @playwright/experimental-ct-react to React 18.

## Sources

- https://playwright.dev/docs/test-components
- https://playwright.dev/docs/release-notes
- https://qaskills.sh/blog/playwright-component-testing-react-complete-guide
- https://www.pkgpulse.com/blog/vitest-browser-mode-vs-playwright-component-testing-vs-2026
- https://www.epicweb.dev/vitest-browser-mode-vs-playwright
- https://github.com/mswjs/playwright
- https://www.sitepoint.com/vitest-4-browser-mode-component-testing-without-playwright/
- https://github.com/jsdom/jsdom/issues/3997
