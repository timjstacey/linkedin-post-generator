A dropdown in our app shipped with a backdrop that never faded and a panel that jumped instead of sliding open. The component test for it had passed green on every commit for three weeks.

The test ran in jsdom. jsdom parses CSS but renders nothing, so it never runs a real transition. Our test waited for a transitionend event before it asserted the panel was visible. In jsdom that event never fires. The test stopped waiting on the next tick and checked an element the real browser had not finished animating. It confirmed the markup existed. It said nothing about whether a user could watch the panel open.

I moved the test to Playwright component testing. It mounts the same React component in a real Chromium, so the transition runs and transitionend fires when the animation ends. The test failed on the first run, and the trace showed me the frozen backdrop. Hover states and intersection observers behave the way they do in production, because a browser drives them.

The component fetched its options from an API. I reused our existing MSW handlers through Playwright's router fixture, so I mocked the same responses without standing up the app.

These real-browser tests run two to four times slower per case, so I keep jsdom for pure logic and reach for the browser on components that animate or depend on layout. A test that renders nothing cannot tell you what a user sees.

#Playwright #ComponentTesting #FrontendTesting #TestAutomation #React
