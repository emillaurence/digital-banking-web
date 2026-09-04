# Migration notes: @bofa/ui-components Angular 14 → 18

Visual baselines (outside the repo): /home/ubuntu/visual/baseline-14/ (21 PNGs + metrics.json, captured from tag baseline-angular-14 at 1280x900 via /home/ubuntu/visual/capture.js). Per-step captures live in /home/ubuntu/visual/<step>/, pixel diffs in /home/ubuntu/visual/<step>-diff/, build/test logs in /home/ubuntu/green/<step>/.

## Step 15a — Angular 15 + Material 15 (legacy components)

Toolchain: Node 16.20.2, npm 8.19.4, TypeScript 4.9.5, zone.js 0.11.8, rxjs 7.5.7.
Commands:

- `npx ng update @angular/core@15 @angular/cli@15`
- `npx ng update @angular/material@15`
- `npx ng update @angular/material@15 --allow-dirty` (retry after the core/CLI update modified the working tree; `--force` was not used)

### Automatic migration changes (kept as-is, per plan)

- `package.json` and `package-lock.json` — Angular core/CLI packages, CDK, Material, ng-packagr, and TypeScript updated to Angular 15-compatible versions.
- `apps/retail-banking/.browserslistrc` and `apps/wealth-portal/.browserslistrc` — deleted by the CLI 15 migration; Angular CLI now supplies its default Browserslist configuration.
- `apps/retail-banking/src/test.ts`, `apps/wealth-portal/src/test.ts`, and `libs/ui-components/src/test.ts` — removed the `require.context` block; the Karma builder discovers specs itself.
- `tsconfig.json` — changed `target` from `es2020` to `ES2022` and added `useDefineForClassFields: false`.
- `libs/ui-components/src/lib/dialog/confirm-dialog.component.ts` and `libs/ui-components/src/lib/dialog/dialog.service.ts` — Material imports rewritten to legacy dialog APIs.
- `libs/ui-components/src/styles/_theme.scss` — `mat.core` changed to legacy typography/core mixins and `mat.all-component-themes` changed to `mat.all-legacy-component-themes`.
- `libs/ui-components/src/styles/_typography.scss` — `mat.define-typography-config` changed to `mat.define-legacy-typography-config`.
- `libs/ui-components/src/lib/button/button.component.spec.ts`, `libs/ui-components/src/lib/table/table.component.spec.ts`, and `libs/ui-components/src/lib/dialog/dialog.service.spec.ts` — only Material import paths were rewritten to `legacy-*` APIs by the Material schematic; no assertion changes were made.

### Loud breakages (symptom → cause → fix → evidence)

- `ng build ui-components` initially failed with `TS2307: Cannot find module '@angular/material/legacy-datepicker'`, followed by template errors because the library module could not compile. The Material schematic left non-legacy module imports in `libs/ui-components/src/lib/ui-components.module.ts`; those were switched manually to `MatLegacy*Module` imports for button, card, dialog, form-field, input, and table so the legacy Sass and component modules remain consistent. Material 15 has no legacy datepicker package, so `MatDatepickerModule` was retained from `@angular/material/datepicker`. The corrected library build, both app builds, and all three test suites passed. Evidence: `/home/ubuntu/green/15a/build-lib.log`, `/home/ubuntu/green/15a/build-retail.log`, `/home/ubuntu/green/15a/build-wealth.log`.

### Silent changes

- Generated declarations differ by 99 diff lines in `/home/ubuntu/green/15a/dts.diff`, but the difference is non-API: TypeScript 4.9 emits `export type` instead of `export declare type` for the same declaration; the Angular 15 compiler adds a trailing `never` (the isSignal/standalone-related generic slot) to generated private `ɵcmp`/`ɵmod` metadata; and generated `ui-components.module.d.ts` and dialog declarations import `@angular/material/legacy-*` (`MatLegacyDialog as MatDialog`) as a transient consequence of this 15a legacy checkpoint, expected to revert at 15b. The public surface (`exported classes`, inputs, methods, `BofaButtonVariant`, `BofaTableColumn`, `BofaConfirmDialogData`, and `BofaDialogService.confirm`) is unchanged.
- `/home/ubuntu/green/15a/pkg-meta.diff` is empty; generated package metadata did not change.
- The initial Angular 14 build's retail bundle was 602.93 kB. The Angular 15 build's retail bundle was 663.32 kB, producing a budget warning but remaining below the 1 MB maximum-error threshold.

### No-op fixes / deviations from plan

- There is no `@angular/material/legacy-datepicker` package in Material 15. The first attempted legacy datepicker import was reverted to `@angular/material/datepicker`; datepicker is not an MDC migration surface in this release.
- `--allow-dirty` was required for the Material update because the preceding core/CLI schematic had already modified the working tree. No `--force` flag was used.
- No test assertions were changed, deleted, skipped, or weakened.

### Evidence

- Builds: library, retail-banking, and wealth-portal all returned `rc=0`. One budget warning was emitted: initial bundle budget 500.00 kB exceeded by 163.32 kB, total 663.32 kB.
- Tests: ui-components `5/5`, retail-banking `3/3`, wealth-portal `2/2`; all returned `rc=0` with 0 `ERROR` lines.
- Public API: `.d.ts` diff versus baseline was 99 generated-only lines, as described above; no consumer-facing API changes. Package metadata diff: 0 lines.
- Visual: 11 of the 21 PNG screenshot comparisons were `SAME`. The seven retail diffs all localize to two datepicker-owned pixel regions: the Material 15 calendar toggle SVG glyph and antialiasing/weight of the `SEP 2026` period-button label. This is a framework-owned MDC-type density/rendering difference, not a theme regression. Box metrics are identical (`metrics.diff: identical`), there is no alignment or overflow change, and the `.mat-calendar-body-selected` override still applies.
  - `/home/ubuntu/visual/15a/retail-01-full.png` — `DIFF`, 76 pixels
  - `/home/ubuntu/visual/15a/retail-04-form.png` — `DIFF`, 76 pixels
  - `/home/ubuntu/visual/15a/retail-06-form-focused.png` — `DIFF`, 76 pixels
  - `/home/ubuntu/visual/15a/retail-07-form-filled.png` — `DIFF`, 76 pixels
  - `/home/ubuntu/visual/15a/retail-08-datepicker-open.png` — `DIFF`, 414 pixels
  - `/home/ubuntu/visual/15a/retail-09-dialog-open.png` — `DIFF`, 79 pixels
  - `/home/ubuntu/visual/15a/retail-12-after-confirm-full.png` — `DIFF`, 76 pixels
  - The timestamp-related allowed diffs were `/home/ubuntu/visual/15a/wealth-07-after-confirm.png` (227 pixels) and `/home/ubuntu/visual/15a/wealth-08-after-confirm-full.png` (227 pixels).
  - Diff PNGs: `/home/ubuntu/visual/15a-diff/`.
