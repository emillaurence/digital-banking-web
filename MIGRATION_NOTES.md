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
- The outline color requires the MDC internal `.mdc-notched-outline` descendant because the outline is rendered by the MDC form-field surface rather than the Angular Material host. Dialog padding uses the MDC internal `.mdc-dialog__content` class alongside the public Angular Material dialog classes, while radius and shadow use the public MDC tokens and the internal `.mdc-dialog__surface` descendant. No `::ng-deep` is used.
- `.mat-calendar-body-selected` remains the datepicker selection class in Material 15, so the selected-date ring override is unchanged.
- The initial `.mat-mdc-form-field .mdc-notched-outline { color: #aab6cf; }` override was a no-op: MDC sets `border-color` explicitly on the `__leading`, `__notch`, and `__trailing` segments rather than inheriting `currentColor`. Limited the override to resting, non-focused, non-invalid form fields and set `border-color` on all three segments, leaving focus and error states to Material's theme.
- The MDC dialog surface's direct `border-radius: 16px` declaration lost to Material's tokenized radius rule, which computed to 4px. Set the public `--mdc-dialog-container-shape: 16px` token on `.mat-mdc-dialog-container`; Material 15.2 consumes it and the surface now computes to 16px.
- MDC dialog title, content, and actions add horizontal padding on top of the surface's 28px inset. Zeroed only their horizontal padding through `.mat-mdc-dialog-title`, `.mat-mdc-dialog-content`, and `.mat-mdc-dialog-actions`, preserving vertical rhythm and restoring a 28px effective horizontal inset.
- The dialog surface's direct shadow declaration also lost to Material's tokenized elevation rule. Set the public `--mdc-dialog-container-elevation` token to preserve the BofA navy shadow.
- Audited the MDC overrides in both applications: button pill geometry, card border/radius/shadow, table width/header/hover styling, and resting form-field outline all computed to their intended values. Secondary and ghost button text needed a higher-specificity global MDC override to retain the intended navy color. The datepicker selection ring remains on the public `.mat-calendar-body-selected` class and computes to `rgb(241, 140, 155)`.
- Investigated the native-heading typography difference against the Angular Material 14.2.7 source. Its `mat.core($typography-config)` calls `all-component-typographies`, whose `typography-hierarchy` uses the default `.mat-typography` ancestor and therefore emits `.mat-typography h1`, not an unscoped `h1`. Neither baseline app adds `.mat-typography`, and their baseline SCSS has no native `h1` rule. Removed the Material 15 hierarchy mixin because retaining it under `body` would have changed app appearance beyond Angular 14 parity. Material component typography remains supplied by the theme's `typography` key: card titles compute to 20px/28px/600 and BofA button labels to 15px/16px/600.
- Audited the confirm-dialog ghost button with the pointer moved away and focus explicitly blurred. Before this follow-up its resting computed `background-color` was already transparent (`rgba(0, 0, 0, 0)`), with no hover/focus state; after the follow-up it remains transparent, so no additional styling change was needed. The earlier light-grey appearance was a focus/state rendering artifact rather than a resting background.

### Package metadata

- Updated `@bofa/ui-components` Angular peer dependency ranges to `^15.2.0`.
- Updated `zone.js` to the Angular 15-compatible `0.12.0` release.

## Step 2: Angular 15.2 and Material 15.2 to 16.2

### Update tooling

- Ran `npx ng update @angular/core@16 @angular/cli@16` under Node 16.20.2. The temporary Angular CLI 16.2.16 updated the workspace to Angular 16.2.x, `@angular-devkit/build-angular`/CLI 16.2.16, compiler CLI 16.2.12, and ng-packagr 16.2.3. Its required migrations made no source or workspace-configuration changes.
- Ran `npx ng update @angular/material@16 --allow-dirty` after the Angular update. Material/CDK 16.2.14 migrations completed without source changes; no legacy imports, standalone migrations, or optional app-structure rewrites were introduced.
- Updated TypeScript from 4.9.5 to the Angular 16-compatible exact pin 5.1.6, and zone.js from 0.12.0 to 0.13.3. The existing `zone.js/testing` test imports remain valid.
- Updated `@bofa/ui-components` Angular peer dependency ranges to `^16.2.0`.
- The package manager emitted one non-fatal engine warning for a transitive `node-releases@2.0.54` package requiring Node `>=18` while the prescribed Node version is `16.20.2`; the Angular 16 build and tests still completed successfully.

### Breakage and theming checks

- No Angular 16 TypeScript, strict-template, DOM assertion, Sass, or MDC theming breakages were found. Existing module-based architecture, selectors, inputs, service contracts, and test assertions remained unchanged.
- Computed-style auditing initially found that Material 16 now redeclares the dialog shape and elevation custom properties directly on the surface, so declarations inherited from `.mat-mdc-dialog-container` computed back to the Material defaults (`4px` radius and the default black shadow). Moved the same public MDC token declarations to the existing more-specific `.mat-mdc-dialog-container .mdc-dialog__surface` selector; the surface then computed to the intended `16px` radius and navy shadow. Dialog padding and all other existing MDC tokens retained their Material 15 behavior.
- Re-checked the remaining Material 15 typography and MDC overrides after the Material 16 update by computed style rather than class presence. No additional selector or compatibility shim was required.

### Verification

- The Angular 16 regression gate passed with the baseline suite counts: ui-components 5, retail-banking 3, and wealth-portal 2. Application builds completed with only the existing initial bundle budget warnings; no `ERROR` lines were emitted.
- The public API comparison against the Angular 14 baseline retained the same declaration file and FESM export lists. Only the previously characterized Angular/TypeScript declaration metadata differences are acceptable; no public symbol or signature changed.

## Step 3: Angular 16.2 and Material 16.2 to 17.3

### Update tooling

- Installed and selected Node `20.20.2` with `nvm install 20 && nvm use 20`, then updated `.nvmrc` to the exact settled version. Angular 17 was not run on the previous Node 16 toolchain.
- Ran `npx ng update @angular/core@17 @angular/cli@17 --allow-dirty`. The temporary Angular CLI `17.3.17` updated the workspace to Angular `17.3.12`, CLI/build-angular `17.3.17`, compiler CLI `17.3.12`, ng-packagr `17.3.0`, TypeScript `5.4.5`, and zone.js `0.14.10`.
- Ran `npx ng update @angular/material@17 --allow-dirty`; Material and CDK were updated to `17.3.10`. Both schematics completed successfully.
- The Angular CLI migration renamed deprecated dev-server and extract-i18n option keys from `browserTarget` to `buildTarget` in `angular.json`. The existing application `:browser` builders and Karma builders were preserved; no application-builder/esbuild migration was applied.
- No standalone, control-flow, or other optional app-structure migration was applied. No `@angular/material/legacy-*` imports remain.
- Updated `@bofa/ui-components` Angular peer dependency ranges to `^17.3.0`.

### Breakage and theming checks

- No Angular 17 TypeScript, strict-template, test bootstrap, or component DOM assertion breakages were found. The existing module-based architecture, `clearContext: true` Karma settings, selectors, inputs, service contract, and test assertions remain intact.
- No Material 17 legacy entry-point or MDC selector migration was required. Rebuilt the library and audited every existing `overrides()` rule by computed style in both running applications rather than relying on class names.
- Pill buttons retained `border-radius: 9999px`, `padding: 0 22px`, and `min-width: 96px` for primary and ghost/secondary variants. Button typography remained Public Sans `15px/16px/600`.
- Cards retained `12px` radius, `1px solid #e2e7f0` border, and the BofA navy shadow.
- Tables retained 100% width (614px in the retail layout and 966px in the wealth layout), navy 13px/600 uppercase headers with `.04em` spacing and a 2px navy rule, plus the `#f2f5fb` row hover.
- Resting MDC form-field outline segments continued to compute to `rgb(170, 182, 207)`.
- Dialog tokens continued to compute to a `16px` radius and the BofA navy shadow. Surface padding remained `28px`; title/content/actions horizontal padding remained zero, producing an effective 28px text inset while preserving vertical rhythm.
- The selected date content span (`.mat-calendar-body-cell-content.mat-calendar-body-selected`) continued to compute the BofA ring as `rgb(241, 140, 155) 0 0 0 2px`.
- Card titles remained `20px/28px/600`, and native `h1` remained Public Sans `32px` with browser-default line-height rather than receiving a new global Material hierarchy rule.

### Verification

- Angular 17 regression verification passed with the baseline suite counts: ui-components 5, retail-banking 3, and wealth-portal 2. Application builds completed with only the known initial bundle budget warnings; no `ERROR` lines were emitted.
- The public API comparison against the Angular 14 baseline retained the same declaration file and runtime export lists. Only the previously characterized Angular/TypeScript declaration metadata and FESM target differences were present; no public symbol or signature changed.

## Step 4: Angular 17.3 and Material 17.3 to 18.2

### Update tooling

- Selected the pinned Node `20.20.2` toolchain with `source ~/.nvm/nvm.sh && nvm use`; `.nvmrc` remains pinned to `20.20.2`.
- Ran `npx ng update @angular/core@18 @angular/cli@18`, then `npx ng update @angular/material@18 --allow-dirty`. The workspace now uses Angular packages `18.2.14`, Angular CLI/build-angular `18.2.21`, Angular compiler CLI `18.2.14`, Material/CDK `18.2.14`, ng-packagr `18.2.1`, TypeScript `5.4.5`, and zone.js `0.14.10`.
- Updated `@bofa/ui-components` Angular peer dependency ranges to `^18.2.0`.
- The optional Angular 18 application-builder migration was declined. Existing `@angular-devkit/build-angular:browser` application builders and `:karma` test builders remain in place, with `clearContext: true` retained in both application Karma configurations. No standalone, `inject()`, control-flow, or legacy Material entry-point migration was applied.
- Material 18 renamed the Material 2 Sass APIs to the `m2-*` namespace (`m2-define-palette`, `m2-define-light-theme`, `m2-define-typography-config`, and `m2-define-typography-level`). The theme remains Material 2; no `mat.define-theme` or Material 3 configuration was adopted.

### Breakage and theming checks

- Nothing broke in the TypeScript, strict-template, module bootstrap, test bootstrap, or component behavior checks. No specs were deleted, skipped, weakened, or changed; suite counts remain 5/3/2.
- The computed-style audit found one Material 18 token-location change. The existing `--mdc-dialog-container-elevation` declaration became a no-op because Material 18's dialog surface reads `--mat-dialog-container-elevation-shadow`. Replaced it with `--mat-dialog-container-elevation-shadow: 0 12px 40px rgba(1, 33, 105, 0.25)` on the existing surface selector. The public `--mdc-dialog-container-shape` token continued to produce the intended 16px radius.
- Dialog surface padding remained `28px`; title, content, and actions retained zero horizontal padding while preserving vertical rhythm, producing an effective 28px text inset.
- Every design-system override was rechecked against rendered computed styles in the restarted Angular 18 applications. Buttons retained pill geometry, cards retained their border/radius/shadow, tables retained their width/header/hover treatment, resting MDC outline segments retained `rgb(170, 182, 207)`, the selected date retained the BofA ring, and component typography remained supplied through the theme's typography key. Native `h1` remained the browser-default 32px style rather than receiving a global Material hierarchy.

### Verification and warnings

- Under Node `20.20.2`, `npm run build:lib`, the `ui-components`, `retail-banking`, and `wealth-portal` Karma suites, and `npm run build:apps` all exited successfully. Counts were `5 SUCCESS`, `3 SUCCESS`, and `2 SUCCESS`, with no `ERROR` lines.
- Application builds emitted only the known initial bundle budget warnings:
  - Retail: budget `512.00 kB` exceeded by `222.61 kB` (`734.61 kB` total).
  - Wealth: budget `512.00 kB` exceeded by `103.03 kB` (`615.02 kB` total).
- No Sass deprecation warnings or Node engine warnings were emitted by the Angular 18 build/test gate.
- The API artifacts were regenerated under `/home/ubuntu/step4-api/`. The declaration file list and runtime FESM export set remain unchanged. Differences versus `/home/ubuntu/baseline-api/` are limited to the characterized Angular/TypeScript declaration metadata (`export type`, input metadata, and trailing `never`) and the expected FESM target change to `fesm2022`; no public symbol, selector, input, service contract, or module export changed.
