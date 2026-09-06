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
