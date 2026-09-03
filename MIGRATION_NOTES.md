# Migration notes — Angular 14 → 18

Workspace-wide migration (library + both consumer apps; see inspection report for why the
apps cannot stay on 14). One commit per green step. "Green" = `npm run build:lib`,
`ng test <project> --watch=false --browsers=ChromeHeadless` for all three projects with exact
spec counts (ui-components 5, retail-banking 3, wealth-portal 2) and no `ERROR` lines, then
`npm run build:apps` exit 0.

Visual evidence is gathered with a headless-Chrome probe (`probe.js`, kept outside the repo) that
records computed styles of the design-system elements on both served apps and diffs them against
the Angular 14 baseline served from a `baseline-angular-14` worktree.

## Baseline (Angular 14.2.12, Node 16.20.2)

```
npm run test:all  -> ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, exit 0
npm run build:apps -> retail-banking Initial Total 602.93 kB (over 500 kB *warning* budget, pre-existing)
                      wealth-portal  Initial Total 449.93 kB
```

Pre-existing observation (not a migration issue, recorded so it isn't misattributed later): the
`.mat-dialog-container` override in `_theme.scss` (16px radius / 28px padding) does **not** win on
the baseline — probe reports `border-radius: 4px; padding: 24px` on the open dialog in wealth-portal.
Material's dialog container styles are component styles injected after the global theme, so the
equal-specificity override loses. Only the `box-shadow` override takes effect.

---

## Step 1 — Angular 14 → 15 (Material on Legacy modules)

Node 16.20.2. Commands: `ng update @angular/core@15 @angular/cli@15`, then `ng update @angular/material@15`.
Resulting versions: core/common/… 15.2.10, cli/build-angular 15.2.11, cdk/material 15.2.9,
ng-packagr 15.2.2, typescript 4.9.5.

### Breakages

1. **Material v15 schematic missed `ui-components.module.ts`**
   - Symptom: after `ng update @angular/material@15`, `dialog.service.ts` / `confirm-dialog.component.ts`
     / the three specs were rewritten to `@angular/material/legacy-*` imports, but `ui-components.module.ts`
     still imported the (now MDC) `MatButtonModule`, `MatCardModule`, `MatDialogModule`, `MatFormFieldModule`,
     `MatInputModule`, `MatTableModule`. Mixed state: `BofaDialogService` injects `MatLegacyDialog`, which
     the MDC `MatDialogModule` does not provide → `NullInjectorError` for every consumer of `UiComponentsModule`
     (both app specs and both apps at bootstrap). Caught by reading the schematic's file list before running
     tests, not by a failing run.
   - Root cause: the schematic walks the TypeScript programs it can find for the project. The library's build
     tsconfig lives under `architect.build.configurations` (not `options`), so only `tsconfig.spec.json` was
     found; it reaches files transitively imported by specs (`dialog.service.ts` → `confirm-dialog.component.ts`)
     but nothing imports the NgModule from a spec.
   - Fix: hand-edited `ui-components.module.ts` to the same `MatLegacy*Module as Mat*Module` aliasing the
     schematic used elsewhere (`MatDatepickerModule` and `MatNativeDateModule` have no legacy variant and
     are unchanged).
   - Evidence: `npm run test:all` → 5/5, 3/3, 2/2, exit 0, no ERROR lines.

### Silent changes (compiled/passed, but different)

- None found. Probe diff Angular 14 baseline → step 1 on both apps: only `ng-tns-c<N>` scope attributes differ
  (component-index dependent, not visual). Button/card/table/form-field/dialog computed styles, DOM class
  names, card count (5 / 4) and row count (5 / 5) identical.
- Migrations that changed files without behaviour change: `.browserslistrc` deleted in both apps (matched CLI
  default), `require.context` block removed from all three `test.ts` (CLI 15 discovers specs itself),
  `tsconfig.json` `target: ES2022` + `useDefineForClassFields: false` (IDE-only per the migration note;
  the CLI already compiled with these).

### No-ops / superseded

- The Material schematic inserted a multi-line `TODO(v15)` comment plus `mat.all-legacy-component-typographies`
  + `mat.legacy-core()` into `bofa-theme()`. Kept the two includes (they are the correct v15 legacy form),
  removed the TODO block and fixed indentation. No behaviour change (probe identical).

### Did not break

TypeScript 4.9 under the workspace strict flags, ng-packagr 15 partial build, Karma/Jasmine spec discovery
(counts unchanged), reactive-forms CVA components, theme SCSS compile.

### Deviation from plan

None.

### Evidence

```
npm run test:all   -> TOTAL: 5 SUCCESS / 3 SUCCESS / 2 SUCCESS, EXIT=0
npm run build:apps -> retail-banking Initial Total 663.32 kB (warning budget, +60 kB vs 14: legacy + MDC
                      styles both shipped by Material 15), wealth-portal 480.62 kB, EXIT=0
```
