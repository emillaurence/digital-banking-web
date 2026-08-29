# digital-banking-web — build plan index

A baseline Angular 14 monorepo for Bank of America's customer-facing frontend: one shared component library (`@bofa/ui-components`, the **BofA Design System** built on Angular Material) consumed by two applications — `retail-banking` (Bank of America **Online Banking**) and `wealth-portal` (**Merrill Wealth Management**; Merrill is Bank of America's wealth management arm, which is why two distinct applications share one component library). Angular CLI multi-project workspace, npm, no extra monorepo tooling. This baseline is the starting point for a later Angular 14 → 18 migration exercise. It is a representative reference application, not Bank of America's actual codebase.

## Phases

| # | Plan | One-liner | Est. |
|---|---|---|---|
| 1 | [01-workspace-toolchain.md](01-workspace-toolchain.md) | Node 16 selected, empty Angular 14 workspace created in this repo, exact versions pinned, project roots set to `apps/` | ~20 min |
| 2 | [02-applications.md](02-applications.md) | `retail-banking` and `wealth-portal` apps generated; both build, serve, and pass their generated tests — **this is the Karma/Chrome gate, the highest-risk step in the build** | ~15 min |
| 3 | [03-library-and-theme.md](03-library-and-theme.md) | `libs/ui-components` library scaffolded, Angular Material 14 installed, custom design-system theme written and applied to both apps | ~30 min |
| 4 | [04-components.md](04-components.md) | Six design-system components implemented in the library (button, text input, card, table, dialog, datepicker) with tests | ~60 min |
| 5 | [05-retail-banking.md](05-retail-banking.md) | Retail banking dashboard built entirely from library components (cards, table, payment form, confirm dialog) | ~40 min |
| 6 | [06-wealth-portal-and-final.md](06-wealth-portal-and-final.md) | Wealth portal page built from library components; root npm scripts added; repo README written; full end-to-end verification; baseline tagged `baseline-angular-14` | ~30 min |

**Total: roughly 3–3.5 hours.**

Each phase ends with the whole repo in a buildable, testable state. Do not start a phase until the previous phase's "Done when" condition holds.

## Prerequisites before phase 1

1. **Node 16.20.2** (final Node 16 release). Angular 14 supports Node `^14.15.0 || ^16.10.0` — it does **not** support Node 18+. Install via nvm:
   ```bash
   nvm install 16.20.2
   nvm use 16.20.2
   node -v    # must print v16.20.2
   npm -v     # bundled npm 8.19.4
   ```
   Every terminal used for this repo must run `nvm use 16.20.2` first (phase 1 adds an `.nvmrc` so `nvm use` alone works afterwards).
2. **npm** — bundled with Node 16, nothing extra to install. Do not use yarn/pnpm.
3. **A Chrome/Chromium that Karma can drive headlessly.** Karma (the default Angular 14 test runner) launches `ChromeHeadless` via `karma-chrome-launcher` 3.x, which invokes Chrome's **old headless mode** — removed from recent Chrome releases. A current system Chrome may therefore hang or crash the launcher (not a "binary not found" error). The reliable path is the Puppeteer fallback described in plan 02's risks: install `puppeteer@19.7.5` (bundles an old-headless-capable Chromium ~111) and set `process.env.CHROME_BIN = require('puppeteer').executablePath()` in each `karma.conf.js`. `CHROME_BIN` pointing at system Chrome only helps when the binary is merely in a non-standard location.
4. **No global Angular CLI needed** — all plans use `npx` / the workspace-local CLI, so a newer globally installed `ng` cannot interfere.

## Pinned versions (verified to exist on the npm registry on 2026-08-29)

| Package | Version |
|---|---|
| Node / npm | 16.20.2 / 8.19.4 |
| `@angular/*` runtime + `@angular/compiler-cli` | 14.2.12 |
| `@angular/cli`, `@angular-devkit/build-angular` | 14.2.13 |
| `@angular/material`, `@angular/cdk` | 14.2.7 |
| `ng-packagr` | 14.2.2 |
| `typescript` | 4.7.4 |
| `rxjs` | 7.5.7 |
| `zone.js` | 0.11.8 |
| `tslib` | 2.4.1 |
| `puppeteer` (Karma fallback only, if needed — see plan 02 risks) | 19.7.5 |

(`@angular/core@14.3.0` and `ng-packagr@14.3.0` also exist, but they are off-cycle releases outside the 14.2 train; everything here stays on 14.2.x deliberately.)

## End-to-end verification (after phase 6)

From the repo root, on Node 16.20.2:

```bash
node -v              # v16.20.2
npm run build:all    # builds ui-components, then retail-banking, then wealth-portal — all succeed
npm run test:all     # runs the lib suite + both app suites headlessly — all green
npm run start:retail # http://localhost:4200 → themed retail dashboard (cards, table, payment form, working dialog)
npm run start:wealth # http://localhost:4300 → themed wealth portfolio (cards, table, rebalance dialog)
git tag --list baseline-angular-14   # the migration-rehearsal restore point exists (phase 6)
test -f README.md                    # repo README written (phase 6)
```

Downstream-coupling sanity check (the property the demo depends on): renaming an `@Input()` in `libs/ui-components/src/lib/button/button.component.ts` and running `npm run build:all` must fail in the **app** builds, not just the lib.

## Assumptions and uncertainties

Things verified vs. things I would confirm by running, not recalling:

1. **Verified:** every pinned version above exists on the npm registry (checked 2026-08-29). The combination (14.2.12 core + 14.2.13 CLI + TS 4.7.4 + RxJS 7.5.7 + zone.js 0.11.8 + Material 14.2.7 + ng-packagr 14.2.2) is the standard Angular 14.2 release train, but I have not executed an install/build with it in this session — treat phase 1/3 verification steps as the real proof.
2. **Material 14 Sass typography API.** Angular Material 14 was mid-transition on theming APIs. The plans use the conservative v14-documented form — `@include mat.core($typography-config)` plus a `color`-only map in `mat.define-light-theme(...)` — and deliberately avoid the `typography:`/`density:` keys in the theme map, whose v14 behavior I'm less sure of. If `mat.core($config)` prints a deprecation warning, ignore it; it works on 14.
3. **`ng new --directory .` into a non-empty folder.** The repo currently contains only `LICENSE`, `plans/`, and `.git`, none of which collide with generated files, so this should succeed. If the CLI refuses, fallback: run `ng new` in a temp folder and move the generated files into the repo root.
4. **Library generation path.** I am not certain the v14 `ng generate library` schematic supports `--project-root`, so the plans avoid it: `newProjectRoot` in `angular.json` is temporarily flipped to `libs`, the library is generated, then it's flipped back to `apps`. Deterministic, if inelegant.
5. **Generated `tsconfig.json` path mapping for the library.** Different 14.x patches generated slightly different `paths` entries. Phase 3 overwrites the `paths` block explicitly (mapping `@bofa/ui-components` → `dist/ui-components`), so whatever the schematic writes doesn't matter. Consequence to remember: **the library must be built before an app can compile or test** — the npm scripts encode this order.
6. **Karma + a 2026-era Chrome — the highest-risk item in the build, verified at phase 2 deliberately.** `karma-chrome-launcher` 3.x starts Chrome in the **old headless mode**, which recent Chrome versions removed; the symptom is a hang at launch or an immediate launcher crash, *not* a missing-binary error. Do not misread a phase 2/6 test hang as a slow run. Fallback (detailed in plan 02): `npm install --save-exact --save-dev puppeteer@19.7.5` and set `process.env.CHROME_BIN = require('puppeteer').executablePath()` at the top of each `karma.conf.js`. Puppeteer ≤19 bundles Chromium (v19.7.5 → ~Chromium 111, which still has old headless); v20+ downloads Chrome for Testing, which may not. I have not executed this on the target machine — the exact bundled-Chromium version is a best-effort recall; treat plan 02's verification as the real proof.
7. **npm engine/deprecation warnings.** Installing 2022-era packages on Node 16 in 2026 will print `npm WARN deprecated` and possibly `EBADENGINE` warnings from transitive dev dependencies. These are expected and non-fatal; only a hard `npm ERR!` matters.
8. **Google Fonts link** in the apps' `index.html` needs network at runtime; offline it silently falls back to Helvetica/Arial. Cosmetic only.
9. **Legacy (pre-MDC) Material components.** v14 Material ships the "legacy" components; the design-system overrides target legacy class names (`.mat-flat-button`, `.mat-card`, …). This is correct for 14 — and it is exactly the kind of thing that makes the later v15+/MDC migration non-trivial, which is the point of the demo.
