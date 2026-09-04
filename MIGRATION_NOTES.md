# Angular 14 → 18 migration notes

Branch `devin/1788510387-angular-18-migration`, forked from tag `baseline-angular-14`.
One commit per green step. "Green" = the full gate, in this order, exit 0 and zero `ERROR`
lines in Karma output:

1. `ng build ui-components`
2. `ng test ui-components --watch=false --browsers=ChromeHeadless` (5 specs)
3. `ng build retail-banking`, `ng build wealth-portal`
4. `ng test retail-banking …` (3 specs), `ng test wealth-portal …` (2 specs)
5. `dist/ui-components/**/*.d.ts` diffed against the baseline build (public API check)
6. Visual probe of both built apps (screenshots + computed styles of themed elements + dialog)

Each step section below records: breakages (symptom → root cause → fix → evidence),
silent changes (compiled/passed but rendered or behaved differently), no-op or superseded
fixes, what did not break, and deviations from the plan.

## Step 0 — baseline (Angular 14.2.12, Node 16.20.2, TS 4.7.4)

Gate: GREEN. ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, 0 ERROR lines.
Bundles: retail-banking initial 602.93 kB (already over the 500 kB *warning* budget,
under the 1 MB error budget), wealth-portal 449.93 kB.

Visual baseline (1280px viewport, production builds) recorded for later comparison:
- `bofa-button`: `mat-flat-button mat-button-base`, radius 9999px, padding 0 22px,
  min-width 96px, height 36px, primary bg `rgb(1,33,105)`, 15px/600.
- `bofa-card`: `mat-card`, radius 12px, 1px `#e2e7f0` border, shadow
  `rgba(1,33,105,.07) 0 2px 10px`, padding 16px.
- `bofa-table th`: `mat-header-cell`, navy `rgb(1,33,105)`, 13px/600 uppercase,
  letter-spacing 0.52px, 2px navy bottom border, row height 54px, padding-left 24px.
- `bofa-text-input mat-form-field` (outline): 398 × 82.8px.
- Layout: `.summary-grid` 3 × 353px, `.panel-grid` 648px + 432px, gap 20px.
- Dialog (wealth-portal "Request rebalance"): `mat-dialog-container` 420px wide,
  radius 16px, padding 28px, pill buttons.

Breakages: none (baseline). Silent changes: none. Deviations: none.
