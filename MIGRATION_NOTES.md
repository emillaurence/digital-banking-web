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

---

## Angular 16

Commands: `ng update @angular/core@16 @angular/cli@16`, then `ng update @angular/material@16`.
Node 16.20.2 → **18.20.5** (`.nvmrc` updated; Angular 16 drops Node 16.10-). zone.js
0.11.8 → 0.13.3. TypeScript stays 4.9.5 (in range for v16).

**No breakages.** All three CLI/core migrations reported "No changes made", the CDK/Material
v16 migrations likewise, and `npm run test:all` was 10/10 on the first attempt with no source
edits. `ng-packagr` 16 built the library without complaint, so no `ng-package.json` or
`tsconfig.lib*.json` changes were needed after all.

Only edits: dependency versions in `package.json`, `.nvmrc`, and the library's peer ranges
→ `^16.2.0`.

Bundle budget warnings persist and shrank slightly (retail 705 kB, wealth 495 kB — the latter
now under budget).

---

## Angular 17

Commands: `ng update @angular/core@17 @angular/cli@17`, then `ng update @angular/material@17`.
Node stays 18.20.5. TypeScript 4.9.5 → 5.4.5. zone.js 0.13.3 → 0.14.10.

**No breakages.** 10/10 green on the first attempt with no source edits.

- The CLI schematic renamed `browserTarget` → `buildTarget` in `angular.json` (6 occurrences
  across the `serve` and `extract-i18n` targets of both apps).
- Material 17 **deletes** the `@angular/material/legacy-*` entry points. This was a complete
  no-op here, which is the payoff for having taken MDC at v15 instead of the legacy shim —
  had we shimmed, this step would have been the v15 MDC migration all over again, on top of
  three versions of drift.
- Deliberately **not** switched to the esbuild `application` builder; still on
  `@angular-devkit/build-angular:browser`. That is a build-system change orthogonal to the
  framework migration.
- Library peer ranges → `^17.3.0`.

Bundle budget warnings: retail 728 kB, wealth 595 kB (both above the 500 kB warning budget,
builds still succeed).

---

## Angular 18

Commands: `ng update @angular/core@18 @angular/cli@18`, then `ng update @angular/material@18`.
Node 18.20.5 → **20.18.1** (`.nvmrc`). TypeScript stays 5.4.5.

**No breakages.** 10/10 green on the first attempt.

### Handled automatically — Material's M2 Sass API rename

The v18 Material migration rewrote all three theme partials to the `m2-` prefixed API:
`define-palette` → `m2-define-palette`, `$red-palette` → `$m2-red-palette`,
`define-light-theme` → `m2-define-light-theme`, `define-typography-config` /
`define-typography-level` → `m2-define-typography-config` / `m2-define-typography-level`.
Purely a rename; palettes, brand anchors, and every size/weight are unchanged. Staying on M2
theming — M3 would change the rendered design system.

### Toolchain pins the CLI does not manage

`ng update` leaves the test-tooling pins alone, so they were still on their Angular 14
values. Bumped by hand to the versions the v18 schematics generate:
`@types/node` 16.18.126 → 20.14.10, `@types/jasmine` ~4.0.0 → ~5.1.0,
`jasmine-core` ~4.3.0 → ~5.1.0. `karma` ~6.4.0 / `karma-jasmine` ~5.1.0 were already current.
Tests re-run green after the Jasmine 5 bump (`toBeTrue`/`toBeFalse` are unaffected).

### `karma-jasmine-html-reporter` peer conflict on a clean install

Symptom — incremental installs were fine, but a from-scratch `rm -rf node_modules && npm ci`
failed:

```
npm error ERESOLVE could not resolve
While resolving: karma-jasmine-html-reporter@2.0.0
Found: jasmine-core@5.1.2
Could not resolve dependency: peer jasmine-core@"^4.0.0" from karma-jasmine-html-reporter@2.0.0
```

Cause — the Jasmine 5 bump above left `karma-jasmine-html-reporter@~2.0.0` in place, and that
release still declares a `jasmine-core@^4` peer.

Fix — `npm i -D karma-jasmine-html-reporter@~2.1.0` (the release that widened the peer to
Jasmine 5). Clean `npm ci` + `build:all` + `test:all` green afterwards.

### MDC theming tokens beat plain CSS declarations (found by runtime UI testing)

Symptom — two overrides compiled and matched their elements but rendered default Material
styling: outlined form fields drew `rgba(0,0,0,.38)` outlines instead of `#aab6cf`, and the
`secondary`/`ghost` buttons drew a white fill with a black label instead of transparent/navy.
Unit tests can't see this; it only showed up in the browser via computed styles.

Cause — MDC ships its own themed rules whose selectors are more specific than ours and which
read from CSS custom properties, e.g.

```css
.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mat-mdc-notch-piece {
  border-color: var(--mdc-outlined-text-field-outline-color, var(--mat-app-outline));
}
.mat-mdc-unelevated-button:not(:disabled) {
  background-color: var(--mdc-filled-button-container-color);
}
```

Pre-MDC Material had no such rules, so the old flat declarations used to win.

Fix — set the tokens rather than the properties, so MDC's own rules produce the brand values:
`--mdc-outlined-text-field-outline-color` on `.mat-mdc-form-field`, and
`--mdc-filled-button-container-color` / `--mdc-filled-button-label-text-color` on the button
variant classes. The button variant fill/label moved out of `button.component.scss` into the
global `overrides()` mixin for the same reason the other Material internals live there
(component-scoped styles can't outrank MDC's theme rules); the `inset` ring stays local.

General rule for this codebase: when restyling an MDC component, look for the token MDC reads
before writing a declaration of your own.

### Deliberately not adopted

Standalone components, the new control flow (`@if`/`@for`), signals, and the optional
`use-application-builder` migration the CLI offered. All are optional in v18; standalone-ifying
the library would change how consumers import it, which the API-stability constraint rules out.

Library peer ranges → `^18.2.0`.
