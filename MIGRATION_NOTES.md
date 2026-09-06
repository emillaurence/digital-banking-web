# MIGRATION_NOTES.md — Angular 14 → 18

Working log for the phased migration described in `UPGRADE_PLAN.md` (on `main`).
Branch is cut from the `baseline-angular-14` tag; one commit per green phase.

Conventions used below:

- **Loud** = compile / `ng update` / test failure. **Silent** = CSS / layout / DOM change
  that build and tests do not catch (only the visual check does).
- Every breakage is recorded as *symptom → cause → fix → evidence*.
- "Green gate" = `npm run build:lib` → `npm run build:apps` → three Karma suites on
  ChromeHeadless (5 / 3 / 2 specs, `clearContext: true` kept) → `.d.ts` diff vs. the v14
  snapshot → screenshot/metric comparison against the Phase 0 baseline.

---

## Phase 0 — Baseline (Node 16.20.2 / Angular 14.2.12 / TS 4.7.4)

### Guide verification (done before Phase 1)

Sources: `angular.dev/reference/versions` (version-compatibility table), the update-guide
recommendation data that backs `angular.dev/update-guide` (`adev/src/app/features/update/recommendations.ts`,
the interactive page itself is JS-rendered and returns no static content), and the
Angular Material `v15-mdc-migration.md` guide (`angular/components@15.2.x/guides/`).

| Phase | Angular | Node (guide) | TypeScript (guide) | Drift from UPGRADE_PLAN §4 |
|---|---|---|---|---|
| 1–2 | 15.2.x | `^14.20.0 \|\| ^16.13.0 \|\| ^18.10.0` | `>=4.8.2 <5.0.0` | none (plan said 16.13+/18.10+, TS 4.8–4.9) |
| 3 | 16.2.x | `^16.14.0 \|\| ^18.10.0` | `>=4.9.3 <5.2.0` | none (plan: 4.9–5.1) |
| 4 | 17.3.x | `^18.13.0 \|\| ^20.9.0` | `>=5.2.0 <5.5.0` | none (plan: 5.2–5.4) |
| 5 | 18.2.x | `^18.19.1 \|\| ^20.11.1 \|\| ^22.0.0` | `>=5.4.0 <5.6.0` | patch-level only: guide floor is 18.19.**1** / 20.11.**1** (plan said 18.19+/20.11+) |

Schematic names confirmed: `ng update @angular/core@N @angular/cli@N`, `ng update @angular/material@N`,
`ng generate @angular/material:mdc-migration` (v15 only). Zone.js floors from the guide:
v16 → 0.13.x, v17 → 0.14.x (handled by `ng update`).

Node versions actually used: **16.20.2** for Phases 1–3 (inside every range), **18.20.8**
for Phases 4–5 (`.nvmrc` updated at each boundary).

### Baseline evidence

- Build: `build:lib` then `build:apps` pass (retail main 493.61 kB, wealth main 340.62 kB;
  retail already exceeds the 500 kB *warning* budget on v14 — pre-existing).
- Tests: ui-components 5/5, retail-banking 3/3, wealth-portal 2/2 on ChromeHeadless 137.
- `.d.ts` snapshot: 10 files from `dist/ui-components` saved outside the repo
  (`~/migration-artifacts/dts-baseline`) and compared with `diff -r` after each phase.
- Screenshots + computed-style metrics (Playwright driving headless Chrome, 1366×900):
  `retail-full`, `retail-card-summary`, `retail-card-panel-table`, `retail-table-header`,
  `retail-table-row-hover`, `retail-text-input`, `retail-datepicker`,
  `retail-datepicker-calendar`, `retail-button-primary`, `retail-payment-form`,
  `retail-dialog-open`, `wealth-full`, `wealth-card-*`, `wealth-table-*`,
  `wealth-button-secondary`, `wealth-dialog-open`. The metrics (radius, border, shadow,
  padding, size, colour, font) are what the per-phase comparison is diffed against.

Baseline reference values (v14, legacy DOM):

| Surface | Value |
|---|---|
| `bofa-card` | 12px radius, `1px solid #e2e7f0`, shadow `0 2px 10px rgba(1,33,105,.07)`, 16px padding, 126px tall summary card |
| `bofa-table th` | navy `#012169`, 13px/600, uppercase, letter-spacing .52px, `2px solid #012169` bottom border, 56px tall, 24px outer padding |
| `bofa-table td/tr` | 48px row height, `1px solid rgba(0,0,0,.12)` row divider, hover bg `#f2f5fb` |
| `bofa-text-input` / `bofa-datepicker` | outline colour `#aab6cf`, 83px field incl. subscript, 398px wide (100 % of card) |
| `bofa-button` | 36px tall, 9999px radius, `0 22px` padding; primary bg `#012169`/white; secondary transparent + `inset 0 0 0 1.5px #012169` |
| Dialog container | 420px wide, **4px radius, 24px padding**, shadow `0 12px 40px rgba(1,33,105,.25)` |
| Calendar selected cell | 36px, navy bg, ring `0 0 0 2px #f18c9b` |

**Pre-existing finding (not a migration regression):** the `.mat-dialog-container`
override in `_theme.scss` asks for `border-radius: 16px; padding: 28px`, but the baseline
renders 4px / 24px. Material's own dialog structural styles are emitted as component
styles (appended later in `<head>`) and win the cascade; only the `box-shadow` line takes
effect because the elevation comes from the theme mixin, which precedes `overrides()`.
The migration target is *the rendered baseline* (4px / 24px / shadow), so this dead CSS
is carried as-is and flagged for the design system owners rather than "fixed".

## Phase 1 — 14→15 framework on legacy Material (Node 16.20.2 / Angular 15.2.10 / Material 15.2.9 / TS 4.9.5)

Commands: `ng update @angular/core@15 @angular/cli@15`, then
`ng update @angular/material@15 --allow-dirty` (the second update refuses to run on the
dirty tree the first one leaves; `--allow-dirty` is the documented escape hatch — no
other effect). Node stays 16.20.2 (inside `^14.20 || ^16.13 || ^18.10`); TS pinned 4.9.5
(inside `>=4.8.2 <5.0`). Library peerDependencies bumped `^14.2.0` → `^15.2.0`.

### Loud (compile/test) — none

Nothing failed. Schematic output that changed code:

| File | Change | Why |
|---|---|---|
| `tsconfig.json` | `target: ES2022`, `useDefineForClassFields: false` | CLI v15 migration |
| `*/src/test.ts` (×3) | `require.context` block removed | CLI v15 migration — the karma builder now discovers specs itself. **No spec was removed**; counts unchanged 5/3/2. |
| `apps/*/.browserslistrc` | deleted | CLI v15 migration — files matched the new defaults |
| `dialog.service.ts`, `dialog.service.spec.ts`, `confirm-dialog.component.ts`, `button.component.spec.ts`, `table.component.spec.ts` | `@angular/material/<x>` → `@angular/material/legacy-<x>` with `MatLegacyX as MatX` aliases | Material v15 schematic keeps existing apps on the pre-MDC components |
| `_theme.scss` | `mat.core()` → `mat.legacy-core()` + explicit `mat.all-legacy-component-typographies(...)`; `all-component-themes` → `all-legacy-component-themes` | Material v15: legacy core no longer emits typography |
| `_typography.scss` | `define-typography-config` → `define-legacy-typography-config` | Material v15 (legacy levels `headline`/`title`/`subheading-2`/`body-1`/`button` still valid here) |

Manual (schematic did not touch it): `ui-components.module.ts` repointed to
`legacy-button`, `legacy-card`, `legacy-dialog`, `legacy-form-field`, `legacy-input`,
`legacy-table`. `MatDatepickerModule` and `MatNativeDateModule` have no legacy variant
and stay on `@angular/material/datepicker` / `core`. Schematic's 8-line TODO comment in
`_theme.scss` replaced with a one-liner and indentation restored.

### Silent (CSS/layout)

Computed-style diff phase1 vs baseline over all §6 surfaces: **card, table header, row
hover, text-input outline, button variants, dialog container, calendar selected cell are
byte-identical** (only `ng-tns-cNN` scope ids changed — noise).

One real difference, **datepicker toggle button**: v15's datepicker (which has no legacy
variant) already renders its toggle with the MDC icon button
(`mat-mdc-icon-button`, 40×40, `8px 0` padding) instead of `mat-icon-button` (38×38).
The icon shifts 2px left/up but stays vertically centred in the 56px outline field —
screenshots `retail-datepicker.png` baseline vs phase1 are indistinguishable. Alignment
intact → no fix; reported here for human judgement (it is the first MDC density change
to land, one phase early, and is upstream behaviour not under our control).

### Public API

`.d.ts` diff against the v14 snapshot: exported symbols, inputs, outputs and method
signatures unchanged. Differences are all tooling-internal and approved:
`declare type` → `type` (TS 4.9 emit), an extra `never` generic on `ɵɵComponentDeclaration`
(Angular 15 compiler metadata), and the `dialog.service.d.ts`/`confirm-dialog.component.d.ts`/
`ui-components.module.d.ts` import paths now referencing `@angular/material/legacy-*`
(intended by this phase; reverts to non-legacy in Phase 2).

### Evidence

- `build:lib` OK (8.0 s); `build:apps` OK — retail main 538.38 kB (v14: 493.61 kB; the
  pre-existing 500 kB *warning* budget is still a warning, not an error), wealth 355.68 kB.
- Tests ChromeHeadless 137: ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, 0 ERROR lines.
- `clearContext: true` untouched in all three `karma.conf.js`.
- Screens: `~/migration-artifacts/screens/phase1/` (18 PNGs + `metrics.json`).
