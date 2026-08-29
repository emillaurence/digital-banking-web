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

2. **Give the apps distinct dev ports** so both can run at once. In `angular.json`, inside `projects.wealth-portal.architect.serve`, add an `options` block (the generated `serve` target has none):

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

3. **Commit:**

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

**This is the Karma/Chrome gate — the highest-risk step in the entire build, verified here deliberately rather than discovered at phase 6.** If a test run hangs (e.g. sits at "Connected on socket" or never launches a browser), treat it as a launcher failure, not a slow test run — see the first risk below.

Then, briefly:

```bash
npx ng serve retail-banking   # http://localhost:4200 shows the Angular placeholder page; Ctrl+C
npx ng serve wealth-portal    # http://localhost:4300 shows the placeholder page; Ctrl+C
```

## Done when

Both `ng build` commands exit 0, both headless test runs report `SUCCESS` with 0 failures, and both apps serve on their ports.

## Risks

- **Headless Chrome fails to launch — two distinct failure modes.** This is the most machine-dependent step in the whole build and the likeliest hard blocker.
  1. **Old headless mode removed (the likelier failure in 2026).** Angular 14's `karma-chrome-launcher` 3.x starts Chrome with the **old headless mode**, which recent Chrome versions have removed. Symptom: the test run **hangs** (Karma waits forever for a browser that never connects) or the launcher **crashes immediately** — *not* a "binary not found" message. Fix: install a Puppeteer version that bundles a Chromium old enough for karma-chrome-launcher 3.x, and point Karma at it:
     ```bash
     npm install --save-exact --save-dev puppeteer@19.7.5
     ```
     Then at the top of **each** `karma.conf.js` (both apps now; the library's in phase 3):
     ```js
     process.env.CHROME_BIN = require('puppeteer').executablePath();
     ```
     `puppeteer@19.7.5` bundles Chromium ~111, which still supports old headless; Puppeteer 20+ switched to downloading Chrome for Testing, which may not. That version choice is best-effort recall, not verified on this machine — if 19.7.5's Chromium also fails, try an older 19.x/18.x; the requirement is simply "a bundled Chromium with old headless mode".
  2. **Binary genuinely not found** (`No binary for ChromeHeadless browser on your platform`). Chrome is installed somewhere non-standard. Fix: `export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"` (or the actual path) and re-run. If the run then hangs, you are in failure mode 1 — use the Puppeteer fallback.
- **Apps land in the wrong folder** (`projects/` instead of `apps/`). Means step 4 of plan 01 was skipped. Fix: delete the generated folders, remove their entries from `angular.json`, correct `newProjectRoot`, regenerate.
- **Schematic prompts interactively.** Both prompt-worthy options (`--style`, `--routing`) are passed explicitly; if anything else prompts, accept the default.
