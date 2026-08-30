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
- The initial `.mat-mdc-form-field .mdc-notched-outline { color: #aab6cf; }` override was a no-op: MDC sets `border-color` explicitly on the `__leading`, `__notch`, and `__trailing` segments rather than inheriting `currentColor`. Limited the override to resting, non-focused, non-invalid form fields and set `border-color` on all three segments, leaving focus and error states to Material's theme.
- The MDC dialog surface's direct `border-radius: 16px` declaration lost to Material's tokenized radius rule, which computed to 4px. Set the public `--mdc-dialog-container-shape: 16px` token on `.mat-mdc-dialog-container`; Material 15.2 consumes it and the surface now computes to 16px.
- MDC dialog title, content, and actions add horizontal padding on top of the surface's 28px inset. Zeroed only their horizontal padding through `.mat-mdc-dialog-title`, `.mat-mdc-dialog-content`, and `.mat-mdc-dialog-actions`, preserving vertical rhythm and restoring a 28px effective horizontal inset.
- The dialog surface's direct shadow declaration also lost to Material's tokenized elevation rule. Set the public `--mdc-dialog-container-elevation` token to preserve the BofA navy shadow.
- Audited the MDC overrides in both applications: button pill geometry, card border/radius/shadow, table width/header/hover styling, and resting form-field outline all computed to their intended values. Secondary and ghost button text needed a higher-specificity global MDC override to retain the intended navy color. The datepicker selection ring remains on the public `.mat-calendar-body-selected` class and computes to `rgb(241, 140, 155)`.
- Material 15's theme typography config applies to Material components, but native headings require the public `mat.typography-hierarchy` mixin. Applied the BofA hierarchy under `body` so the app `h1` computes to 28px/36px/700; card titles and BofA button labels compute to 20px/28px/600 and 15px/16px/600 respectively.

### Package metadata

- Updated `@bofa/ui-components` Angular peer dependency ranges to `^15.2.0`.
- Updated `zone.js` to the Angular 15-compatible `0.12.0` release.
