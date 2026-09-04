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
