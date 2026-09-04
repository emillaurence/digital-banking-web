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

## Step 15b — Angular Material 15 MDC components (design-system restoration)

Toolchain: unchanged from 15a (Node 16.20.2, npm 8.19.4, TypeScript 4.9.5, Angular 15.2.10, Material 15.2.9).
Command: `npx ng generate @angular/material:mdc-migration` (all components, whole workspace), followed by manual theme work described below.

### Automatic migration changes (kept as-is)

- `libs/ui-components/src/lib/ui-components.module.ts`, `dialog/confirm-dialog.component.ts`, `dialog/dialog.service.ts`, `dialog/dialog.service.spec.ts` — `@angular/material/legacy-*` imports rewritten back to the standard entry points (`MatButtonModule`, `MatCardModule`, `MatDialogModule`, `MatFormFieldModule`, `MatInputModule`, `MatTableModule`, `MatDialog`, `MAT_DIALOG_DATA`, `MatDialogRef`).
- `libs/ui-components/src/styles/_theme.scss` — legacy mixins replaced by `mat.core` / `mat.all-component-themes`; `mat-*` selectors in `overrides()` rewritten to `mat-mdc-*` where a 1:1 class exists; a `TODO(mdc-migration)` was left on the form-field outline rule (resolved manually, see below).
- `libs/ui-components/src/styles/_typography.scss` — `mat.define-legacy-typography-config` → `mat.define-typography-config` with 2018 level names (`headline`→`headline-5`, `title`→`headline-6`, `subheading-2`→`subtitle-1`, `body-1`→`body-2`, `button` unchanged).
- `package.json` — trailing newline restored (schematic had dropped it).

### Authorised assertion updates (framework changed the DOM class names; same selector shape, same counts)

- `libs/ui-components/src/lib/button/button.component.spec.ts` — `mat-flat-button` → `mat-mdc-unelevated-button` (MDC renamed the flat-button host class).
- `libs/ui-components/src/lib/table/table.component.spec.ts` — `th.mat-header-cell` → `th.mat-mdc-header-cell`, `tr.mat-row` → `tr.mat-mdc-row` (counts still 2 and 2).
- `apps/retail-banking/src/app/app.component.spec.ts`, `apps/wealth-portal/src/app/app.component.spec.ts` — `bofa-table tr.mat-row` → `bofa-table tr.mat-mdc-row`.
- No test was deleted, skipped, or weakened; `libs/ui-components/package.json` peer ranges bumped `^14.2.0` → `^15.2.0` (the library now emits MDC classes, so a v14 consumer would no longer get the theme).

### Loud breakages

- None. The schematic output compiled and all suites passed on the first run; every problem in this step was silent (visual only).

### Silent changes — raw schematic output vs. baseline (symptom → cause → fix → evidence)

Raw-schematic captures: `/home/ubuntu/visual/15b-raw/`, diffs `/home/ubuntu/visual/15b-raw-diff/` (retail full page 50,382 px differ; dialog-open 70,708 px). Diagnosis used a live Angular-14 oracle (git worktree of the tag at `/home/ubuntu/wt-baseline`, served on :4400/:4500) and computed-style inspection (`/home/ubuntu/visual/inspect.js`).

1. Cards 126px → 115px tall; title/amount inset 33px/17px → 17px. Cause: MDC card has no outer padding (header/content carry `16px` padding instead) and the subtitle uses `subtitle-2` (14px/22px/500, 0.1px tracking) rather than legacy `body-1` at `line-height: normal`. Fix (`_theme.scss`, `.mat-mdc-card.bofa-card`): `padding: 16px`, header padding 0, header-text margin `0 16px`, title `margin-bottom: 12px; line-height: normal`, subtitle `margin: -8px 0 16px; font: 400 15px/normal`, content padding 0. Evidence: `retail-02-cards.png` and `wealth-02-cards.png` are `SAME` (0 px).
2. Secondary/ghost buttons rendered white background / black text. Cause: MDC unelevated buttons paint via `--mdc-filled-button-container-color` / `--mdc-filled-button-label-text-color` on `.mdc-button` which beat the component's `background`/`color`. Fix (`button.component.scss`): set both tokens to `transparent` / `#012169` alongside the existing properties. Evidence: `wealth-04-secondary-button.png` `SAME`; dialog "Cancel" button matches.
3. Table cells lost the 24px first/last gutter (columns shifted 8px). Cause: MDC gives every cell `padding: 0 16px`; legacy had `0` with 24px only on first/last. Fix: `th.mat-mdc-header-cell, td.mat-mdc-cell { padding: 0; &:first-of-type { padding-left: 24px } &:last-of-type { padding-right: 24px } }`. Evidence: column x-positions (107/264/578) identical to baseline in `metrics.json`.
4. Form-field outline lost the design-system colour (`rgba(0,0,0,.38)` instead of `#aab6cf`) and input text grew 15px → 16px. Cause: `.mat-form-field-outline` no longer exists; MDC draws the outline with `.mdc-notched-outline__{leading,notch,trailing}` borders; input text uses `body-1` (16px default). Fix: outline rule rewritten against the notched-outline parts for the resting state only (hover/focus keep Material colours, exactly as in v14 where the legacy override also lost to the hover/focus rules); `$body-1: 15px/24px/400` added to the typography config. The `TODO(mdc-migration)` comment was removed with the rule it annotated. Evidence: `mdc-notched-outline__leading` border-color `rgb(170,182,207)`; input font 15px.
5. Dialog 420×159 → 420×234, grey 16px/0.5px-tracked body text wrapping to two lines, 40px phantom spacer above the title. Cause: MDC title `::before` spacer, `padding: 20px 24px` on content, `--mdc-dialog-supporting-text-*` typography/colour, actions `box-sizing: border-box`. Fix: override title/content/actions using the doubled `.mat-mdc-dialog-title.mdc-dialog__title` (etc.) selectors — needed because MDC's structural dialog CSS is component-injected after the global theme and ties on specificity; content `font: inherit; letter-spacing: inherit; color: rgba(0,0,0,.87)`; actions `box-sizing: content-box; padding: 8px 0; margin-bottom: -24px`. Evidence: retail dialog 420×160 (baseline 159; rounding), wealth 420×179 (baseline 178).

### No-op fixes / deviations from plan

- Discovered while diagnosing (5): the v14 `.mat-dialog-container { border-radius: 16px; padding: 28px }` override never rendered — the legacy dialog's own component styles (4px radius, 24px padding) won the cascade, so the baseline actually shows 4px/24px. Only the `box-shadow` part of that rule ever applied. The 15b theme reproduces the *rendered* baseline (4px radius via MDC default, `padding: 24px`, BofA shadow) rather than the never-effective intent. **Decision for the owner:** keep as-is (pixel-faithful) or activate 16px/28px in a later commit.
- `density: 0` is passed explicitly to `mat.define-light-theme` (MDC default) so any later density decision is a one-line change.
- Dialog `--mdc-dialog-container-shape` was tried and dropped when the 4px baseline was established.
- The `.mat-calendar-body-selected` ring override was unaffected (datepicker is not an MDC component in v15).

### Material-owned density / rendering differences (reported, not fixed — owner judges)

- Table data rows 48px → 52px (`--mdc-data-table` row height); header row unchanged at 56px. Consequence: on wealth-portal the "Request rebalance" button sits 20px lower (5 rows × 4px; `firstButton.y` 711 → 731). Row/column alignment is intact.
- Outlined form field 83px → 78px per field (MDC 56px text field + 22px subscript vs. legacy 55.1px + 20.2px subscript + 3.75px margins); floating label geometry and hint size (11.25px → 12px) follow MDC. Consequence: on retail-banking the "Send payment" button sits 14px higher (`firstButton.y` 659 → 645). Field widths, outline colour, label text and vertical stacking are intact.
- Button label: legacy `line-height: 36px` inline-block vs. MDC flex-centred label; rendered box is identical (146×36 / 177×36 / 96×36) and `retail-05-primary-button.png` differs only by 722 anti-aliasing pixels of the label glyphs.
- Text anti-aliasing / sub-pixel differences on MDC-rendered labels (dialog title/body, button labels); no geometry change.

### Evidence

- Builds: library, retail-banking, wealth-portal all `rc=0` (`/home/ubuntu/green/15b/build-*.log`). Budget warnings only: retail initial 715.09 kB (was 663.32 kB at 15a), wealth initial 527.15 kB (new warning; was under 500 kB). Both below the 1 MB error threshold.
- Tests: ui-components `5/5`, retail-banking `3/3`, wealth-portal `2/2`, all `rc=0`, 0 `ERROR` lines (`/home/ubuntu/green/15b/test-*.log`).
- Public API: `/home/ubuntu/green/15b/dts.diff` is 59 lines, all generated-only (`export declare type` → `export type`; trailing `never` generic slot in private `ɵcmp`). The 15a transient `legacy-*` imports in generated declarations are gone. No exported class, interface, input, output, method or selector changed. `pkg-meta.diff`: only the peer-dependency range bump.
- Visual: `/home/ubuntu/visual/15b/` vs baseline (`/home/ubuntu/green/15b/compare.txt`, diffs in `/home/ubuntu/visual/15b-diff/`). Cards and secondary button `SAME`; all remaining diffs are explained by the two density items above (table row height, form-field height) plus text anti-aliasing and the wealth timestamp. `metrics.diff` (24 lines) contains only `tableRowHeights`, `firstFormField.h`, `firstButton.y`, `buttonFont` (line-height), and ±1px dialog height. No horizontal overflow (`scrollWidth == clientWidth == 1280`), no card/table/button width change.
