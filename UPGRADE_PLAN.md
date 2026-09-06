# UPGRADE_PLAN.md — digital-banking-web: Angular 14 → 18 Migration  
  
> **Note on reference material:** This report is built from (a) a full inspection of the  
> repository and (b) knowledge of the Angular update guide and Angular Material MDC  
> migration. Where a version-specific Node/TypeScript range or a schematic detail could  
> have drifted, it is flagged as **[verify against guide]** so it can be confirmed against  
> the live guide before executing.  
  
---  
  
## 1. Repository inspection  
  
### 1.1 What is actually here  
  
| Project | Path | Type | Builder |  
|---|---|---|---|  
| `ui-components` | `libs/ui-components` | library | `@angular-devkit/build-angular:ng-packagr` |  
| `retail-banking` | `apps/retail-banking` | app | `browser` builder |  
| `wealth-portal` | `apps/wealth-portal` | app | `browser` builder |  
  
Pinned toolchain: Angular 14.2.x, Material/CDK 14.2.7, TypeScript 4.7.4, rxjs 7.5.7,  
zone.js 0.11.8, Node 16.20.2.  
  
### 1.2 The structural facts that shape the whole migration  
  
1. **Apps consume the library as a built package.** `tsconfig.json` maps  
   `@bofa/ui-components` to `dist/ui-components`, not to library source. The library must be  
   built before the apps compile or test.  
2. **The Sass theme is consumed from source, asymmetrically.** Each app's `styles.scss`  
   does `@use '../../../libs/ui-components/src/styles/theme'` and invokes `bofa-theme()`.  
3. **The design system is coupled to Material's pre-MDC DOM in three independent layers:**  
   global Sass overrides, wrapper components, and test assertions (detailed in §2.2).  
4. **One workspace, one lockfile, one `package.json`** — all three projects share the same  
   Angular version. There is no way to hold one project back.  
  
---  
  
## 2. Breaking-change cross-reference  
  
### 2.1 Guide-listed changes and whether they apply here  
  
| Guide item (14→18) | Applies? | Files touched | Notes |  
|---|---|---|---|  
| Node 16 → 18/20 required | **Yes** | `.nvmrc`, CI/env | Node 16 pin conflicts with 17/18 requirements. |  
| TypeScript 4.7 → 5.4+ | **Yes** | `package.json` | 4.7.4 is far below the 5.4 floor Angular 18 needs. |  
| Angular Material MDC migration (v15) | **Yes — largest work item** | `_theme.scss`, all specs, wrappers | See §2.2. |  
| Legacy typography config API change (v15) | **Yes** | `_typography.scss` | Uses `$headline`/`$title`/`$subheading-2`/`$body-1` legacy level names. |  
| `define-palette` / theming (`m2`/`m3`) API changes | **Yes** | `_palettes.scss`, `_theme.scss` | Custom navy/red palettes with hand-authored contrast maps; `define-light-theme` and `all-component-themes` usage. |  
| `zone.js` import style / polyfills moved to `angular.json` (v15/16) | **Yes** | `polyfills.ts`, `angular.json` | Old-style `import 'zone.js'` polyfills file still present. |  
| `@angular/flex-layout` removal | **No** | — | Not used. |  
| RxJS 6 → 7 interop shims | **No** | — | Already on rxjs 7.5.7. |  
| Standalone / control-flow / `NgModule` migrations | **Optional, not required** | — | App is NgModule-based; migration is opt-in and not needed to reach v18. |  
| Router / `HttpClient` / SSR / hydration changes | **No** | — | No router config, no HTTP, no SSR in either app. |  
| `application` builder / esbuild migration (v17) | **Optional** | `angular.json` | Apps use the `browser` builder; staying on it is valid, esbuild is opt-in. |  
| Karma deprecation (v18) | **Partially** | `karma.conf.js` x3 | Karma still runs in 18 but is deprecated; the `clearContext: true` workaround must be preserved. |  
  
### 2.2 What the guide has NO visibility into (the real work)  
  
These are custom code built on framework internals. `ng update` schematics will not touch  
them, and most fail **silently** (dead CSS, not compiler errors).  
  
1. **Global Sass overrides targeting Material's internal legacy class names.** The  
   `overrides()` mixin restyles `.mat-button-base`, `.mat-card`,  
   `table.mat-table`/`th.mat-header-cell`/`tr.mat-row`,  
   `.mat-form-field-appearance-outline .mat-form-field-outline`, `.mat-dialog-container`,  
   and `.mat-calendar-body-selected`. Under MDC these become `mat-mdc-*` / `mdc-*` and the  
   selectors quietly stop matching. The `!important` on `.mat-card`'s shadow will  
   additionally fight MDC specificity.  
2. **Test assertions hard-coded to legacy DOM.** Button spec asserts `mat-flat-button`;  
   table spec asserts `th.mat-header-cell` and `tr.mat-row`; both app specs query  
   `bofa-table tr.mat-row`. These fail **loudly** under MDC.  
3. **The cross-project Sass-from-source import + `bofa-theme()` entry point.** Schematics  
   operate on TS/HTML/known config, not a bespoke relative Sass path into another project.  
4. **Build-order coupling.** The `dist/ui-components` alias means every library change must  
   be rebuilt before apps see it; `ng update` assumes a normal single-project graph.  
5. **The `clearContext: true` Karma workaround** and its documented rationale.  
  
---  
  
## 3. Migration scope: can the apps stay behind?  
  
**No. All three projects must move together, in lockstep, per major version.**  
Justification, from the repo's own structure:  
  
- There is a single root `package.json` with one set of Angular dependencies shared by all  
  three projects — there is no per-project version pinning.  
- The apps import the library's compiled output and its public types (`BofaDialogService`,  
  `BofaTableColumn`) directly, so a version skew between library and app Angular runtimes is  
  not supported.  
- The apps pull the theme from library **source**, so any Sass/theming API change in the  
  library is compiled by the app build immediately.  
  
So "migrate the library" in this workspace unavoidably means "migrate the workspace." The  
library is the leaf that everything depends on, which is why every step below is **lib-first,  
then apps**.  
  
---  
  
## 4. Phased execution plan  
  
Ordering principle: **one major version per phase; within v15, split the framework bump from  
the MDC migration.** This is safer than doing framework + MDC together because the two  
failure modes are different (silent CSS vs. loud test failures); splitting gives a  
fully-green legacy checkpoint so every MDC failure is unambiguously attributable. Material's  
`legacy-*` entry points make this split possible on v15 and survive through v16, but are  
removed in v17 — so MDC must be finished before crossing v17. **[verify against guide]**  
  
Node/TypeScript ranges below are the Angular support minimums to my knowledge; confirm exact  
values against the guide. **[verify against guide]**  
  
| Phase | ng update command(s) | Node | TypeScript | Purpose |  
|---|---|---|---|---|  
| **0 — Baseline** | none | 16.20.2 | 4.7.4 | Branch, screenshots, `.d.ts` snapshot |  
| **1 — 14→15 (framework, legacy Material)** | `ng update @angular/core@15 @angular/cli@15 && ng update @angular/material@15 --migrate-only=false` then switch imports to `@angular/material/legacy-*` | 16.13+ / 18.10+ | 4.8–4.9 | Green framework baseline, DOM unchanged |  
| **2 — MDC migration (still v15)** | `ng generate @angular/material:mdc-migration` | same as Phase 1 | same | Move off legacy DOM; rewrite overrides + specs |  
| **3 — 15→16** | `ng update @angular/core@16 @angular/cli@16 @angular/material@16` | 16.14+ / 18.10+ | 4.9–5.1 | |  
| **4 — 16→17** | `ng update @angular/core@17 @angular/cli@17 @angular/material@17` | 18.13+ / 20.9+ | 5.2–5.4 | Legacy packages already gone — must be clean by now |  
| **5 — 17→18** | `ng update @angular/core@18 @angular/cli@18 @angular/material@18` | 18.19+ / 20.11+ | 5.4–5.5 | Final target |  
  
### Why this ordering over the alternatives  
  
- **vs. "framework + MDC in one v15 step":** combining them stacks silent CSS regressions,  
  red tests, and framework churn into a single commit across three coupled projects — no  
  green baseline to diff against. Splitting converts one large ambiguous failure into two  
  attributable ones.  
- **vs. "jump straight to 18":** `ng update` only supports one-major-at-a-time; skipping  
  versions skips their migration schematics.  
- **vs. "apps first, library later":** impossible here — the dependency direction is  
  apps→library, and the shared `package.json` forbids skew (§3).  
  
### Per-phase mechanics (carry these into every phase)  
  
1. `nvm use <node for this phase>`, install the matching TypeScript, update `package.json`  
   pins.  
2. Run the `ng update` command(s) for the phase.  
3. **Rebuild the library first** (`npm run build:lib`), then build apps — the `dist/` alias  
   requires it.  
4. Run the green gate (§6). Commit only when fully green (§7).  
5. Update `MIGRATION_NOTES.md`.  
  
### Phase-specific notes  
  
- **Phase 1:** after `ng update @angular/material@15`, the schematic defaults components to  
  MDC. To hold the DOM stable, repoint the library's Material imports to the `legacy-*` entry  
  points (e.g. `MatButtonModule` → `@angular/material/legacy-button`) in  
  `ui-components.module.ts`, and keep `_theme.scss` legacy selectors as-is. Update  
  `_typography.scss` / `_palettes.scss` only as far as needed to compile on v15's Sass API;  
  record any required rename.  
- **Phase 2 (MDC):** run the `mdc-migration` schematic, then **manually** rewrite the  
  `_theme.scss` selectors to the new `mat-mdc-*`/`mdc-*` DOM, and update the four specs'  
  assertions (`mat-flat-button`, `mat-header-cell`, `mat-row`) to the MDC equivalents. This  
  is where the visual check (§6) is the real arbiter, not the build.  
- **Phase 4:** legacy Material packages are removed in v17, so entering this phase requires  
  Phase 2 to be fully complete; if any `legacy-*` import remains, stop.  
  
---  
  
## 5. Risk ranking by blast radius  
  
| # | Risk | Blast radius | Detect | Contain | Caught by green build+tests? |  
|---|---|---|---|---|---|  
| 1 | **MDC DOM rename silently kills the `_theme.scss` overrides** — cards/table/form-field/dialog/calendar lose their BofA styling | All surfaces, both apps | Visual diff vs. baseline screenshots | Rewrite selectors to MDC DOM in Phase 2; keep overrides in one file | **No — silent.** Build passes, tests may pass, styling still broken |  
| 2 | **MDC density/typography shifts change sizing & spacing** even after selectors are fixed | All Material components | Visual diff; measure control heights | Report differences for judgement; do not auto-apply density compat | **No — silent** |  
| 3 | **Broken alignment between BofA elements and Material internals** (e.g. `.bofa-field` width vs. MDC form-field box model) | Forms, table cells | Visual diff on form fields & right-aligned cells | Restore alignment, note in MIGRATION_NOTES | **No — silent** |  
| 4 | **Spec assertions on legacy classes fail** (`mat-flat-button`, `mat-header-cell`, `mat-row`) | 4 spec files | Test run (loud) | Update assertions to MDC truth with written rationale | **Yes — loud** |  
| 5 | **Custom palette/contrast-map API breakage** in `define-palette`/theming across v15–v18 | Theme compile | Lib/app Sass build failure | Migrate to current theming API, preserve navy/red anchors & contrast | **Yes — loud** (compile error) |  
| 6 | **Node/TS floor mismatch** at a phase boundary | Whole workspace | `ng`/`tsc` refuses to run | `nvm use` + TS bump before each phase | **Yes — loud** |  
| 7 | **Build-order/`dist` staleness** — apps compile against stale library output | Both apps | "Cannot find module '@bofa/ui-components'" or stale types | Always `build:lib` before apps; rebuild after every lib change | **Yes — loud** |  
| 8 | **Public API drift** in library `.d.ts` | Both apps + external consumers | `.d.ts` diff vs. baseline | Fix exports; treat any diff as a regression unless approved | Partially — type-level, see §7 |  
  
**Risks a green build + green tests would NOT catch: #1, #2, #3.** These are visual/layout  
regressions in MDC's rendered output. This is exactly why the green gate (§6) must include  
the screenshot comparison, and why MDC density differences are *reported for judgement*, not  
silently accepted.  
  
---  
  
## 6. Definition of "green" for this repo  
  
A phase is green only when **all** of the following pass, **in this order**:  
  
1. **Build, library first (mandatory ordering):**  
   - `npm run build:lib` → then `npm run build:apps`. The `dist/ui-components` alias makes  
     lib-first non-negotiable.  
2. **All three test suites, headless, library first:**  
   - `npm run test:all` — builds the lib, then runs `ui-components`, `retail-banking`,  
     `wealth-portal` on `ChromeHeadless`. Preserve `clearContext: true` in every  
     `karma.conf.js`.  
3. **Public API check:** `.d.ts` diff of `dist/ui-components` against the Angular 14  
   baseline — no unapproved changes (§7).  
4. **Visual check:** `npm run start:retail` (4200) and `npm run start:wealth` (4300),  
   compare against Phase 0 baseline screenshots for the key surfaces:  
   - **Cards** — `bofa-card` radius/border/shadow (retail summary + panel cards, wealth  
     summary + holdings)  
   - **Table** — `bofa-table` header styling (navy uppercase, 2px underline) and row hover  
   - **Form fields** — `bofa-text-input` outline color + `bofa-datepicker` (retail payment  
     form)  
   - **Buttons** — pill shape, primary/secondary/ghost variants  
   - **Open dialog** — trigger "Send payment" (retail) / "Request rebalance" (wealth) and  
     compare `BofaConfirmDialogComponent` radius/padding/shadow  
  
A phase is green **only when build + all three suites + `.d.ts` check + visual match all  
hold**.  
  
---  
  
## 7. Carried-forward constraints (bind these into the handoff)  
  
- **Public API stability, verified per step.** After each phase, diff `dist/ui-components`  
  `.d.ts` against the `baseline-angular-14` snapshot. The surface to hold stable:  
  `UiComponentsModule`, `BofaButtonComponent` + `BofaButtonVariant`, `BofaCardComponent`,  
  `BofaDatepickerComponent`, `BofaConfirmDialogComponent` + `BofaConfirmDialogData`,  
  `BofaDialogService`, `BofaTableComponent` + `BofaTableColumn`, `BofaTextInputComponent`.  
  Verify against real consumption: apps import `BofaDialogService`/`BofaTableColumn` and  
  template selectors `bofa-*`.  
- **Tests updated to new truth, never weakened.** Where MDC changes the DOM, rewrite  
  assertions (e.g. `mat-flat-button` → MDC button class) with a written explanation per  
  change in `MIGRATION_NOTES.md`. Never delete, skip, or loosen an assertion.  
- **One commit per green step.** Green = build + all suites + `.d.ts` check + visual match.  
  MDC **density** differences are reported for judgement, not auto-fixed. Broken  
  **alignment** between elements is a regression — restore and note it.  
- **Branching discipline.** Work on a branch off `baseline-angular-14`; never push `main`;  
  never move the tag.  
- **`MIGRATION_NOTES.md` per step:** each breakage as symptom → cause → fix → evidence;  
  **silent changes (CSS/layout) listed separately from loud ones (compile/test)**; record  
  no-op fixes and any deviation from this plan.  
- **Stop rule.** If a step can't reach green in a few attempts, stop and surface it — do not  
  push through.  
  
---  
  
## 8. Assumptions & judgement calls (approve or override each)  
  
1. **Reference guide not fetched.** All Node/TS ranges and schematic names are from  
   knowledge, marked **[verify against guide]**. Confirm before executing.  
2. **All three projects move together, per major version** (§3). Judgement call driven by  
   the shared `package.json` and `dist/` coupling.  
3. **v15 split into two commits** (framework-on-legacy, then MDC) rather than one. This adds  
   a commit but isolates silent vs. loud failures.  
4. **Stay on the `browser` builder; do not migrate to the esbuild `application` builder.**  
   Keeps blast radius down; esbuild migration is opt-in. Override if you want the perf/SSR  
   benefits.  
5. **Stay on NgModules; skip standalone/control-flow migrations.** Not required to reach  
   v18; the app is NgModule-based. Override if you want them as part of this effort.  
6. **Keep Karma despite v18 deprecation.** No test-runner swap in scope; preserve  
   `clearContext: true`. Override if you want a Web Test Runner/Jest migration.  
7. **Visual baseline is manual screenshot comparison** of the surfaces in §6, not an  
   automated pixel-diff harness (none exists in the repo). Override if you want one added  
   (e.g. Playwright/Percy) as a Phase 0 task.  
8. **`MatNativeDateModule` date adapter stays** (no move to Luxon/date-fns adapter). The  
   datepicker uses native `Date`.  
9. **The library `peerDependencies` range (`^14.2.0`) will be bumped per phase** to match.  
  
### Unknowns / not verified  
  
- Could not confirm the exact contents of `plans/02-applications.md` (the puppeteer  
  contingency referenced by the README) — if the CI machine's Chrome is unavailable, that  
  contingency may need to be applied per phase.  
- There are **no spec files** for `card`, `text-input`, or `datepicker` components (only  
  `button`, `table`, `dialog.service`, and the two app specs exist), so those components have  
  no unit-test safety net — visual check is the only guard for them.