# plans/02-applications.md — Karma browser contingency (puppeteer-bundled Chromium)

Referenced from `README.md` → "Testing notes". This is a **fallback only**. The default setup —
`ng test <project> --watch=false --browsers=ChromeHeadless` using the machine's installed Chrome —
is what `npm run test:all` relies on and what the Angular 14 baseline was proven green with. Apply
this contingency only when a CI machine (or a fresh dev box) has no usable Chrome: the
`karma-chrome-launcher` reports `No binary for ChromeHeadless browser on your platform`, or the
launcher hangs/crashes at startup.

Nothing here changes the Angular version, the test specs, or the `clearContext: true` setting.

## 1. Install the pinned `puppeteer`

`puppeteer` downloads a Chromium build matched to its own version at install time, so pinning the
package pins the browser. The pin below is the last 21.x release; its engine range is
`node >=16.13.2`, so the same pin works on the Node 16.20.2 baseline and on the Node 18/20 versions
required from Phase 4 onward (`UPGRADE_PLAN.md` §4.1).

```shell
npm install --save-dev --save-exact puppeteer@21.11.0
```

Notes:

- Use `--save-exact`; do not accept a caret range. A floating range would silently change the
  Chromium build between CI runs and invalidate the visual/test baseline.
- The download goes to `~/.cache/puppeteer` (override with `PUPPETEER_CACHE_DIR`). On CI, cache that
  directory between runs or the download repeats every job.
- If the CI network blocks the Chromium download, this contingency cannot work; fall back to a
  container image that ships Chrome instead.

Verify the binary exists and print its path:

```shell
node -e "console.log(require('puppeteer').executablePath())"
```

## 2. Point `CHROME_BIN` at the bundled Chromium in each `karma.conf.js`

There are three Karma configs and all three must receive the identical change:

- `libs/ui-components/karma.conf.js`
- `apps/retail-banking/karma.conf.js`
- `apps/wealth-portal/karma.conf.js`

Add the following at the very top of each file, before `module.exports`:

```js
// Contingency (plans/02-applications.md): use puppeteer's bundled Chromium when the
// machine has no Chrome. Only active when CHROME_BIN is not already set, so a
// machine with a real Chrome keeps using it.
if (!process.env.CHROME_BIN) {
  process.env.CHROME_BIN = require('puppeteer').executablePath();
}
```

Do not change anything else in the file. In particular:

- keep `browsers: ['Chrome']` in the config — the headless browser is still selected on the command
  line via `--browsers=ChromeHeadless`, exactly as `npm run test:all` does;
- keep `clearContext: true` — the schematic default of `false` makes the Jasmine HTML reporter
  navigate after the run, which Karma logs as a spurious "full page reload" ERROR and fails the
  "no ERROR lines" test standard.

If the CI runner executes as root inside a container, Chromium refuses to start without
`--no-sandbox`. In that case, and only in that case, add a custom launcher next to the existing
`browsers` entry and select it with `--browsers=ChromeHeadlessCI`:

```js
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu']
      }
    },
```

## 3. Verify

Library first (the apps' specs resolve `@bofa/ui-components` from `dist/ui-components`):

```shell
npm run build:lib
npx ng test ui-components  --watch=false --browsers=ChromeHeadless
npx ng test retail-banking --watch=false --browsers=ChromeHeadless
npx ng test wealth-portal  --watch=false --browsers=ChromeHeadless
```

Acceptance is the same as for the default setup: every run exits 0 with **no `ERROR` lines**, and the
spec counts match the baseline (`ui-components` 5, `retail-banking` 3, `wealth-portal` 2 at the
`baseline-angular-14` tag; update these numbers if later phases legitimately add specs — never fewer).

## 4. Scope and removal

- This is an environment workaround, not part of the migration. Record its use in
  `MIGRATION_NOTES.md` under the relevant phase's "Deviations from plan" so a later reader knows the
  tests ran on the bundled Chromium rather than the machine's Chrome.
- Once the CI image ships a working Chrome again, remove the `CHROME_BIN` block from the three
  configs and `npm uninstall puppeteer`, and re-run the three suites to confirm they are still green.
