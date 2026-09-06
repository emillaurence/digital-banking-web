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
| `apps/*/.browserslistrc` | deleted | CLI v15 migration — files matched the v15 defaults. **Consequence:** the browser matrix now tracks the CLI default, which widened by v18 to `last 2 Chrome versions` (was 1) plus `last 2 Android major versions`. Same ES2022 output target either way; restore the files if the explicit v14 matrix must be pinned. |
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

## Phase 2 — MDC migration on v15 (Node 16.20.2 / Angular 15.2.10 / Material 15.2.9 / TS 4.9.5)

Command: `ng generate @angular/material:mdc-migration --components all --directory <dir>`,
run once per project directory. **Deviation:** `--directory .` is rejected by the schema
("must match format path") and an absolute path is accepted but matches nothing ("Nothing
to be done"), so the three project roots were passed one at a time; only
`libs/ui-components` produced changes (the apps contain no Material imports or classes).

### Loud (compile/test) — none at compile time; 4 assertions retargeted

Schematic changes: `legacy-*` imports → MDC entry points in `dialog.service.ts`,
`confirm-dialog.component.ts` and the three specs; `_theme.scss` mixins back to
`mat.core()` / `mat.all-component-typographies()` / `mat.all-component-themes()`; class
selectors renamed (`.mat-button-base`→`.mat-mdc-button-base`, `.mat-card`→`.mat-mdc-card`,
`table.mat-table`→`table.mat-mdc-table`, `th.mat-header-cell`→`th.mat-mdc-header-cell`,
`tr.mat-row`→`tr.mat-mdc-row`, `.mat-dialog-container`→`.mat-mdc-dialog-container`);
`_typography.scss` → `mat.define-typography-config` with 2018 level names
(`headline`→`headline-5`, `title`→`headline-6`, `subheading-2`→`subtitle-1`,
`body-1`→`body-2`). Again the schematic skipped `ui-components.module.ts`; it was
repointed by hand to `@angular/material/{button,card,dialog,form-field,input,table}`.
`grep -rn legacy libs apps` → no hits; the v17 precondition is met.

Assertion changes — same checks, same counts, new class names (the DOM truth changed,
not the behaviour under test):

| Spec | Before | After | Why |
|---|---|---|---|
| `button.component.spec.ts` | `toContain('mat-flat-button')` | `toContain('mat-mdc-unelevated-button')` | MDC renames the `mat-flat-button` host class; the attribute selector in the template is unchanged |
| `table.component.spec.ts` | `th.mat-header-cell` ×2, `tr.mat-row` ×2 | `th.mat-mdc-header-cell` ×2, `tr.mat-mdc-row` ×2 | MDC table cell/row classes |
| `apps/retail-banking/.../app.component.spec.ts` | `bofa-table tr.mat-row` ×5 | `bofa-table tr.mat-mdc-row` ×5 | same |
| `apps/wealth-portal/.../app.component.spec.ts` | `bofa-table tr.mat-row` ×5 | `bofa-table tr.mat-mdc-row` ×5 | same |

### Silent (CSS/layout) — regressions found by the screenshot/metrics diff and restored

1. **Dialog rendered as two boxes.** Symptom: a 16px-radius, 28px-padded shadow rectangle
   around a smaller 4px-radius white surface. Cause: MDC splits the dialog into a
   transparent `.mat-mdc-dialog-container` and an inner `.mdc-dialog__surface`; the
   previously dead `border-radius/padding` on the container (see Phase 0 finding) suddenly
   applied, and the shadow landed on the transparent wrapper. Fix: the override now targets
   `.mat-mdc-dialog-container .mdc-dialog__surface { box-shadow }` only; the never-rendered
   16px/28px declarations were dropped so the dialog matches the *rendered* baseline (420px
   wide, 4px radius). Evidence: `retail-dialog-open.png` baseline vs phase2; dialog height
   159→154px (retail), title now carries MDC's `0 24px 9px` padding instead of the container's 24px.
   The unrealised 16px/28px design intent remains a question for the design-system owners.
2. **Secondary/ghost buttons lost brand colour** (white bg, black text instead of
   transparent/navy). Cause: MDC's `.mat-mdc-unelevated-button:not(:disabled)` sets
   `background-color`/`color` from `--mdc-filled-button-*` tokens at higher specificity than
   `.bofa-button--secondary`. Fix: `button.component.scss` sets
   `--mdc-filled-button-container-color: transparent` and
   `--mdc-filled-button-label-text-color: #012169` on both variant classes. Evidence: metrics
   `button_secondary`/`dialog_ghost_button` colour+bg back to baseline values.
3. **Form-field text 15px→16px.** Cause: MDC form fields read the `body-1` level, which the
   schematic did not populate (legacy `body-1` became `body-2`). Fix: `$body-1` added to
   `_typography.scss` with the same 15px/24px level. Evidence: `text_input_input/font` 15px.
4. **Outline colour.** `.mat-form-field-outline` no longer exists; rewritten to
   `.mat-mdc-form-field.mat-form-field-appearance-outline .mdc-notched-outline__{leading,notch,trailing} { border-color: #aab6cf }`.
   Evidence: outline border `1px solid rgb(170,182,207)` ✓.
5. `.mat-calendar-body-selected` is unchanged — the datepicker is not part of the MDC
   migration; selected-cell metrics identical to baseline.

### Silent — MDC density/typography differences left for human judgement (not auto-fixed)

| Surface | Baseline (legacy) | Phase 2 (MDC) | Note |
|---|---|---|---|
| Card | 16px padding on `.mat-card`; header text inset 32px vs content 16px | padding moves to header/content (16px each); title/subtitle now flush with content | Card 126→115px tall. Title and body now left-aligned with each other (was a 16px offset). |
| Table cells | `0 0 0 24px` padding, 48px rows | `0 16px` padding, 52px rows | Table 296→316px tall; columns still aligned with each other. Header bottom border/uppercase/navy intact. |
| Table/card text colour | `rgba(0,0,0,.87)` (theme foreground) | inherits app body `#1c2540` | MDC table/card no longer force the theme text colour. |
| Card content font | 15px (legacy `body-1`) | 16px (inherits body) | MDC card content has no typography level. |
| Form field | 83px incl. subscript, 17px input line | 78px, 24px input line, hint subscript 22px | Hint "Daily limit" sits ~5px closer to the next field; no overlap. |
| Datepicker toggle | 38×38 | 48×48 (`mat-mdc-icon-button`, 12px padding) | Still centred in the 56px field. |
| Buttons | line-height 36px | `normal`; height still 36px | No visible change. |
| Ripple/shadow | flat button carried a 0-px `box-shadow` triple | `none` | Not visible. |

Alignment check: no element pairs that were aligned in the baseline are misaligned now;
two pairs that were *mis*aligned in the baseline (card title vs card body, card title vs
payment fields) now line up. Row hover `#f2f5fb`, header border and uppercase header
styling unchanged.

### Public API

`.d.ts` public surface identical to v14 except `declare type` → `type` (TS emit). The
`legacy-*` import paths from Phase 1 have reverted to the standard entry points, so the
dialog `.d.ts` files are byte-identical to baseline again.

### Evidence

- `build:lib` OK; `build:apps` OK — retail main 573.13 kB, wealth 385.19 kB (MDC CSS is
  larger; wealth now also trips the pre-existing 500 kB *warning* budget: 527 kB initial).
- Tests ChromeHeadless 137: 5/5, 3/3, 2/2, 0 ERROR lines. `clearContext: true` untouched.
- Screens + metrics: `~/migration-artifacts/screens/phase2/`.
- Tooling: `ng-packagr` wipes `dist/` on each lib build, which leaves a running `ng serve`
  in a permanent "Can't resolve @bofa/ui-components" state — dev servers must be restarted
  after every `build:lib` (`~/migration-artifacts/serve.sh`). Not a repo issue.

## Phase 3 — Angular 15→16 (Node 16.20.2 / Angular 16.2.12 / Material 16.2.14 / TS 5.1.6)

Commands: `ng update @angular/core@16 @angular/cli@16` (zone.js 0.11.8→0.13.3, ng-packagr
16.2.3, build-angular 16.2.16; all four core/cli migrations "No changes made"), then
`ng update @angular/material@16 --allow-dirty` (CDK/Material 16.2.14, no code changes).
TypeScript pinned to 5.1.6 — the top of the v16 window `>=4.9.3 <5.2.0`, so the v17 jump
to 5.2 is a single minor. `.nvmrc` unchanged: 16.20.2 is inside `^16.14.0`. Library
peerDependencies → `^16.2.0`.

### Loud — none. Builds and all three suites passed on the first run.

### Silent (CSS) — 1 regression restored

- **Outline colour reverted to Material grey.** Symptom: `text_input_outline/border`
  `rgb(170,182,207)` → `rgba(0,0,0,.38)`. Cause: Material 16 paints the outlined
  text-field border from the `--mdc-outlined-text-field-outline-color` token via
  `.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading`,
  which outranks the Phase 2 `border-color` rule. Fix: `_theme.scss` now sets that token
  (rest state only, matching the baseline which never styled hover/focus) on
  `.mat-mdc-form-field.mat-form-field-appearance-outline`; the `border-color` rule is kept
  as a fallback. Evidence: metric back to `1px solid rgb(170,182,207)`.

### Silent — framework change, no action

- Table row text colour `#1c2540` (inherited, Phase 2) → `rgba(0,0,0,.87)`: Material 16
  re-applies the theme foreground to `.mat-mdc-table` cells. This is the **baseline** value,
  so the Phase 2 density-table entry "table text colour inherits body" no longer applies.
  Card text still inherits `#1c2540`.
- No other metric moved between Phase 2 and Phase 3 (buttons, cards, dialog, datepicker,
  hover, calendar all identical).

### Public API

`.d.ts`: `ɵcmp` input metadata gains v16 `{ alias, required: false }` objects (compiler
emit). Public surface still only differs from v14 by `declare type` → `type`.

### Evidence

- `build:lib` OK; `build:apps` OK (retail main 589.89 kB, wealth 379.96 kB; wealth budget
  *warning* 707 kB > 500 kB pre-existing warning-level budget, not an error).
- Tests ChromeHeadless 137: 5/5, 3/3, 2/2, 0 ERROR lines. `clearContext: true` intact ×3.
- Screens + metrics: `~/migration-artifacts/screens/phase3/`.

## Phase 4 — Angular 16→17 (Node 18.20.8 / Angular 17.3.12 / Material 17.3.10 / TS 5.4.5)

Precondition: `grep -rn legacy libs apps` → only a comment in `_typography.scss`; no
`@angular/material/legacy-*` imports remain (removed in Phase 2). `.nvmrc` → 18.20.8
(`^18.13.0`); `nvm install 18.20.8`. Commands: `ng update @angular/core@17 @angular/cli@17
--allow-dirty` (dirty only because of the `.nvmrc` edit) — it also raised TypeScript
itself to 5.4.5 (inside `>=5.2.0 <5.5.0`), zone.js → 0.14.10, ng-packagr 17.3.0;
then `ng update @angular/material@17 --allow-dirty`. Library peerDependencies → `^17.3.0`.

Migrations that changed files: **"Replace deprecated options in angular.json"** renamed
`browserTarget` → `buildTarget` on both apps' `serve` and `extract-i18n` targets. Builders
are unchanged: `build-angular:browser` ×2, `:karma` ×3, `:ng-packagr` ×1 — no
application-builder migration (per approval). Control-flow migration: "No changes made"
(it only escapes literal `@`/`}` in templates; none present). No standalone migration was run.

### Loud — none.
### Silent — none. `cmp.py phase3 phase4` → **0 differing metrics** across all captured
surfaces (buttons, cards, table header/rows/hover, text-input, datepicker, calendar,
dialog); screenshots visually identical. The grey pill behind the dialog's "Cancel" button
in both baseline and current shots is the focus overlay on the auto-focused ghost button,
not a background regression.

### Public API
Unchanged from Phase 3 (`declare type` → `type` only).

### Evidence
- `build:lib` OK; `build:apps` OK — retail main 607.26 kB, wealth 474.15 kB. Both apps
  now exceed the 500 kB *warning* budget (730 kB / 597 kB); the 1 MB error budget is not hit.
  Bundle growth is Material 17's token-based theming CSS; flagged for the owners, not changed.
- Tests ChromeHeadless 137: 5/5, 3/3, 2/2, 0 ERROR lines. `clearContext: true` intact ×3.
- Screens + metrics: `~/migration-artifacts/screens/phase4/`.

## Phase 5 — Angular 17→18 (Node 18.20.8 / Angular 18.2.14 / Material 18.2.14 / TS 5.5.4)

`.nvmrc` unchanged: 18.20.8 satisfies `^18.19.1`. Commands: `ng update @angular/core@18
@angular/cli@18` (build-angular/cli 18.2.21, ng-packagr 18.2.1, zone.js stays 0.14.10),
`ng update @angular/material@18 --allow-dirty`, then `npm i -D typescript@5.5.4
--save-exact` (top of `>=5.4.0 <5.6.0`; `ng update` had left 5.4.5). Library
peerDependencies → `^18.2.0`.

**Deviation / declined optional migration:** the CLI offered
`ng update @angular/cli --name use-application-builder`. Not run — browser builder retained
per approval. Core migrations (HTTP provider functions, afterRender phases, two-way binding
longform, `BootstrapContext`): all "No changes made".

Material 18 migration **did** rewrite the Sass theming API (3 files): `mat.define-palette`
→ `mat.m2-define-palette`, `mat.$red-palette` → `mat.$m2-red-palette`,
`mat.define-light-theme` → `mat.m2-define-light-theme`, `mat.define-typography-config` /
`-level` → `mat.m2-define-typography-config` / `-level`. The navy `#012169` / red
`#e31837` palettes and their hand-authored contrast maps are untouched; only the function
names changed (the M2 API is kept under the `m2-` prefix in v18; M3 was not adopted).

### Loud — none.
### Silent — 1 sub-pixel change, no action
- Calendar selected-cell font `13.3333px` → `13px` (Material 18 rounds the calendar body
  font-size token). Not perceptible; datepicker screenshot matches Phase 4.
- All other metrics identical to Phase 4 (`cmp.py phase4 phase5` → 1 differing metric).

### Public API
Unchanged (`declare type` → `type` only, since Phase 1).

### Evidence
- `build:lib` OK; `build:apps` OK — retail 607.47 kB, wealth 487.89 kB; both over the
  (now 512 kB-reported) warning budget, under the error budget.
- Tests ChromeHeadless 137: 5/5, 3/3, 2/2, 0 ERROR lines. `clearContext: true` intact ×3.
- Screens + metrics: `~/migration-artifacts/screens/phase5/`.

## Final state vs UPGRADE_PLAN

| | Plan | Actual |
|---|---|---|
| Angular / Material | 18.x | 18.2.14 / 18.2.14 |
| Node | 18.19+ | 18.20.8 (`.nvmrc`) |
| TypeScript | 5.4–5.5 | 5.5.4 |
| Builders | browser / karma / ng-packagr | unchanged |
| Legacy Material | removed by Phase 2 | none (`grep legacy` → comment only) |
| Public API | stable | stable (`type` emit change only) |
| Tests | 10 specs, 0 skipped | 5 + 3 + 2, all SUCCESS, none deleted/skipped |

Open items for human judgement (not auto-fixed): the MDC density table in Phase 2
(card padding model, 52px table rows, 78px form fields, 48px datepicker toggle), the
dialog's never-rendered 16px-radius/28px-padding design intent, and both apps exceeding
the 500 kB warning budget after MDC.
