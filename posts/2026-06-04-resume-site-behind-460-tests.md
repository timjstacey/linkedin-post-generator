I built my resume as a static site, then started treating it like a product.

It runs 460 tests before it deploys. 247 unit tests cover the logic: the rule that flips a job application to "ghosted" after 28 silent days, the nav focus-trap, the blog paging. 213 Playwright tests cover the browser slice — focus, navigation, the layout that collapses below 425px. Run every spec on every browser and you get 784 runs, most of them identical HTML re-checked three times. Routing each spec to where it matters cuts that to 213.

The content is YAML. I edit a four-line job entry, a Zod schema validates it at build, and Cloudflare Pages ships it. A pull request runs lint, the unit suite under a coverage gate, a typecheck, and the build before it can merge. A second workflow waits for the preview deploy and points Playwright at the live URL, so the tests hit the same static output a visitor would.

Then nightly jobs take over. Three of them refresh the GitHub stars on my projects grid, the CI stats on the testing page, and the test counts. A fourth reads my commits and bumps the version on its own.

I wrote up the whole build — every page, the unit-first test split, the pipeline that gates each merge — on the blog:

https://tim.sillysamoyed.com/blog/resume-site-behind-460-tests

#Astro #StaticSite #Playwright #ContinuousIntegration #TestAutomation
