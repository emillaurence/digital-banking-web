# 02 — Generate the two applications

## Goal

Two runnable applications exist under `apps/` — `retail-banking` and `wealth-portal` — and both build, serve, and pass their generated unit tests.

## Prerequisites

- Plan 01 done (workspace exists, `newProjectRoot` is `apps`, Node 16.20.2 active: `node -v`).
- Google Chrome installed (Karma launches ChromeHeadless).

## Steps

All commands from the repo root.

1. **Generate both apps** (SCSS styles, no router — the demo pages are single-screen; flags are passed explicitly so the schematic doesn't prompt):

   ```bash
   npx ng generate application retail-banking --style scss --routing false
   npx ng generate application wealth-portal --style scss --routing false
   ```

   Expected result: `apps/retail-banking/` and `apps/wealth-portal/` with `src/`, `tsconfig.app.json`, `tsconfig.spec.json`, and two new projects in `angular.json`.

2. **Enable `clearContext` in both generated `karma.conf.js` files.** The schematic default is `clearContext: false`, which makes `karma-jasmine-html-reporter` navigate the page after the run finishes; Karma reports that navigation as `Some of your tests did a full page reload!` and prints `ERROR` lines even though every spec passed (the exit code stays 0, but the noise is misleading and could mask a real failure). In `apps/retail-banking/karma.conf.js` **and** `apps/wealth-portal/karma.conf.js`, change:

   ```js
   clearContext: false // leave Jasmine Spec Runner output visible in browser
   ```

   to:

   ```js
   clearContext: true // false makes the HTML reporter navigate post-run, which Karma logs as a spurious "full page reload" ERROR
   ```

   Replace the trailing comment as shown — the generated one describes the `false` behaviour and goes stale with the new value.

3. **Give the apps distinct dev ports** so both can run at once. In `angular.json`, inside `projects.wealth-portal.architect.serve`, add an `options` block (the generated `serve` target has none):

   ```json
   "serve": {
     "builder": "@angular-devkit/build-angular:dev-server",
     "options": {
       "port": 4300
     },
     ...
   }
   ```

   Leave `retail-banking` on the default 4200.

4. **Commit:**

   ```bash
   git add -A
   git commit -m "Generate retail-banking and wealth-portal applications"
   ```

## Verification

```bash
npx ng build retail-banking            # succeeds, output in dist/retail-banking
npx ng build wealth-portal             # succeeds, output in dist/wealth-portal
npx ng test retail-banking --watch=false --browsers=ChromeHeadless   # 3 specs, 0 failures
npx ng test wealth-portal  --watch=false --browsers=ChromeHeadless   # 3 specs, 0 failures
```

**This is the Karma/Chrome gate, verified here deliberately rather than discovered at phase 6.** Verified on this machine: Chrome Headless 151 launches fine under `karma-chrome-launcher` 3.1, so this is expected to pass. If a test run does hang (e.g. sits at "Connected on socket" or never launches a browser), treat it as a launcher failure, not a slow test run — see the first risk below.

Then, briefly:

```bash
npx ng serve retail-banking   # http://localhost:4200 shows the Angular placeholder page; Ctrl+C
npx ng serve wealth-portal    # http://localhost:4300 shows the placeholder page; Ctrl+C
```

## Done when

Both `ng build` commands exit 0, both headless test runs report `SUCCESS` with 0 failures, and both apps serve on their ports.

## Risks

- **Headless Chrome fails to launch.** **Verified working on this machine** (2026-08-29): Chrome Headless 151 launches and runs the suites under `karma-chrome-launcher` 3.1 — the old-headless-mode removal did not bite here, so this risk is a contingency, not the expected path. If it does fail on another machine, two distinct failure modes:
  1. **Hang or immediate launcher crash** (*not* a "binary not found" message) — the installed Chrome doesn't support the mode the launcher requests. Contingency: install a Puppeteer version that bundles its own compatible Chromium and point Karma at it:
     ```bash
     npm install --save-exact --save-dev puppeteer@19.7.5
     ```
     Then at the top of **each** `karma.conf.js` (both apps now; the library's in phase 3):
     ```js
     process.env.CHROME_BIN = require('puppeteer').executablePath();
     ```
     `puppeteer@19.7.5` bundles Chromium ~111 (Puppeteer 20+ downloads Chrome for Testing instead). The version choice is best-effort recall; if its Chromium also fails, try another 19.x/18.x.
  2. **Binary genuinely not found** (`No binary for ChromeHeadless browser on your platform`). Chrome is installed somewhere non-standard. Fix: `export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` (or the actual path) and re-run. If the run then hangs, you are in failure mode 1 — use the Puppeteer contingency.
- **`Some of your tests did a full page reload!` ERROR lines after a successful run.** Caused by the generated `clearContext: false` (the Jasmine HTML reporter navigates post-run); step 2 fixes it. If the lines appear anyway, check step 2 was applied to that project's `karma.conf.js`.
- **Apps land in the wrong folder** (`projects/` instead of `apps/`). Means step 4 of plan 01 was skipped. Fix: delete the generated folders, remove their entries from `angular.json`, correct `newProjectRoot`, regenerate.
- **Schematic prompts interactively.** Both prompt-worthy options (`--style`, `--routing`) are passed explicitly; if anything else prompts, accept the default.
