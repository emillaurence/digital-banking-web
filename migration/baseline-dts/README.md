# Baseline public API snapshot (Angular 14)

This directory is a snapshot of every `.d.ts` file emitted into `dist/ui-components/` by `npm run build:lib` at the `baseline-angular-14` tag (Angular 14.2.x), plus the built `package.json`. It captures the public API surface of `@bofa/ui-components` before any migration work so later phases can verify the API has not drifted. To regenerate the built output and diff it against this baseline, run from the repo root: `npm run build:lib && diff -r -x package.json -x README.md migration/baseline-dts dist/ui-components | grep -v '^Only in dist'` — while the API is unchanged this produces no output. The following exported symbols are expected to remain stable across the migration: UiComponentsModule, BofaButtonComponent / BofaButtonVariant, BofaCardComponent, BofaDatepickerComponent, BofaConfirmDialogComponent / BofaConfirmDialogData, BofaDialogService, BofaTableComponent / BofaTableColumn, BofaTextInputComponent.

## Files

- `index.d.ts`
- `public-api.d.ts`
- `lib/ui-components.module.d.ts`
- `lib/button/button.component.d.ts`
- `lib/card/card.component.d.ts`
- `lib/datepicker/datepicker.component.d.ts`
- `lib/dialog/confirm-dialog.component.d.ts`
- `lib/dialog/dialog.service.d.ts`
- `lib/table/table.component.d.ts`
- `lib/text-input/text-input.component.d.ts`
- `package.json` (built manifest)
