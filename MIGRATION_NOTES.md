# Migration notes

## Angular 14 -> 15

### Material compatibility imports

- **Symptom:** The Material migration rewrote library dialog and test imports to compatibility-prefixed entry points and symbols.
- **Cause:** The Material 15 schematic preserves pre-MDC behavior by applying a compatibility shim.
- **Fix:** Restored the unprefixed MDC imports and symbols for buttons, tables, and dialogs throughout the library and its specs.

### Typography level names

- **Symptom:** The v14 typography names (`headline`, `title`, `subheading-2`, and `body-1`) are not accepted by the v15 MDC typography configuration.
- **Cause:** Angular Material 15 uses the 2022 typography scale names.
- **Fix:** Renamed the levels to `headline-5`, `headline-6`, `subtitle-1`, and `body-2`, preserving every size, line-height, and weight triple.

### Typography passed to the core theme

- **Symptom:** Passing the typography configuration to `mat.core()` no longer matches the v15 Sass API, and the schematic's compatibility theme mixins do not produce the MDC theme.
- **Cause:** Material 15 separates core styles from component typography and expects typography in the light-theme configuration.
- **Fix:** Called `mat.core()` without arguments, added the typography configuration under `typography:`, and restored the all-component MDC theme mixin.

### Button class override

- **Symptom:** The rendered flat button no longer has `mat-flat-button`; the DOM contains `mat-mdc-unelevated-button` and `mat-mdc-button-base`.
- **Cause:** Material 15 migrated flat buttons to MDC classes.
- **Fix:** Updated the button spec assertion to `mat-mdc-unelevated-button` and the pill-button override to `.mat-mdc-button-base`.

### Card class override

- **Symptom:** The rendered card no longer matches `.mat-card`.
- **Cause:** Material 15 renders cards with `mat-mdc-card`.
- **Fix:** Rewrote the card override to `.mat-mdc-card.bofa-card`, preserving the 12px radius, border, and navy shadow.

### Table class overrides

- **Symptom:** The rendered table no longer matches `.mat-table`, and its header and data rows no longer match `.mat-header-cell` and `.mat-row`.
- **Cause:** Material 15 renders the table with MDC data-table classes.
- **Fix:** Rewrote the table selectors to `table.mat-mdc-table`, `th.mat-mdc-header-cell`, and `tr.mat-mdc-row`; updated the authorized spec selectors without changing counts.

### Table row hover

- **Symptom:** The pre-MDC row hover selector does not match the rendered data rows.
- **Cause:** The row class changed from `mat-row` to `mat-mdc-row`.
- **Fix:** Applied the hover background to `tr.mat-mdc-row:hover`; browser DOM verification matched the selector and produced `rgb(242, 245, 251)`.

### Outlined form-field border

- **Symptom:** `.mat-form-field-outline` is absent from the rendered outlined field, so the #aab6cf outline color does not apply.
- **Cause:** Material 15 renders the outline as `mdc-notched-outline` with leading, notch, and trailing elements.
- **Fix:** Applied the border color to the three `.mdc-notched-outline__*` elements beneath `.mat-mdc-form-field.mat-form-field-appearance-outline`; browser verification matched all nine rendered outline elements.

### Dialog surface override

- **Symptom:** The dialog container no longer owns the visible surface radius and shadow; an intermediate MDC selector attempt still computed framework defaults.
- **Cause:** Material 15 renders the visible surface as `.mat-mdc-dialog-surface`, and its container-qualified Material rules have higher specificity.
- **Fix:** Targeted `.mat-mdc-dialog-container .mat-mdc-dialog-surface` and, after measuring the rendered baseline, shipped 4px radius and 24px padding with the navy shadow. The intermediate 16px/28px attempt was discarded; only the shadow needs `!important` to beat MDC's `.mdc-dialog__surface` elevation rule.

### Calendar selected-day ring

- **Symptom:** The selected current day retained Material's 1px white inset instead of the design-system ring.
- **Cause:** The v15 calendar still uses `mat-calendar-body-selected`, but the more-specific current-day rule overrides a plain selected-day rule.
- **Fix:** Added the current-day selected variant to the selector and used the requested 2px #f18c9b ring with sufficient priority.

## Angular 15 visual parity round

### Typography metrics

- **Symptom:** MDC typography levels carried different sizes, line heights, weights, and letter spacing from the rendered v14 design system.
- **Cause:** Material 15 changed the typography level names and default 2022-scale metrics.
- **Fix:** Declared the measured v14 levels, including headline, subtitle, body, caption, and button levels, with the measured values and normal letter spacing.

### Card geometry and content gutters

- **Symptom:** MDC cards changed header/content gutters, subtitle metrics, and card height.
- **Cause:** MDC moved card padding to the header and content elements and changed card text defaults.
- **Fix:** Applied the measured header padding, title/subtitle margins and metrics, and content typography/color while preserving MDC content padding; the summary-card height returned to 126px.

### Table cell metrics

- **Symptom:** MDC table cells and rows used different padding and vertical metrics, and the transaction columns shifted relative to v14.
- **Cause:** MDC data-table cells use border-box sizing and changed the default cell padding.
- **Fix:** Applied the measured 24px leading-cell padding, restored the legacy trailing-cell gutter, set normal line height, and retained the 56px header and 48px body row metrics.

### Outlined form-field selectors and metrics

- **Symptom:** The old outline, label, hint, and input selectors did not match MDC's rendered form-field structure; field text and outline gutters differed.
- **Cause:** MDC uses a notched outline, floating-label element, MDC input control, and suffix/subscript wrappers instead of the v14 elements.
- **Fix:** Targeted the rendered MDC elements, restored the measured 11.25px horizontal field gutters, caption/input/label line metrics, hint/label colors, and #aab6cf outline. Reserved the measured subscript height and used a 4px wrapper layout margin to align the field geometry without changing MDC's 56px control metric.

### Datepicker toggle sizing and alignment

- **Symptom:** The MDC datepicker toggle rendered as a 48px icon button with 12px padding and sat too close to the field edge.
- **Cause:** MDC uses `.mat-mdc-form-field-icon-suffix` and `.mat-mdc-icon-button.mat-mdc-button-base`.
- **Fix:** Set the suffix button to 38px square with 7px padding and aligned its right inset to the v14 reference.

### Dialog rendered-baseline surface

- **Symptom:** The first v15 dialog was substantially taller because the migration forced the old intended 16px radius and 28px padding.
- **Cause:** The v14 `.mat-dialog-container` padding/radius override was ineffective; v14 actually rendered a 4px radius and 24px padding, while MDC paints the visible surface on `.mat-mdc-dialog-surface`.
- **Fix:** Deliberately matched the rendered baseline on `.mat-mdc-dialog-container .mat-mdc-dialog-surface`, retaining the navy shadow and documenting the ineffective v14 override.

### Dialog title, content, and actions

- **Symptom:** MDC added a title spacer, grey supporting text, extra content padding, and different action spacing.
- **Cause:** MDC supplies the `::before` title spacer and higher-specificity `.mdc-dialog` content rules.
- **Fix:** Disabled the spacer, applied the measured title/content/action margins and padding with container-qualified selectors, and restored the v14 action box sizing.

### MDC button specificity

- **Symptom:** Secondary and ghost buttons lost their transparent backgrounds and navy labels under MDC.
- **Cause:** Material's two-class unelevated-button rules outranked the old single-class variant selectors.
- **Fix:** Qualified both variant rules with `.mat-mdc-unelevated-button`, retaining the existing transparent, navy, and secondary inset-ring declarations.

### Accepted MDC differences

- **Symptom:** The probe still reports MDC class names, zero-size flat-button shadows versus `none`, and `normal` flat-button line height.
- **Cause:** These are framework implementation differences with no visible effect.
- **Fix:** Accepted and documented these differences. The outlined MDC form-field control remains 56px versus v14's 58.875px; the min-height experiment was reverted because it disturbed label/outline alignment.

### Test discovery bootstrap

- **Symptom:** The Angular 15 test schematic removed the `require.context` declaration and automatic spec-module loading from each project's `src/test.ts`.
- **Cause:** Angular 15's test builder discovers the configured specs without the webpack-specific `require.context` bootstrap.
- **Fix:** Kept the Angular testing-environment initialization and removed the obsolete `require.context` loader from `ui-components`, `retail-banking`, and `wealth-portal`.

### Application Browserslist files

- **Symptom:** The application-local `.browserslistrc` files were removed by the Angular 15 migration.
- **Cause:** Angular 15 centralizes the supported browser configuration instead of retaining the generated per-application files.
- **Fix:** Accepted the schematic removal in both applications.

### TypeScript compiler defaults

- **Symptom:** The migration changed the workspace target from `es2020` to `ES2022` and added `useDefineForClassFields: false`.
- **Cause:** Angular 15's TypeScript configuration schematic updates the JavaScript target and preserves legacy class-field initialization semantics required by the workspace.
- **Fix:** Retained the schematic-generated `ES2022` target and `useDefineForClassFields: false`.

### Node 18 toolchain

- **Symptom:** The Angular 15 workspace was still declared and documented as requiring Node 16.20.2.
- **Cause:** The Node declaration and README had not been advanced with the Angular major-version migration.
- **Fix:** Set `.nvmrc` and the README toolchain entry to Node 18.20.4, then verified the complete build and test suite on that declared version.
