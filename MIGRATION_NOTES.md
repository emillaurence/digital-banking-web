# Migration Notes

## Step 1: Angular 14.2 and Material 14.2 to 15.2 with MDC

### Update tooling

- The Angular update changed the workspace packages to Angular 15.2.x, TypeScript 4.9.5, and ng-packagr 15.2.2. The Angular CLI migration also removed the per-application Browserslist files, removed obsolete Karma `require` calls, and updated the TypeScript target settings.
- The first `@angular/material@15` update attempt was blocked because the preceding Angular update had already modified the worktree. Re-ran the Material update with `--allow-dirty` so its changes were applied to the same migration branch.
- The Material schematic converted several imports to the `legacy-*` compatibility entry points. Replaced those imports with the MDC component entry points because the migration must not depend on the legacy shim.

### MDC DOM class changes

- Flat buttons render the public `mat-mdc-unelevated-button` class instead of `mat-flat-button`; updated the button spec and retained its variant assertion.
- Table headers render `mat-mdc-header-cell` instead of `mat-header-cell`, and table rows render `mat-mdc-row` instead of `mat-row`; updated the library and both application specs while retaining the original counts (2 headers/2 rows and 5 rows).
- Cards render `mat-mdc-card` instead of `mat-card`; updated the global BofA card override.
- Tables render `mat-mdc-table` instead of `mat-table`; updated the global BofA table override.
- Dialog containers render `mat-mdc-dialog-container`; updated the global dialog override.

### Theming API and style changes

- `mat.core()` no longer accepts a typography argument. Moved the Public Sans typography config to the `typography` key in `mat.define-light-theme(...)` and switched to `mat.core()` plus `mat.all-component-themes(...)`.
- Replaced the deprecated typography levels `$headline`, `$title`, and `$subheading-2` with `$headline-5`, `$headline-6`, and `$subtitle-1`, preserving the requested 28/36/700, 20/28/600, and 16/24/600 values. Body and button levels remain 15/24/400 and 15/16/600.
- Updated the BofA overrides to MDC classes while preserving the pill button, card, table, row-hover, dialog, and calendar styling.
- The outline color requires the MDC internal `.mdc-notched-outline` descendant because the outline is rendered by the MDC form-field surface rather than the Angular Material host. The dialog radius/padding/shadow requires the MDC internal `.mdc-dialog__surface` descendant for the same reason. These are the only internal MDC selectors targeted; no `::ng-deep` is used.
- `.mat-calendar-body-selected` remains the datepicker selection class in Material 15, so the selected-date ring override is unchanged.

### Package metadata

- Updated `@bofa/ui-components` Angular peer dependency ranges to `^15.2.0`.
- Updated `zone.js` to the Angular 15-compatible `0.12.0` release.
