# UPGRADE_PLAN.md — digital-banking-web: Angular 14 → 18 Migration

> **Reference material.** This report is built from (a) a full inspection of the repository and
> (b) the official Angular update guide (https://angular.dev/update-guide?v=14.0-18.0&l=3, "advanced"
> detail, read via its source data `adev/src/app/features/update/recommendations.ts`), the Angular
> version-compatibility table (https://angular.dev/reference/versions), and the Angular Material
> "Migrating to MDC-based Components" guide (`guides/v15-mdc-migration.md` in `angular/components`,
> 15.2.x/16.2.x branches, plus the `mdc-migration` schematic's `schema.json` and `collection.json`).
> Every value that was previously marked `[verify against guide]` has been confirmed against those
> sources; the marker is retained inline as **[verified against guide]** with a note where the
> originally stated value differed (§9).

---

## 1. Repository inspection

### 1.1 What is actually here

| Project | Path | Type | Builder |
|---|---|---|---|
| `ui-components` | `libs/ui-components` | library | `@angular-devkit/build-angular:ng-packagr` |
| `retail-banking` | `apps/retail-banking` | app | `browser` builder |
| `wealth-portal` | `apps/wealth-portal` | app | `browser` builder |

Pinned toolchain: Angular 14.2.12, CLI 14.2.13, Material/CDK 14.2.7, TypeScript 4.7.4, rxjs 7.5.7,
zone.js 0.11.8, Node 16.20.2 (`.nvmrc`), ng-packagr 14.2.2, Karma 6.4 + Jasmine 4.3.

Phase 0 baseline (this branch, Node 16.20.2): `npm ci`, `npm run build:all`, `npm run test:all` all
exit 0 with zero `ERROR` lines. Spec counts: `ui-components` 5/5, `retail-banking` 3/3,
`wealth-portal` 2/2.

### 1.2 The structural facts that shape the whole migration

1. **Apps consume the library as a built package.** `tsconfig.json` maps `@bofa/ui-components` to
   `dist/ui-components`, not to library source. The library must be built before the apps compile or
   test. `dist/` is gitignored.
2. **The Sass theme is consumed from source, asymmetrically.** Each app's `styles.scss` does
   `@use '../../../libs/ui-components/src/styles/theme'` and invokes `bofa-theme()`.
3. **The design system is coupled to Material's pre-MDC DOM in three independent layers:** global Sass
   overrides, wrapper components, and test assertions (detailed in §2.2).
4. **One workspace, one lockfile, one `package.json`** — all three projects share the same Angular
   version. There is no way to hold one project back.
5. **The library has its own `libs/ui-components/package.json`** with
   `peerDependencies` `@angular/{common,core,forms,cdk,material}: ^14.2.0`, `rxjs: ^7.5.0`. This is
   the range to bump each phase (§7).

---

## 2. Breaking-change cross-reference

### 2.1 Guide-listed changes and whether they apply here

| Guide item (14→18) | Applies? | Files touched | Notes |
|---|---|---|---|
| Node 16 → 18/20 required | **Yes** | `.nvmrc`, CI/env | Node 16 is supported through v16; v17 requires ≥18.13, v18 requires ≥18.19.1. **[verified against guide]** |
| TypeScript 4.7 → 5.4+ | **Yes** | `package.json` | 4.7.4 is below even the v15 floor (4.8.2); v18 needs 5.4.x–5.5.x. **[verified against guide]** |
| Angular Material MDC migration (v15) | **Yes — largest work item** | `_theme.scss`, all specs, wrappers | See §2.2. |
| Legacy typography config API change (v15) | **Yes** | `_typography.scss` | Uses `$headline`/`$title`/`$subheading-2`/`$body-1` legacy level names. v17 removes `mat.legacy-typography-hierarchy`. |
| `define-palette` / theming (`m2`/`m3`) API changes | **Yes** | `_palettes.scss`, `_theme.scss` | Custom navy/red palettes with hand-authored contrast maps; `define-light-theme` and `all-component-themes` usage. v17's Material update runs a `ThemeBaseMigration` that touches `mat.core()`/theme includes — review its diff to `_theme.scss`. |
| `zone.js` import style / polyfills moved to `angular.json` (v15/16) | **Yes** | `polyfills.ts`, `angular.json` | Old-style `import 'zone.js'` polyfills file still present. zone.js floor: 0.13.x at v16, 0.14.x at v17. |
| ngcc removal (v16) | **No** | — | No View Engine libraries consumed; library is built with Ivy/APF. |
| `@angular/flex-layout` removal | **No** | — | Not used. |
| RxJS 6 → 7 interop shims | **No** | — | Already on rxjs 7.5.7. |
| Standalone / control-flow / `NgModule` migrations | **Optional, not required** | — | App is NgModule-based; opt-in, out of scope (§8). |
| Router / `HttpClient` / SSR / hydration changes | **No** | — | No router config, no HTTP, no SSR in either app (`@angular/router` is an unused dependency). |
| `application` builder / esbuild migration (v17) | **Optional** | `angular.json` | Apps use the `browser` builder; staying on it is valid, out of scope (§8). |
| v17 `NgSwitch` strict equality, style removal on destroy | **Check** | templates | Low-probability; verify in Phase 4 test run. |
| v18 `ComponentFixture.whenStable`/`autoDetect` semantics | **Check** | specs | May affect dialog spec timing in Phase 5. |
| Karma deprecation (v18) | **Partially** | `karma.conf.js` x3 | Karma still runs in 18 but is deprecated; the `clearContext: true` workaround must be preserved. |

### 2.2 What the guide has NO visibility into (the real work)

These are custom code built on framework internals. `ng update` schematics will not touch them, and
most fail **silently** (dead CSS, not compiler errors).

1. **Global Sass overrides targeting Material's internal legacy class names.** The `overrides()`
   mixin restyles `.mat-button-base`, `.mat-card`, `table.mat-table`/`th.mat-header-cell`/`tr.mat-row`,
   `.mat-form-field-appearance-outline .mat-form-field-outline`, `.mat-dialog-container`, and
   `.mat-calendar-body-selected`. Under MDC these become `mat-mdc-*` / `mdc-*` and the selectors
   quietly stop matching. The `!important` on `.mat-card`'s shadow will additionally fight MDC
   specificity.
2. **Test assertions hard-coded to legacy DOM.** Button spec asserts `mat-flat-button`; table spec
   asserts `th.mat-header-cell` and `tr.mat-row`; both app specs query `bofa-table tr.mat-row`. These
   fail **loudly** under MDC.
3. **The cross-project Sass-from-source import + `bofa-theme()` entry point.** Schematics operate on
   TS/HTML/known config, not a bespoke relative Sass path into another project.
4. **Build-order coupling.** The `dist/ui-components` alias means every library change must be rebuilt
   before apps see it; `ng update` assumes a normal single-project graph.
5. **The `clearContext: true` Karma workaround** and its documented rationale.

---

## 3. Migration scope: can the apps stay behind?

**No. All three projects must move together, in lockstep, per major version.** (Approved, §8.)
Justification, from the repo's own structure:

- There is a single root `package.json` with one set of Angular dependencies shared by all three
  projects — there is no per-project version pinning.
- The apps import the library's compiled output and its public types (`BofaDialogService`,
  `BofaTableColumn`) directly, so a version skew between library and app Angular runtimes is not
  supported.
- The apps pull the theme from library **source**, so any Sass/theming API change in the library is
  compiled by the app build immediately.

So "migrate the library" in this workspace unavoidably means "migrate the workspace." The library is
the leaf that everything depends on, which is why every step below is **lib-first, then apps**.

---

## 4. Phased execution plan

Ordering principle: **one major version per phase; within v15, split the framework bump from the MDC
migration.** The two failure modes are different (silent CSS vs. loud test failures); splitting gives a
fully-green legacy checkpoint so every MDC failure is unambiguously attributable. Material's `legacy-*`
entry points exist in v15 and v16 and are **removed in v17** (`angular/components` 17.0.x has no
`src/material/legacy-*`; the v17 `ng update` migration contains a `legacyImportsError` that refuses to
update a project still using legacy components — changelog "prevent updates to v17 if project uses
legacy components", #28024). **[verified against guide]**

The phase list is fixed as: (1) 14→15 framework-only, (2) MDC migration on v15, (3) 15→16, (4) 16→17,
(5) 17→18. Phase 4 must not be merged into or skipped past any neighbour; Phase 2 must be fully
complete before Phase 4 starts.

### 4.1 Confirmed toolchain ranges per phase

Source: https://angular.dev/reference/versions and the update guide's "node support" / "ts support"
steps. **[verified against guide]**

| Phase | Angular | Node.js | TypeScript | zone.js | rxjs |
|---|---|---|---|---|---|
| 0 — Baseline | 14.2.x | `^14.15.0 || ^16.10.0` (pinned 16.20.2) | `>=4.6.2 <4.9.0` (pinned 4.7.4) | 0.11.x | `^6.5.3 || ^7.4.0` |
| 1, 2 — v15 | 15.2.x | `^14.20.0 || ^16.13.0 || ^18.10.0` | `>=4.8.2 <5.0.0` (15.0.x only: `~4.8.2`) | 0.12.x | `^6.5.3 || ^7.4.0` |
| 3 — v16 | 16.2.x | `^16.14.0 || ^18.10.0` | `>=4.9.3 <5.2.0` (16.0.x: `<5.1.0`) | 0.13.x+ | `^6.5.3 || ^7.4.0` |
| 4 — v17 | 17.3.x | `^18.13.0 || ^20.9.0` | `>=5.2.0 <5.5.0` (17.0.x: `<5.3.0`; 17.1/17.2: `<5.4.0`) | 0.14.x+ | `^6.5.3 || ^7.4.0` |
| 5 — v18 | 18.2.x | `^18.19.1 || ^20.11.1 || ^22.0.0` | `>=5.4.0 <5.6.0` (18.0.x: `<5.5.0`) | 0.14.x+ | `^6.5.3 || ^7.4.0` |

Practical Node choice: stay on **16.20.2** for Phases 1–3 (it satisfies v15 and v16), switch to
**Node 20 LTS** (≥20.9.0 for v17, ≥20.11.1 for v18) at Phase 4 and update `.nvmrc` then. Only one
`.nvmrc` change is needed across the whole migration. The dev box currently has only Node 16.20.2 and
24.x installed via nvm — Node 20 must be installed (`nvm install 20`) before Phase 4.

### 4.2 Confirmed commands per phase

| Phase | Commands (run in workspace root) | Purpose |
|---|---|---|
| **0 — Baseline** | none | Branch, `npm ci`, green gate, `.d.ts` snapshot, screenshots |
| **1 — 14→15 (framework, legacy Material)** | `ng update @angular/core@15 @angular/cli@15` then `ng update @angular/material@15` | Green framework baseline, DOM unchanged. The Material v15 update schematic (`migration-v15`, `LegacyComponentsMigration`) **automatically** rewrites imports to `@angular/material/legacy-*` (e.g. `MatButtonModule` → `MatLegacyButtonModule as MatButtonModule` from `@angular/material/legacy-button`) and theme mixins to `mat.all-legacy-component-themes`. **[verified against guide]** |
| **2 — MDC migration (still v15)** | `ng generate @angular/material:mdc-migration` — options: `--directory` / `-d <workspace-relative path>` and `--components <list>` where the list is any of `all`, `autocomplete`, `button`, `card`, `checkbox`, `chips`, `dialog`, `form-field`, `input`, `list`, `menu`, `optgroup`, `option`, `paginator`, `progress-bar`, `progress-spinner`, `radio`, `select`, `slide-toggle`, `slider`, `snack-bar`, `table`, `tabs`, `tooltip`. Omit both to be prompted interactively. | Move off legacy DOM; then rewrite overrides + specs by hand. Search for `TODO(mdc-migration):` afterwards. The schematic ships in Material 15, 16 and 17 and is **removed in 18** — it must be run before Phase 5. **[verified against guide]** |
| **3 — 15→16** | `ng update @angular/core@16 @angular/cli@16` then `ng update @angular/material@16` | zone.js ≥0.13; ngcc removed (no impact). |
| **4 — 16→17** | `ng update @angular/core@17 @angular/cli@17` then `ng update @angular/material@17` | Legacy packages gone — `ng update` refuses if any `legacy-*` import remains. Runs `ThemeBaseMigration`. zone.js ≥0.14. Switch Node to 20 first. |
| **5 — 17→18** | `ng update @angular/core@18 @angular/cli@18` then `ng update @angular/material@18` | Final target. TS ≥5.4. |

The update guide lists the core/CLI update and the Material update as two separate steps for every
version; running them as two commands (core+cli first, then material) matches that and keeps the
Material migration output readable.

### Why this ordering over the alternatives

- **vs. "framework + MDC in one v15 step":** combining them stacks silent CSS regressions, red tests,
  and framework churn into a single commit across three coupled projects — no green baseline to diff
  against. Splitting converts one large ambiguous failure into two attributable ones.
- **vs. "jump straight to 18":** `ng update` only supports one-major-at-a-time; skipping versions skips
  their migration schematics (and the `mdc-migration` schematic no longer exists in 18).
- **vs. "apps first, library later":** impossible here — the dependency direction is apps→library, and
  the shared `package.json` forbids skew (§3).

### Per-phase mechanics (carry these into every phase)

1. `nvm use <node for this phase>`, install the matching TypeScript, update `package.json` pins.
2. Run the `ng update` command(s) for the phase.
3. Bump `libs/ui-components/package.json` `peerDependencies` to the new major (e.g. `^15.0.0`).
4. **Rebuild the library first** (`npm run build:lib`), then build apps — the `dist/` alias requires
   it. Restart any running dev server after a lib rebuild (ng-packagr wipes `dist/ui-components`).
5. Run the green gate (§6). Commit only when fully green (§7).
6. Update `MIGRATION_NOTES.md`.

### Phase-specific notes

- **Phase 1:** `ng update @angular/material@15` rewrites the library's Material imports to the
  `legacy-*` entry points and the theme to `all-legacy-component-themes` for you; review the diff in
  `ui-components.module.ts`, `confirm-dialog.component.ts`, `dialog.service.ts` and `_theme.scss`
  rather than hand-editing. Keep `_theme.scss` legacy selectors as-is. Update `_typography.scss` /
  `_palettes.scss` only as far as needed to compile on v15's Sass API (`define-legacy-typography-config`
  is the expected rename); record any required rename. `ng update @angular/core@15` normally bumps `typescript` to the 4.8
  range itself; if it does not, set it to `~4.8.4` explicitly before rebuilding, as 4.7.4 is below
  the v15 floor.
- **Phase 2 (MDC):** run the `mdc-migration` schematic (components needed here: `button`, `card`,
  `dialog`, `form-field`, `input`, `table`; datepicker is CDK/non-MDC and unaffected), then
  **manually** rewrite the `_theme.scss` selectors to the new `mat-mdc-*`/`mdc-*` DOM, and update the
  four specs' assertions (`mat-flat-button`, `mat-header-cell`, `mat-row`) to the MDC equivalents
  (`mat-mdc-unelevated-button`, `mat-mdc-header-cell`, `mat-mdc-row`). All MDC components gain
  themeable **density**; default density 0 is included by the theme mixins — density differences are
  reported for judgement, not auto-applied (§7). This is where the visual check (§6) is the real
  arbiter, not the build.
- **Phase 4:** legacy Material packages are removed in v17, so entering this phase requires Phase 2 to
  be fully complete; `grep -r "material/legacy-" libs apps` must return nothing, or stop. Install Node
  20 and update `.nvmrc` first.
- **Phase 5:** v18 test semantics change (`whenStable`, `autoDetect`, extra change-detection rounds)
  — dialog spec timing is the most likely casualty; fix by updating to the new truth, never by
  loosening.

---

## 5. Risk ranking by blast radius

| # | Risk | Blast radius | Detect | Contain | Caught by green build+tests? |
|---|---|---|---|---|---|
| 1 | **MDC DOM rename silently kills the `_theme.scss` overrides** — cards/table/form-field/dialog/calendar lose their BofA styling | All surfaces, both apps | Visual diff vs. baseline screenshots | Rewrite selectors to MDC DOM in Phase 2; keep overrides in one file | **No — silent.** Build passes, tests may pass, styling still broken |
| 2 | **MDC density/typography shifts change sizing & spacing** even after selectors are fixed | All Material components | Visual diff; measure control heights | Report differences for judgement; do not auto-apply density compat | **No — silent** |
| 3 | **Broken alignment between BofA elements and Material internals** (e.g. `.bofa-field` width vs. MDC form-field box model) | Forms, table cells | Visual diff on form fields & right-aligned cells | Restore alignment, note in MIGRATION_NOTES | **No — silent** |
| 4 | **Spec assertions on legacy classes fail** (`mat-flat-button`, `mat-header-cell`, `mat-row`) | 4 spec files | Test run (loud) | Update assertions to MDC truth with written rationale | **Yes — loud** |
| 5 | **Custom palette/contrast-map API breakage** in `define-palette`/theming across v15–v18 | Theme compile | Lib/app Sass build failure | Migrate to current theming API, preserve navy/red anchors & contrast | **Yes — loud** (compile error) |
| 6 | **Node/TS floor mismatch** at a phase boundary | Whole workspace | `ng`/`tsc` refuses to run | `nvm use` + TS bump before each phase (§4.1) | **Yes — loud** |
| 7 | **Build-order/`dist` staleness** — apps compile against stale library output | Both apps | "Cannot find module '@bofa/ui-components'" or stale types | Always `build:lib` before apps; rebuild after every lib change | **Yes — loud** |
| 8 | **Public API drift** in library `.d.ts` | Both apps + external consumers | `.d.ts` diff vs. `migration/baseline-dts/` | Fix exports; treat any diff as a regression unless approved | Partially — type-level, see §7 |
| 9 | **Legacy import left behind blocks v17** | Whole workspace | `ng update @angular/material@17` errors out | Complete Phase 2; grep for `material/legacy-` before Phase 4 | **Yes — loud** |

**Risks a green build + green tests would NOT catch: #1, #2, #3.** These are visual/layout regressions
in MDC's rendered output. This is exactly why the green gate (§6) must include the screenshot
comparison, and why MDC density differences are *reported for judgement*, not silently accepted.

---

## 6. Definition of "green" for this repo

A phase is green only when **all** of the following pass, **in this order**:

1. **Build, library first (mandatory ordering):**
   - `npm run build:lib` → then `npm run build:apps`. The `dist/ui-components` alias makes lib-first
     non-negotiable.
2. **All three test suites, headless, library first:**
   - `npm run test:all` — builds the lib, then runs `ui-components`, `retail-banking`, `wealth-portal`
     on `ChromeHeadless`. Must exit 0 with **no `ERROR` lines**. Preserve `clearContext: true` in every
     `karma.conf.js`. Baseline counts to hold: 5 / 3 / 2 specs.
3. **Public API check:** `.d.ts` diff of `dist/ui-components` against the Angular 14 baseline in
   `migration/baseline-dts/` — no unapproved changes (§7):
   `npm run build:lib && diff -r -x package.json -x README.md migration/baseline-dts dist/ui-components | grep -v '^Only in dist'`
   (empty output = unchanged).
4. **Visual check:** `npm run start:retail` (4200) and `npm run start:wealth` (4300), compare against
   the Phase 0 baseline screenshots in `migration/baseline-screenshots/` for the key surfaces:
   - **Cards** — `bofa-card` radius/border/shadow (retail summary + panel cards, wealth summary +
     holdings)
   - **Table** — `bofa-table` header styling (navy uppercase, 2px underline) and row hover
   - **Form fields** — `bofa-text-input` outline color + `bofa-datepicker` (retail payment form)
   - **Buttons** — pill shape, primary/secondary/ghost variants
   - **Open dialog** — trigger "Send payment" (retail) / "Request rebalance" (wealth) and compare
     `BofaConfirmDialogComponent` radius/padding/shadow

A phase is green **only when build + all three suites + `.d.ts` check + visual match all hold**.

---

## 7. Carried-forward constraints (bind these into the handoff)

- **Public API stability, verified per step.** After each phase, diff `dist/ui-components` `.d.ts`
  against `migration/baseline-dts/`. The surface to hold stable: `UiComponentsModule`,
  `BofaButtonComponent` + `BofaButtonVariant`, `BofaCardComponent`, `BofaDatepickerComponent`,
  `BofaConfirmDialogComponent` + `BofaConfirmDialogData`, `BofaDialogService`, `BofaTableComponent` +
  `BofaTableColumn`, `BofaTextInputComponent`. Verify against real consumption: apps import
  `BofaDialogService`/`BofaTableColumn` and template selectors `bofa-*`.
- **Tests updated to new truth, never weakened.** Where MDC changes the DOM, rewrite assertions (e.g.
  `mat-flat-button` → `mat-mdc-unelevated-button`) with a written explanation per change in
  `MIGRATION_NOTES.md`. Never delete, skip, or loosen an assertion; same checks, same counts.
- **One commit per green step.** Green = build + all suites + `.d.ts` check + visual match. MDC
  **density** differences are reported for judgement, not auto-fixed. Broken **alignment** between
  elements is a regression — restore and note it.
- **Library peer range bumped per phase.** `libs/ui-components/package.json` `peerDependencies` move
  from `^14.2.0` to the phase's major (`^15.0.0`, `^16.0.0`, `^17.0.0`, `^18.0.0`).
- **Branching discipline.** Work on a branch off `baseline-angular-14`; never push `main`; never move
  the tag.
- **`MIGRATION_NOTES.md` per step:** each breakage as symptom → cause → fix → evidence; **silent
  changes (CSS/layout) listed separately from loud ones (compile/test)**; record no-op fixes and any
  deviation from this plan.
- **Stop rule.** If a step can't reach green in a few attempts, stop and surface it — do not push
  through.

---

## 8. Assumptions & judgement calls (all approved)

1. **Reference guide fetched.** Node/TS ranges and schematic names in §4 are confirmed against the
   live guide and version table; drift from the earlier draft is listed in §9. Re-confirm at the start
   of Phase 1 if the guide has changed.
2. **All three projects move together, per major version** (§3). *Approved.*
3. **v15 split into two commits** (framework-on-legacy, then MDC). *Approved.*
4. **Stay on the `browser` builder; do not migrate to the esbuild `application` builder.** *Approved.*
5. **Stay on NgModules; skip standalone/control-flow migrations.** *Approved.*
6. **Keep Karma despite v18 deprecation;** preserve `clearContext: true`. *Approved.*
7. **Visual baseline is manual screenshot comparison** of the surfaces in §6, not an automated
   pixel-diff harness. *Approved.*
8. **`MatNativeDateModule` date adapter stays.** *Approved.*
9. **Library `peerDependencies` range bumped per phase.** Confirmed in Phase 0 that
   `libs/ui-components/package.json` exists with `^14.2.0` peers — no new manifest needed. *Approved.*
10. **`@angular/router` stays as an unused dependency;** pruning is out of scope. *Approved.*

### Known gaps (accepted)

- There are **no spec files** for `card`, `text-input`, or `datepicker` (only `button`, `table`,
  `dialog.service`, and the two app specs exist), so those components have no unit-test safety net —
  the visual check is the only guard for them.
- `plans/02-applications.md` (the puppeteer contingency referenced by the README) did not exist at the
  tag; it has been re-authored on this branch. Apply it only if a CI machine's Chrome is unavailable.

---

## 9. Drift found when verifying against the live guide

| Item | Earlier draft said | Guide says | Effect |
|---|---|---|---|
| v15 Node | 16.13+ / 18.10+ | `^14.20.0 || ^16.13.0 || ^18.10.0` | none (16.20.2 OK) |
| v15 TypeScript | 4.8–4.9 | `>=4.8.2 <5.0.0` (15.0.x: `~4.8.2`) | 4.9.x also acceptable on 15.1+ |
| v16 TypeScript | 4.9–5.1 | `>=4.9.3 <5.2.0` (16.0.x: `<5.1.0`) | 5.1.x acceptable on 16.1+ |
| v17 TypeScript | 5.2–5.4 | `>=5.2.0 <5.5.0` (17.0.x: `<5.3.0`) | 5.4.x acceptable on 17.3 |
| v18 Node | 18.19+ / 20.11+ | `^18.19.1 || ^20.11.1 || ^22.0.0` | patch floors are .1; Node 22 also allowed |
| v18 TypeScript | 5.4–5.5 | `>=5.4.0 <5.6.0` (18.0.x: `<5.5.0`) | 5.5.x acceptable on 18.1+ |
| Phase 1 Material command | `ng update @angular/material@15 --migrate-only=false` then hand-switch imports to `legacy-*` | `ng update @angular/material@15` — its migration rewrites imports to `legacy-*` automatically | drop the non-standard flag; review rather than hand-edit |
| MDC schematic | `ng generate @angular/material:mdc-migration` (unqualified) | same name; options `--directory`/`-d`, `--components`; present in 15/16/17, removed in 18 | must run before Phase 5 |
| Legacy removal | "removed in v17" | confirmed: no `legacy-*` in 17.0.x; v17 update refuses with legacy imports present | Phase 4 hard gate stands |
