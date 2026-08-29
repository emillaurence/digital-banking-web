# Angular 14 → 18 migration notes

Running log of every breakage hit during the migration, its cause, and the fix.
One section per major version; each version is a single commit that leaves
`npm run test:all` at **10/10** (ui-components 5, retail-banking 3, wealth-portal 2).

Baseline: tag `baseline-angular-14`, Node 16.20.2, 10/10 green.

---

## Angular 15

Commands: `ng update @angular/core@15 @angular/cli@15`, then `ng update @angular/material@15`.
Node 16.20.2 (unchanged). TypeScript 4.7.4 → 4.9.5.

### Decision: MDC now, not the legacy shim

`ng update @angular/material@15` defaults to preserving the v14 look by rewriting every
Material import to the `@angular/material/legacy-*` entry points
(`MatButtonModule` → `MatLegacyButtonModule`, `MatDialog` → `MatLegacyDialog`, and
`mat.core()` → `mat.legacy-core()` in Sass). Those legacy entry points are **deleted in
Material 17**, so taking them would have meant redoing this work two steps later.

Those automated legacy rewrites were therefore reverted (5 files:
`button.component.spec.ts`, `table.component.spec.ts`, `dialog.service.ts`,
`dialog.service.spec.ts`, `confirm-dialog.component.ts`) and the MDC-based
entry points — the unprefixed `@angular/material/*` paths, which in v15+ *are* the MDC
components — were kept.

Note the automated migration left `ui-components.module.ts` untouched (it still imported
the unprefixed, i.e. MDC, modules) while rewriting the specs to legacy. That mixed state
would have failed at runtime; going all-MDC resolved it in one direction.

### Breakage 1 — button spec: DOM class renamed

- **Symptom:** `Expected mdc-button mdc-button--unelevated mat-mdc-unelevated-button bofa-button bofa-button--secondary mat-unthemed mat-mdc-button-base to contain 'mat-flat-button'.`
- **Cause:** MDC `MatButton` emits `mat-mdc-unelevated-button` where the legacy button
  emitted `mat-flat-button`. The `mat-flat-button` *attribute selector* in
  `button.component.html` is unchanged and still valid; only the rendered class changed.
- **Fix:** assertion updated to the new class name. Same check, same count.

### Breakage 2 — table spec: cell/row classes renamed

- **Symptom:** `Expected 0 to be 2.` for both `th.mat-header-cell` and `tr.mat-row`.
- **Cause:** MDC table renders `mat-mdc-header-cell` / `mat-mdc-row`.
- **Fix:** selectors updated to `th.mat-mdc-header-cell` / `tr.mat-mdc-row`. Both app specs
  (`bofa-table tr.mat-row`) needed the same rename.

### Breakage 3 — theme Sass: `mat.core()` no longer takes typography

- **Cause:** in v15 `mat.core()` stopped accepting a typography config; typography belongs in
  the theme config instead.
- **Fix:** `_theme.scss` now calls bare `mat.core()` and passes
  `typography: typography.$bofa-typography` (plus explicit `density: 0`) into
  `mat.define-light-theme(...)`, keeping `mat.all-component-themes($theme)`.

### Breakage 4 — typography level names

- **Cause:** the legacy 2014 level names (`$headline`, `$title`, `$subheading-2`) are only
  valid in `define-legacy-typography-config`.
- **Fix:** `_typography.scss` uses `define-typography-config` with the 2018 names via the
  official mapping: `headline` → `headline-5`, `title` → `headline-6`,
  `subheading-2` → `subtitle-1`, `button` → `button`. The legacy `body-1` (the default body
  text, 15px/24px/400) maps to `body-2` in the new scale; it is set on **both** `body-1` and
  `body-2` so components reading either level keep the 15px design-system body size.
  Font family and all sizes/weights are unchanged.

### Breakage 5 — `overrides()` mixin targeted legacy internals

- **Cause:** every selector in the mixin was a pre-MDC class name, so the entire
  design-system restyling silently stopped applying.
- **Fix:** selectors remapped, same declarations:
  | was | now |
  |---|---|
  | `.mat-button-base.bofa-button` | `.mat-mdc-button-base.bofa-button` |
  | `.mat-card.bofa-card` | `.mat-mdc-card.bofa-card` |
  | `table.mat-table.bofa-table` | `table.mat-mdc-table.bofa-table` |
  | `th.mat-header-cell` / `tr.mat-row:hover` | `th.mat-mdc-header-cell` / `tr.mat-mdc-row:hover` |
  | `.mat-form-field-appearance-outline .mat-form-field-outline` (`color`) | `.mat-mdc-form-field .mdc-notched-outline__{leading,notch,trailing}` (`border-color`) |
  | `.mat-dialog-container` | `.mat-mdc-dialog-container .mdc-dialog__surface` |
  | `.mat-calendar-body-selected` | unchanged (datepicker is not MDC-based) |

  The outline case is the one real rewrite: MDC's outlined form field paints three
  `mdc-notched-outline__*` segments with `border-color`, not a single element with `color`.
  The dialog case moved to the inner `.mdc-dialog__surface`, since MDC's host container is
  no longer the padded/rounded surface.

### Also changed by the CLI schematics (no intervention needed)

- `.browserslistrc` deleted from both apps (matched the CLI default).
- `require.context` block removed from all three `src/test.ts` — the karma builder discovers
  specs itself now.
- `tsconfig.json`: `target` → `ES2022`, `useDefineForClassFields: false` added.
- `libs/ui-components/package.json` peer ranges → `^15.2.0` (dependency metadata only; the
  public API is untouched).

### Not a regression

Both production app builds emit `bundle initial exceeded maximum budget` warnings
(retail 713 kB, wealth 525 kB against a 500 kB warning budget). These are **warnings**, the
builds succeed, and MDC ships more CSS/JS than the legacy components. The budgets were left
as-is rather than quietly raised.
