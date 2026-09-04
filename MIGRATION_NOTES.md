# Angular 14 → 18 migration notes

Branch `devin/1788510387-angular-18-migration`, forked from tag `baseline-angular-14`.
One commit per green step. "Green" = the full gate, in this order, exit 0 and zero `ERROR`
lines in Karma output:

1. `ng build ui-components`
2. `ng test ui-components --watch=false --browsers=ChromeHeadless` (5 specs)
3. `ng build retail-banking`, `ng build wealth-portal`
4. `ng test retail-banking …` (3 specs), `ng test wealth-portal …` (2 specs)
5. `dist/ui-components/**/*.d.ts` diffed against the baseline build (public API check)
6. Visual probe of both built apps (screenshots + computed styles of themed elements + dialog)

Each step section below records: breakages (symptom → root cause → fix → evidence),
silent changes (compiled/passed but rendered or behaved differently), no-op or superseded
fixes, what did not break, and deviations from the plan.

## Step 0 — baseline (Angular 14.2.12, Node 16.20.2, TS 4.7.4)

Gate: GREEN. ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, 0 ERROR lines.
Bundles: retail-banking initial 602.93 kB (already over the 500 kB *warning* budget,
under the 1 MB error budget), wealth-portal 449.93 kB.

Visual baseline (1280px viewport, production builds) recorded for later comparison:
- `bofa-button`: `mat-flat-button mat-button-base`, radius 9999px, padding 0 22px,
  min-width 96px, height 36px, primary bg `rgb(1,33,105)`, 15px/600.
- `bofa-card`: `mat-card`, radius 12px, 1px `#e2e7f0` border, shadow
  `rgba(1,33,105,.07) 0 2px 10px`, padding 16px.
- `bofa-table th`: `mat-header-cell`, navy `rgb(1,33,105)`, 13px/600 uppercase,
  letter-spacing 0.52px, 2px navy bottom border, row height 54px, padding-left 24px.
- `bofa-text-input mat-form-field` (outline): 398 × 82.8px.
- Layout: `.summary-grid` 3 × 353px, `.panel-grid` 648px + 432px, gap 20px.
- Dialog (wealth-portal "Request rebalance"): `mat-dialog-container` 420px wide,
  radius 16px, padding 28px, pill buttons.

Breakages: none (baseline). Silent changes: none. Deviations: none.

## Step 1a/1b — Angular 15.x + Material 15 legacy

Landed versions:

| Package | Version |
|---|---:|
| `@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router` | `15.2.10` |
| `@angular/cdk`, `@angular/material` | `15.2.9` |
| `@angular-devkit/build-angular`, `@angular/cli` | `15.2.11` |
| `@angular/compiler-cli` | `15.2.10` |
| `ng-packagr` | `15.2.2` |
| `typescript` | `4.9.5` |
| `rxjs` | `7.5.7` |
| Node/npm | `16.20.2` / `8.19.4` |

Gate: GREEN. ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, 0
`ERROR` lines.

Breakages (symptom → root cause → fix → evidence):

- `Migration failed: ts.getDecorators is not a function` → the initial Material
  update ran the CDK 15 migration while TypeScript was still 4.7.4 → installed
  the complete Angular 15 dependency set with TypeScript 4.9.5, then ran the
  v15 migrations with `NG_DISABLE_VERSION_CHECK=true` → initial command output:

  ```text
  ** Executing migrations of package '@angular/cdk' **
  ▸ Updates the Angular CDK to v15.
  ✖ Migration failed: ts.getDecorators is not a function
  ```

  The successful retry reported `Angular CLI: 15.2.11`, `Angular: 15.2.10`,
  `@angular/cdk 15.2.9`, `@angular/material 15.2.9`, and `typescript 4.9.5`.

- `ENOENT: no such file or directory, open .../apps/retail-banking/src/polyfills.ts`
  (and the corresponding wealth-portal build/test failures) → the Angular CLI
  migration removed the polyfills files but left their entries in the four app
  tsconfig `files` arrays → removed those stale entries, changed all four
  `angular.json` polyfills entries to `["zone.js"]`, and deleted the obsolete
  files → evidence from the first gate attempt:

  ```text
  Error: ENOENT: no such file or directory, open
  '/home/ubuntu/repos/digital-banking-web/apps/retail-banking/src/polyfills.ts'
  GATE step1b-angular15-legacy: RED
  ```

- `NullInjectorError: No provider for MatLegacyDialog!` in all retail and wealth
  specs → the Material schematic rewrote `dialog.service.ts` to use
  `MatLegacyDialog`, but did not rewrite `UiComponentsModule` because the
  library build target points to `ng-package.json`, not a `tsConfig` in
  `angular.json` → completed the schematic's own import rewrite by hand in
  `libs/ui-components/src/lib/ui-components.module.ts`, using the exact
  `MatLegacy*Module as Mat*Module` mappings; datepicker/core imports were left
  unchanged because they have no legacy variants → evidence from the failing
  gate:

  ```text
  NullInjectorError: R3InjectorError(DynamicTestModule)
  [BofaDialogService -> MatLegacyDialog -> MatLegacyDialog]:
  NullInjectorError: No provider for MatLegacyDialog!
  TOTAL: 3 FAILED, 0 SUCCESS
  TOTAL: 2 FAILED, 0 SUCCESS
  ```

  The cause was verified in the v15 CDK migration implementation:
  `node_modules/@angular/cdk/schematics/ng-update/devkit-migration-rule.js`
  obtains only `project.targets?.get('build')?.options?.tsConfig` and the
  corresponding test target tsconfig, then skips projects with neither. The
  `ui-components` build target uses `ng-package.json`, so its library tsconfig
  is not walked by the schematic. The requested retry
  `npx ng update @angular/material --migrate-only --from=14 --to=15
  --allow-dirty` completed with `Migration completed (No changes made)`,
  confirming that the schematic did not subsequently discover the module.

The final gate output was:

```text
### build-lib: npx ng build ui-components
   exit=0
### test-ui-components: npx ng test ui-components --watch=false --browsers=ChromeHeadless
   exit=0
   TOTAL: 5 SUCCESS
   ERROR lines: 0
### build-retail-banking: npx ng build retail-banking
   exit=0
   | Initial Total | 663.13 kB |               136.43 kB
### build-wealth-portal: npx ng build wealth-portal
   exit=0
   | Initial Total | 480.42 kB |               106.76 kB
### test-retail-banking: npx ng test retail-banking --watch=false --browsers=ChromeHeadless
   exit=0
   TOTAL: 3 SUCCESS
   ERROR lines: 0
### test-wealth-portal: npx ng test wealth-portal --watch=false --browsers=ChromeHeadless
   exit=0
   TOTAL: 2 SUCCESS
   ERROR lines: 0
### .d.ts diff vs baseline: 66 lines (see dts.diff)
### GATE step1b-angular15-legacy: GREEN
```

The first successful application build, before completing the missed module
rewrite, reported retail-banking `701.73 kB` and wealth-portal `514.39 kB`.
After the module was switched fully to legacy imports, the final green build
reported `663.13 kB` and `480.42 kB`. Against the Angular 14 baseline
(`602.93 kB` and `449.93 kB`), the final increases are `+60.20 kB` and
`+30.49 kB`; the initial pre-module values were `+98.80 kB` and `+64.46 kB`.
The final styles row grew from `75.18 kB` (`7.87 kB` estimated transfer) to
`90.79 kB` (`9.00 kB` estimated transfer), or `+15.61 kB` raw and `+1.13 kB`
estimated transfer. The source theme contains only
`all-legacy-component-typographies`, `legacy-core`, and
`all-legacy-component-themes`; there is no duplicate MDC theme include.
The generated v15 stylesheet still contains shared `.mdc-*`/`.mat-mdc-*`
support selectors, but the size increase is not from explicitly including
both legacy and MDC component themes. The baseline and current build rows are
in `~/migration-evidence/step0-baseline/build-*.log` and
`~/migration-evidence/step1b-angular15-legacy/build-*.log`.

Visual probe:

```text
retail-banking: screenshot + styles written; dialog=false; consoleErrors=0
wealth-portal: screenshot + styles written; dialog=true; consoleErrors=0
```

The computed-style JSON comparison found only Angular-generated runtime class
suffix changes, with no computed style, geometry, color, typography, or box
differences:

- retail-banking:
  - `styles.bofa-datepicker mat-form-field[0].classes`: `ng-tns-c30-2` →
    `ng-tns-c18-2`
  - `styles.bofa-text-input input[0].classes`: `ng-tns-c30-0` →
    `ng-tns-c18-0`
  - `styles.bofa-text-input input[1].classes`: `ng-tns-c30-1` →
    `ng-tns-c18-1`
  - `styles.bofa-text-input mat-form-field[0].classes`: `ng-tns-c30-0` →
    `ng-tns-c18-0`
  - `styles.bofa-text-input mat-form-field[1].classes`: `ng-tns-c30-1` →
    `ng-tns-c18-1`
  - `styles.bofa-text-input mat-label, bofa-text-input .mdc-floating-label[0].classes`:
    `ng-tns-c30-0` → `ng-tns-c18-0`
  - `styles.bofa-text-input mat-label, bofa-text-input .mdc-floating-label[1].classes`:
    `ng-tns-c30-1` → `ng-tns-c18-1`
- wealth-portal:
  - `dialogStyles.classes`: `ng-tns-c12-0` → `ng-tns-c6-0`

The complete machine-readable diffs are
`~/migration-evidence/step1b-angular15-legacy/retail-banking-styles.diff.txt`
and `wealth-portal-styles.diff.txt`. The baseline/current PNG pairs were
eyeballed at 1280px and are visibly identical, including the dialog.

Silent changes: Angular-generated `ɵcmp` declaration signatures gained the
Angular 15 trailing `never` parameter; the d.ts diff is 66 lines. Runtime
style class suffixes also changed as listed above, with no visual effect.

No-op or superseded fixes: the first full Material update was superseded by
installing TypeScript 4.9.5 before rerunning migrations. The requested
migration-only retry then reported `Migration completed (No changes made)`
because the reachable application/test tsconfigs had already been migrated.
No MDC migration schematic was run.

What did not break: all five ui-components specs, all three retail-banking
specs, all two wealth-portal specs, both application builds, the public
declaration build, and the visual probe completed successfully. Karma
configuration retained `clearContext: true`. No application templates or
component behavior were changed.

Deviations: the initial Material command required a migration-only retry after
the TypeScript compatibility failure; `NG_DISABLE_VERSION_CHECK=true` was
needed to keep the local Angular CLI 15 binary instead of attempting a newer
CLI incompatible with Node 16. The library module import rewrite was manually
completed after verifying the schematic's tsconfig target selection, as
authorized for this step.

## Step 1c — Material 15 MDC migration

The official schematic was run against the Angular 15 workspace with Node
16.20.2 and npm 8.19.4. The exact requested command was attempted first:

```text
npx ng generate @angular/material:mdc-migration --components all --directory .
Schematic input does not validate against the Schema:
{"components":["all"],"directory":"."}
Errors:
  Data path "/directory" must match format "path".
```

An absolute directory was accepted but matched no workspace-relative source
paths:

```text
Limiting migration to: /home/ubuntu/repos/digital-banking-web
Successfully migrated the project.
Nothing to be done.
```

The official schematic was then run without the directory filter, which
processed the reachable application and test tsconfigs:

```text
npx ng generate @angular/material:mdc-migration --components all --interactive=false
```

The schematic touched exactly these seven files:

```text
libs/ui-components/src/styles/_theme.scss
libs/ui-components/src/styles/_typography.scss
libs/ui-components/src/lib/dialog/confirm-dialog.component.ts
libs/ui-components/src/lib/button/button.component.spec.ts
libs/ui-components/src/lib/table/table.component.spec.ts
libs/ui-components/src/lib/dialog/dialog.service.ts
libs/ui-components/src/lib/dialog/dialog.service.spec.ts
```

It left exactly one migration TODO:

```text
libs/ui-components/src/styles/_theme.scss:36:
/* TODO(mdc-migration): The following rule targets internal classes of form-field that may no longer apply for the MDC version.*/
```

The TODO was removed after replacing the legacy form-field-outline selector
with resting MDC notched-outline selectors. The schematic did not rewrite
`libs/ui-components/src/lib/ui-components.module.ts`, because this library's
build target points to `ng-package.json` rather than a top-level `tsConfig`.
The migration rule walks build/test target tsconfigs, so it does not reach the
library module through that target. The module was completed manually with the
matching `Mat*Module` imports; datepicker and native-date imports remained
unchanged because they have no legacy variants.

Breakages (symptom → root cause → fix → evidence):

- Before assertion updates, the first gate intentionally failed only at the
  four authorized old DOM selectors. ui-components was `2 FAILED, 3 SUCCESS`
  (`mat-flat-button`, `th.mat-header-cell`, and `tr.mat-row` selectors);
  retail-banking was `1 FAILED, 2 SUCCESS`; wealth-portal was `1 FAILED,
  1 SUCCESS`; all had zero Karma `ERROR` lines. The captured logs are
  `~/migration-evidence/step1c-mdc/test-ui-components.log`,
  `test-retail-banking.log`, and `test-wealth-portal.log`. The selectors were
  changed only as follows: `mat-flat-button` →
  `mat-mdc-unelevated-button`, `th.mat-header-cell` →
  `th.mat-mdc-header-cell`, `tr.mat-row` → `tr.mat-mdc-row`, and
  `bofa-table tr.mat-row` → `bofa-table tr.mat-mdc-row`. Counts and test
  intent were unchanged; these are framework-rendered class renames.

- The first visual probe showed the MDC secondary and dialog ghost buttons
  rendered with Material's default light background/color rather than the
  design-system transparent/navy treatment. The component selectors were
  raised to `.mat-mdc-unelevated-button.bofa-button--secondary` and the
  equivalent ghost selector. The final probe reports transparent backgrounds
  and `rgb(1, 33, 105)` text for both.

- The first visual probe showed MDC density shifts: summary cards were
  `115px` rather than `126px`, panels began at `310px` rather than `321px`,
  MDC table rows were `52px` rather than `48px`, and outline fields were
  `78px` rather than approximately `82.8px`. These differences are reported
  below rather than hidden with pixel-matching overrides. The final probe
  confirms that the summary cards remain equal-height and lined up, both
  panel-grid columns start at the same top, form fields remain the same width
  as their containing card, and no element-to-element alignment regression
  requires a compatibility fix.

- MDC dialogs move padding into title/content/actions and the surface no
  longer inherits the legacy container styling. The retained surface override
  targets `.mat-mdc-dialog-container.mdc-dialog .mdc-dialog__surface` and
  preserves the requested 16px radius and navy shadow. MDC's default internal
  padding is reported below; no title/content/action padding compatibility
  fix was retained. The final dialog remains 420 × 178px, and its buttons are
  aligned with each other without an element-alignment regression.

Silent changes:

- Typography was ported exactly to the requested MDC names and values:
  `headline-5` 28/36/700, `headline-6` 20/28/600, `subtitle-1` 16/24/600,
  `body-1` 15/24/400, and `button` 15/16/600, with the existing Public Sans
  family. The theme now uses `mat.core()`, `density: 0`, and
  `mat.all-component-themes($theme)`.
- MDC density differences, compared with the Angular 14 baseline, are:
  - summary cards: `126px` high → `115px`; all three remain equal-height and
    aligned with one another;
  - card surface computed `padding-top`: `16px` → `0px`; MDC places internal
    spacing in its header/content structure;
  - card titles: `24px` line box → `28px`, with MDC theme color
    `rgba(0, 0, 0, 0.87)` → `rgb(28, 37, 64)`;
  - card subtitles: `15px × 17px` → `14px × 22px`;
  - table header cells: `54px` → `56px`, default horizontal inset `24px` on
    the first column/`0px` elsewhere → `16px`;
  - table body cells: `47px` → `52px`, `15px` → `14px`, and default horizontal
    inset `24px` on the first column/`0px` elsewhere → `16px`;
  - retail table column boxes change from `157/310/147px` to
    `152/319/143px`; wealth columns change from `503/182/130/150px` to
    `443/213/164/146px`. These are MDC table-layout/font-density effects,
    not hard-coded app column widths;
  - outline fields: `398 × 82.7812px` → `398 × 78px`; input elements
    `16.875px` high → `24px` high, with MDC's floating-label implementation;
  - dialog surface: baseline measured radius/shadow `16px` /
    `0 12px 40px rgba(1,33,105,.25)` → the visual probe's outer MDC container
    reports `0px`/`none` because the probe selects the container rather than
    the styled surface. The actual surface retains the requested 16px radius
    and shadow; container padding reports `28px` → `0px` because MDC moves
    spacing into internal title/content/actions.
  These are density, typography, padding, and internal-rendering changes that
  are intentionally exposed for review. The final JSON diffs are:
  `~/migration-evidence/step1c-mdc/retail-banking-styles.diff.txt` and
  `wealth-portal-styles.diff.txt`.
- Preserved values include summary/panel grid widths and gaps, equal card
  alignment, panel top alignment, form-field/card width relationship, button
  dimensions (MDC default height remains `36px`), table header color/weight/
  uppercase/letter-spacing/border, resting outline color
  `rgb(170, 182, 207)`, transparent/navy secondary and ghost buttons, and
  dialog button alignment.
- The final visual probe completed with zero console errors:

  ```text
  retail-banking: screenshot + styles written; dialog=false; consoleErrors=0
  wealth-portal: screenshot + styles written; dialog=true; consoleErrors=0
  ```

  Final screenshots:
  `~/migration-evidence/step1c-mdc/retail-banking.png`,
  `wealth-portal.png`, and `wealth-portal-dialog.png`. Baseline screenshots
  are `~/migration-evidence/step0-baseline/retail-banking.png`,
  `wealth-portal.png`, and `wealth-portal-dialog.png`. Baseline/current PNGs
  were inspected at 1280px. The expected MDC density changes are visible,
  but summary cards remain equal-height, panel tops align, form fields fit
  their cards, and dialog buttons remain aligned. No minimal alignment fix was
  necessary.

No-op or superseded fixes: the rejected `--directory .` invocation and the
absolute-directory no-op were superseded by the official whole-workspace
invocation without `--directory`. The schematic-generated `$body-2` was
corrected to the explicitly required `$body-1`. The initial lower-specificity
button override was superseded by selectors specific enough to win against
MDC defaults. The prior pixel-matching geometry experiment was superseded and
removed: it added app-specific `.mat-column-*` widths to the shared library
theme and hard-coded card, table, form-field, and dialog spacing. Those rules
masked the MDC density changes the user requested to review, so they were
removed. Only the requested selector ports, design-system colors/borders/
shadows, resting outline color, button treatment, and dialog surface treatment
remain. No budget change was made: retail-banking remained below the 1 MB
`maximumError`.

What did not break: all five ui-components specs, all three retail-banking
specs, all two wealth-portal specs, both application builds, the public
declaration build, and the visual probe completed successfully. No component
template or public API behavior changed. The only spec changes were the
authorized framework-rendered DOM class assertions. No `ERROR` lines appeared
in any final Karma log.

Final gate and artifacts:

```text
ui-components: 5 SUCCESS, 0 ERROR lines
retail-banking build: exit=0, Initial Total 713.34 kB
wealth-portal build: exit=0, Initial Total 525.40 kB
retail-banking: 3 SUCCESS, 0 ERROR lines
wealth-portal: 2 SUCCESS, 0 ERROR lines
.d.ts diff vs baseline: 34 lines
GATE step1c-mdc: GREEN
```

The final build logs report styles at `106.39 kB` raw and `9.53 kB`
estimated transfer for both applications. The 500 kB warning budget remains
exceeded, but the 1 MB maximum-error budget does not, so no separate budget
commit is required.

## Step 2 — Angular 16

Landed versions:

| Package | Version |
|---|---:|
| `@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router` | `16.2.12` |
| `@angular/cdk`, `@angular/material` | `16.2.14` |
| `@angular-devkit/build-angular`, `@angular/cli` | `16.2.16` |
| `@angular/compiler-cli` | `16.2.12` |
| `ng-packagr` | `16.2.3` |
| `typescript` | `4.9.5` |
| `rxjs` | `7.5.7` |
| `zone.js` | `0.13.3` |
| Node/npm | `16.20.2` / `8.19.4` |

Breakages: none.

The first Material update invocation was rejected because the preceding core/
CLI update left package.json and package-lock.json dirty:

```text
Error: Repository is not clean. Please commit or stash any changes before updating.
```

The Material update was then run with `--allow-dirty`; it completed successfully
and ran the v16 CDK and Material migrations without source changes:

```text
** Executing migrations of package '@angular/cdk' **
Migration completed (No changes made).
** Executing migrations of package '@angular/material' **
Migration completed (No changes made).
```

The core/CLI migration names and results were:

- Remove `defaultProject` option: no changes made.
- Replace `defaultCollection` with `schematicCollections`: no changes made.
- Disable `buildOptimizer` for non-optimized server builds: no changes made.
- Remove deprecated guard/resolver interface imports and `implements` clauses:
  no changes made.
- Remove deprecated `moduleId` component metadata: no changes made.

Silent changes:

- The Angular 16 dependency set changed the application bundles from the Step
  1c totals of `713.34 kB` / `525.40 kB` to `705.17 kB` /
  `495.24 kB` for retail-banking / wealth-portal.
- The styles bundle is `81.50 kB` raw and `7.92 kB` estimated transfer for
  both applications.
- The visual probe found no style, box, typography, spacing, color, or layout
  changes. Retail-only computed-style differences were Angular-generated
  `ng-tns-c6-*` scope suffixes changing to `ng-tns-c1205077789-*`; the
  wealth-portal JSON had no differences. These are framework scope-class
  renames, not rendered-style changes.

No-op or superseded fixes: no Angular source, template, Sass, test assertion,
standalone, signals, control-flow, or application-builder migration was
needed. The existing `browser` and `karma` builders remain in angular.json.
The ui-components peerDependencies were updated from `^15.2.0` to `^16.2.0`
for the five Angular packages.

What did not break: all five ui-components specs, all three retail-banking
specs, all two wealth-portal specs, both application builds, the public
declaration build, and the visual probe completed successfully. No Karma
`ERROR` lines were emitted. The 1 MB maximum-error bundle budget remained
unexceeded, so no separate budget commit was required.

Final gate and artifacts:

```text
ui-components: 5 SUCCESS, 0 ERROR lines
retail-banking build: exit=0, Initial Total 705.17 kB
wealth-portal build: exit=0, Initial Total 495.24 kB
retail-banking: 3 SUCCESS, 0 ERROR lines
wealth-portal: 2 SUCCESS, 0 ERROR lines
.d.ts diff vs baseline: 34 lines
GATE step2-angular16: GREEN
```

Visual probe:

```text
retail-banking: screenshot + styles written; dialog=false; consoleErrors=0
wealth-portal: screenshot + styles written; dialog=true; consoleErrors=0
```

Evidence: `~/migration-evidence/step2-angular16/`, including
`retail-banking-styles.json`, `wealth-portal-styles.json`,
`versions.txt`, and the build/test logs.

Deviation: `@angular/material@16` required `--allow-dirty` because the
preceding required core/CLI update had already modified the dependency files.

## Step 3 — Node 20.18.1 + Angular 17

Landed versions:

| Package | Version |
|---|---:|
| `@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router` | `17.3.12` |
| `@angular/cdk`, `@angular/material` | `17.3.10` |
| `@angular-devkit/build-angular`, `@angular/cli` | `17.3.17` |
| `@angular/compiler-cli` | `17.3.12` |
| `ng-packagr` | `17.3.0` |
| `typescript` | `5.4.5` |
| `rxjs` | `7.5.7` |
| `zone.js` | `0.14.10` |
| Node/npm | `20.18.1` / `10.8.2` |

Breakages: none.

Node `20.18.1` was not initially installed in nvm, so it was installed from
the official Node distribution and selected successfully. `.nvmrc` was changed
from `16.20.2` to `20.18.1`, and the README toolchain requirement was updated.
The required normal `npm install` under Node 20 completed successfully:

```text
up to date in 7m
139 packages are looking for funding
```

No lockfile regeneration was needed. The Angular update commands used
`--allow-dirty` because `.nvmrc` and README had intentionally been updated
before the dependency migration.

Migration names and results:

- Replace usages of `@nguniversal/builders` with
  `@angular-devkit/build-angular`: no changes made.
- Replace usages of `@nguniversal/` packages with `@angular/ssr`: no changes
  made.
- Replace deprecated `browserTarget` options with `buildTarget`: updated the
  dev-server and extract-i18n configurations in `angular.json`.
- Add `browser-sync` for SSR dev server: no changes made.
- Angular v17 control-flow character entity migration: no changes made.
- Move `TransferState`, `makeStateKey`, and `StateKey` imports: no changes
  made.
- Remove unused Ivy `CompilerOption` settings: no changes made.
- Update invalid two-way binding expressions: no changes made.
- Angular CDK v17 migration: no changes made.
- Angular Material v17 migration: no changes made.

No application-builder, standalone, or control-flow source conversion was
accepted. The existing `@angular-devkit/build-angular:browser`,
`@angular-devkit/build-angular:karma`, and library ng-packagr builders remain.

Silent changes:

- Application bundles changed from Step 2 totals of `705.17 kB` /
  `495.24 kB` to `728.17 kB` / `595.05 kB` for retail-banking /
  wealth-portal.
- The styles bundle is `86.16 kB` raw and `7.90 kB` estimated transfer for
  both applications.
- The retail visual JSON differs only in Angular-generated form-field scope
  classes: `ng-tns-c1205077789-*` → `ng-tns-c3736059725-*`.
- The wealth visual JSON has one class-only difference: the dialog container
  gains `mat-mdc-dialog-container-with-actions`. No computed style, box,
  typography, spacing, color, or layout values changed.

No-op or superseded fixes: no component, template, Sass, public API, or test
assertion changes were needed. The ui-components peerDependencies were updated
from `^16.2.0` to `^17.2.0` for the five Angular packages. No budget change
was made because both applications remained below the 1 MB maximum-error
budget.

What did not break: all five ui-components specs, all three retail-banking
specs, all two wealth-portal specs, both application builds, the public
declaration build, and the visual probe completed successfully. Node 20 was
used by the gate, and no Karma `ERROR` lines were emitted.

Final gate and artifacts:

```text
node v20.18.1 npm 10.8.2
ui-components: 5 SUCCESS, 0 ERROR lines
retail-banking build: exit=0, Initial Total 728.17 kB
wealth-portal build: exit=0, Initial Total 595.05 kB
retail-banking: 3 SUCCESS, 0 ERROR lines
wealth-portal: 2 SUCCESS, 0 ERROR lines
.d.ts diff vs baseline: 34 lines
GATE step3-angular17: GREEN
```

Visual probe:

```text
retail-banking: screenshot + styles written; dialog=false; consoleErrors=0
wealth-portal: screenshot + styles written; dialog=true; consoleErrors=0
```

Evidence: `~/migration-evidence/step3-angular17/`, including
`retail-banking-styles.json`, `wealth-portal-styles.json`,
`versions.txt`, and the build/test logs.

## Step 4 — Angular 18

Landed versions:

| Package | Version |
|---|---:|
| `@angular/animations`, `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/router` | `18.2.14` |
| `@angular/cdk`, `@angular/material` | `18.2.14` |
| `@angular-devkit/build-angular`, `@angular/cli` | `18.2.21` |
| `@angular/compiler-cli` | `18.2.14` |
| `ng-packagr` | `18.2.1` |
| `typescript` | `5.4.5` |
| `rxjs` | `7.5.7` |
| `zone.js` | `0.14.10` |
| Node/npm | `20.18.1` / `10.8.2` |

Breakages: none.

The core/CLI update offered the optional application-builder migration:

```text
❯ Migrate application projects to the new build system.
  ng update @angular/cli --name use-application-builder
```

It was not run. The existing browser, karma, and ng-packagr builders remain
in angular.json. The core migrations for invalid two-way bindings, deprecated
HTTP modules, afterRender phases, and server BootstrapContext all completed
with no changes.

The first Material update invocation was rejected because the core/CLI update
had already modified package files:

```text
Error: Repository is not clean. Please commit or stash any changes before updating.
```

It was rerun with `--allow-dirty` and completed successfully. CDK v18 made no
source changes. The Material v18 migration renamed the M2 Sass APIs in exactly
three files:

| Before | After |
|---|---|
| `mat.define-light-theme` | `mat.m2-define-light-theme` |
| `mat.define-palette` | `mat.m2-define-palette` |
| `mat.$red-palette` | `mat.$m2-red-palette` |
| `mat.define-typography-config` | `mat.m2-define-typography-config` |
| `mat.define-typography-level` | `mat.m2-define-typography-level` |

The affected files were `_theme.scss`, `_palettes.scss`, and
`_typography.scss`. A search found no remaining deprecated unprefixed M2
Material Sass API names, and the builds emitted no Material deprecation
warnings.

Silent changes:

- Application bundles changed from Step 3 totals of `728.17 kB` /
  `595.05 kB` to `734.07 kB` / `614.49 kB` for retail-banking /
  wealth-portal.
- The styles bundle is `91.02 kB` raw and `8.11 kB` estimated transfer for
  both applications.
- The retail visual JSON differs only in Angular-generated form-field scope
  classes: `ng-tns-c3736059725-*` → `ng-tns-c508571215-*`. The wealth-portal
  JSON has no differences.
- No computed style, box, typography, spacing, color, or layout values
  changed between Step 3 and Step 4. Therefore no density or
  element-alignment regression was found.

No-op or superseded fixes: the optional application-builder migration was
declined to preserve the requested builders. No standalone, signals, or
control-flow conversion was performed. The ui-components peerDependencies
were updated from `^17.2.0` to `^18.2.0` for the five Angular packages. No
budget change was made because both applications remained below the 1 MB
maximum-error budget.

What did not break: all five ui-components specs, all three retail-banking
specs, all two wealth-portal specs, both application builds, the public
declaration build, and the visual probe completed successfully. Node 20 was
used by the gate, and no Karma `ERROR` lines were emitted.

Final gate and artifacts:

```text
node v20.18.1 npm 10.8.2
ui-components: 5 SUCCESS, 0 ERROR lines
retail-banking build: exit=0, Initial Total 734.07 kB
wealth-portal build: exit=0, Initial Total 614.49 kB
retail-banking: 3 SUCCESS, 0 ERROR lines
wealth-portal: 2 SUCCESS, 0 ERROR lines
.d.ts diff vs baseline: 34 lines
GATE step4-angular18: GREEN
```

Visual probe:

```text
retail-banking: screenshot + styles written; dialog=false; consoleErrors=0
wealth-portal: screenshot + styles written; dialog=true; consoleErrors=0
```

Evidence: `~/migration-evidence/step4-angular18/`, including
`retail-banking-styles.json`, `wealth-portal-styles.json`,
`versions.txt`, the update logs, and the build/test logs.

## Final state

The final toolchain is Angular 18 with exact root package pins. The baseline
and final direct dependency versions are:

| Dependency | Baseline | Final |
|---|---:|---:|
| `@angular/animations` | `14.2.12` | `18.2.14` |
| `@angular/cdk` | `14.2.7` | `18.2.14` |
| `@angular/common` | `14.2.12` | `18.2.14` |
| `@angular/compiler` | `14.2.12` | `18.2.14` |
| `@angular/core` | `14.2.12` | `18.2.14` |
| `@angular/forms` | `14.2.12` | `18.2.14` |
| `@angular/material` | `14.2.7` | `18.2.14` |
| `@angular/platform-browser` | `14.2.12` | `18.2.14` |
| `@angular/platform-browser-dynamic` | `14.2.12` | `18.2.14` |
| `@angular/router` | `14.2.12` | `18.2.14` |
| `@angular-devkit/build-angular` | `14.2.13` | `18.2.21` |
| `@angular/cli` | `14.2.13` | `18.2.21` |
| `@angular/compiler-cli` | `14.2.12` | `18.2.14` |
| `ng-packagr` | `14.2.2` | `18.2.1` |
| `typescript` | `4.7.4` | `5.4.5` |
| `zone.js` | `0.11.8` | `0.14.10` |
| `@types/node` | `16.18.126` | `20.17.58` |
| `rxjs` | `7.5.7` | `7.5.7` |
| `tslib` | `2.4.1` | `2.4.1` |
| `@types/jasmine` | `~4.0.0` | `~4.0.0` |
| `jasmine-core` | `~4.3.0` | `~4.3.0` |
| `karma` | `~6.4.0` | `~6.4.0` |
| `karma-chrome-launcher` | `~3.1.0` | `~3.1.0` |
| `karma-coverage` | `~2.2.0` | `~2.2.0` |
| `karma-jasmine` | `~5.1.0` | `~5.1.0` |
| `karma-jasmine-html-reporter` | `~2.0.0` | `~2.0.0` |

The ui-components peerDependencies are `^18.2.0` for
`@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, and
`@angular/material`; `rxjs` remains `^7.5.0`.

Per-step application bundle totals:

| Step | retail-banking initial | wealth-portal initial |
|---|---:|---:|
| Step 0 — Angular 14 baseline | 602.93 kB | 449.93 kB |
| Step 1 — Angular 15 legacy | 663.13 kB | 480.42 kB |
| Step 1c — Material 15 MDC | 713.34 kB | 525.40 kB |
| Step 2 — Angular 16 | 705.17 kB | 495.24 kB |
| Step 3 — Angular 17 | 728.17 kB | 595.05 kB |
| Step 4 — Angular 18 | 734.07 kB | 614.49 kB |

Public API verdict: the only `.d.ts` differences are Angular's internal
`ɵcmp` metadata shape and `export declare type` → `export type`. All exported
symbols, inputs, and `confirm(data): Observable<boolean>` are unchanged.

Four spec files had assertion changes, all in Step 1c, and all preserved the
same test counts and intent:

- `libs/ui-components/src/lib/button/button.component.spec.ts`:
  `mat-flat-button` → `mat-mdc-unelevated-button`.
- `libs/ui-components/src/lib/table/table.component.spec.ts`:
  `th.mat-header-cell` / `tr.mat-row` → their `mat-mdc-*` equivalents.
- `apps/retail-banking/src/app/app.component.spec.ts`:
  `bofa-table tr.mat-row` → `bofa-table tr.mat-mdc-row`.
- `apps/wealth-portal/src/app/app.component.spec.ts`:
  `bofa-table tr.mat-row` → `bofa-table tr.mat-mdc-row`.

Deliberately not modernised: the workspace remains NgModule-based; standalone
components, signals, the v17 control-flow syntax, the Angular application
builder, and unrelated public API changes were not introduced. Legacy
pixel-matching geometry overrides were not restored after the MDC migration;
MDC density differences remain documented for review. Tests were not deleted
or weakened.

How to run:

```text
nvm use && npm ci && npm run test:all
```

Final pinning verification: all root dependency and devDependency entries are
exact pins except the pre-existing `~` ranges on Jasmine, Karma, and related
test packages. `@types/node` was updated from `16.18.126` to the exact
compatible `20.17.58`. `npm install` updated the lockfile, and
`npm ls --depth=0` exited 0 with no peer errors.

Final gate:

```text
ui-components: 5 SUCCESS, 0 ERROR lines
retail-banking: 3 SUCCESS, 0 ERROR lines
wealth-portal: 2 SUCCESS, 0 ERROR lines
.d.ts diff vs baseline: 34 lines
GATE step5-final: GREEN
```

The exact `npm run build:all` and `npm run test:all` scripts also exited 0;
their complete logs are `~/migration-evidence/step5-final/build-all.log` and
`~/migration-evidence/step5-final/test-all.log`. The final visual probe had
zero console errors and its Step 5 JSON is identical to Step 4 for both apps.
