# Migration notes — Angular 14 → 18

Workspace-wide migration (library + both consumer apps; see inspection report for why the
apps cannot stay on 14). One commit per green step. "Green" = `npm run build:lib`,
`ng test <project> --watch=false --browsers=ChromeHeadless` for all three projects with exact
spec counts (ui-components 5, retail-banking 3, wealth-portal 2) and no `ERROR` lines, then
`npm run build:apps` exit 0.

Visual evidence is gathered with a headless-Chrome probe (`probe.js`, kept outside the repo) that
records computed styles of the design-system elements on both served apps and diffs them against
the Angular 14 baseline served from a `baseline-angular-14` worktree.

## Baseline (Angular 14.2.12, Node 16.20.2)

```
npm run test:all  -> ui-components 5/5, retail-banking 3/3, wealth-portal 2/2, exit 0
npm run build:apps -> retail-banking Initial Total 602.93 kB (over 500 kB *warning* budget, pre-existing)
                      wealth-portal  Initial Total 449.93 kB
```

Pre-existing observation (not a migration issue, recorded so it isn't misattributed later): the
`.mat-dialog-container` override in `_theme.scss` (16px radius / 28px padding) does **not** win on
the baseline — probe reports `border-radius: 4px; padding: 24px` on the open dialog in wealth-portal.
Material's dialog container styles are component styles injected after the global theme, so the
equal-specificity override loses. Only the `box-shadow` override takes effect.

---

## Step 1 — Angular 14 → 15 (Material on Legacy modules)

Node 16.20.2. Commands: `ng update @angular/core@15 @angular/cli@15`, then `ng update @angular/material@15`.
Resulting versions: core/common/… 15.2.10, cli/build-angular 15.2.11, cdk/material 15.2.9,
ng-packagr 15.2.2, typescript 4.9.5.

### Breakages

1. **Material v15 schematic missed `ui-components.module.ts`**
   - Symptom: after `ng update @angular/material@15`, `dialog.service.ts` / `confirm-dialog.component.ts`
     / the three specs were rewritten to `@angular/material/legacy-*` imports, but `ui-components.module.ts`
     still imported the (now MDC) `MatButtonModule`, `MatCardModule`, `MatDialogModule`, `MatFormFieldModule`,
     `MatInputModule`, `MatTableModule`. Mixed state: `BofaDialogService` injects `MatLegacyDialog`, which
     the MDC `MatDialogModule` does not provide → `NullInjectorError` for every consumer of `UiComponentsModule`
     (both app specs and both apps at bootstrap). Caught by reading the schematic's file list before running
     tests, not by a failing run.
   - Root cause: the schematic walks the TypeScript programs it can find for the project. The library's build
     tsconfig lives under `architect.build.configurations` (not `options`), so only `tsconfig.spec.json` was
     found; it reaches files transitively imported by specs (`dialog.service.ts` → `confirm-dialog.component.ts`)
     but nothing imports the NgModule from a spec.
   - Fix: hand-edited `ui-components.module.ts` to the same `MatLegacy*Module as Mat*Module` aliasing the
     schematic used elsewhere (`MatDatepickerModule` and `MatNativeDateModule` have no legacy variant and
     are unchanged).
   - Evidence: `npm run test:all` → 5/5, 3/3, 2/2, exit 0, no ERROR lines.

### Silent changes (compiled/passed, but different)

- None found. Probe diff Angular 14 baseline → step 1 on both apps: only `ng-tns-c<N>` scope attributes differ
  (component-index dependent, not visual). Button/card/table/form-field/dialog computed styles, DOM class
  names, card count (5 / 4) and row count (5 / 5) identical.
- Migrations that changed files without behaviour change: `.browserslistrc` deleted in both apps (matched CLI
  default), `require.context` block removed from all three `test.ts` (CLI 15 discovers specs itself),
  `tsconfig.json` `target: ES2022` + `useDefineForClassFields: false` (IDE-only per the migration note;
  the CLI already compiled with these).

### No-ops / superseded

- The Material schematic inserted a multi-line `TODO(v15)` comment plus `mat.all-legacy-component-typographies`
  + `mat.legacy-core()` into `bofa-theme()`. Kept the two includes (they are the correct v15 legacy form),
  removed the TODO block and fixed indentation. No behaviour change (probe identical).

### Did not break

TypeScript 4.9 under the workspace strict flags, ng-packagr 15 partial build, Karma/Jasmine spec discovery
(counts unchanged), reactive-forms CVA components, theme SCSS compile.

### Deviation from plan

None.

### Evidence

```
npm run test:all   -> TOTAL: 5 SUCCESS / 3 SUCCESS / 2 SUCCESS, EXIT=0
npm run build:apps -> retail-banking Initial Total 663.32 kB (warning budget, +60 kB vs 14: legacy + MDC
                      styles both shipped by Material 15), wealth-portal 480.62 kB, EXIT=0
```

---

## Step 2 — Legacy → MDC Material components (still Angular 15.2 / Node 16.20.2)

Command: `ng generate @angular/material:mdc-migration` (all components, `libs/ui-components`; the schematic rewrote imports, specs and SCSS selectors and left `TODO(mdc-migration)` comments). Because
the Step 1 schematic had missed `ui-components.module.ts`, the module was reset to its baseline (already
non-legacy) form so the library never sat in a mixed Legacy/MDC state. No dependency versions change here;
this step exists so that MDC-caused differences can't be confused with framework-major ones.

### Breakages

1. **`BofaButtonComponent` spec — `mat-flat-button` class gone**
   - Symptom: `Expected [ 'mdc-button', 'mdc-button--unelevated', 'mat-mdc-unelevated-button', … ] to contain 'mat-flat-button'`.
   - Root cause: MDC renamed the host classes; `mat-flat-button` → `mat-mdc-unelevated-button`.
   - Fix (authorised assertion update, same check): `toContain('mat-mdc-unelevated-button')`. The test still
     proves the `mat-flat-button` directive is applied to the rendered `<button>`.
   - Evidence: `ng test ui-components` → 5/5 SUCCESS.
2. **`BofaTableComponent` spec + both app specs — `th.mat-header-cell` / `tr.mat-row` selectors match 0**
   - Symptom: `Expected 0 to be 2` (lib), `Expected 0 to be 5` (retail, wealth).
   - Root cause: MDC table cells/rows are `mat-mdc-header-cell` / `mat-mdc-row` (`mat-header-cell`/`mat-row`
     no longer emitted).
   - Fix (authorised): selectors → `th.mat-mdc-header-cell`, `tr.mat-mdc-row`, `bofa-table tr.mat-mdc-row`;
     expected counts unchanged (2 / 2 / 5 / 5).
   - Evidence: 5/5, 3/3, 2/2 SUCCESS.
3. **Secondary / ghost button variants rendered black-on-white (silent at test time, loud in the probe)**
   - Symptom: wealth `.bofa-button--secondary` computed `color: rgb(0,0,0)` / `background-color: rgb(255,255,255)`
     (baseline `rgb(1,33,105)` / transparent). The design-system outline ring (inset box-shadow) still drew, so
     the button was navy-ringed with black text. Same for the dialog's `Cancel` (ghost).
   - Root cause: MDC buttons paint colour via CSS custom properties — `.mat-mdc-unelevated-button:not(:disabled)
     { color: var(--mdc-filled-button-label-text-color) }` and `.mat-unthemed { --mdc-filled-button-label-text-color: #000 }`
     — from *component* styles inserted after our component style block; equal specificity, later wins.
   - Fix: `button.component.scss` now also sets the two tokens on the variant classes
     (`--mdc-filled-button-container-color: transparent; --mdc-filled-button-label-text-color: #012169`), keeping
     the plain `background`/`color` declarations as fallbacks.
   - Evidence (probe, wealth): secondary `color rgb(1,33,105)` / `bg rgba(0,0,0,0)`; dialog ghost
     `color rgb(1,33,105)` / `bg rgba(0,0,0,0)`; primary unchanged `rgb(255,255,255)` on `rgb(1,33,105)`.
4. **Form-field resting outline lost its `#aab6cf` colour**
   - Symptom: the schematic flagged the rule with `TODO(mdc-migration)`; probe showed the MDC outline at
     Material's default `rgba(0,0,0,.38)`.
   - Root cause: `.mat-form-field-outline` no longer exists; MDC draws the outline with
     `.mdc-notched-outline__{leading,notch,trailing}` borders. (v15 has no `--mdc-outlined-text-field-*` tokens
     yet — they arrive in v16/17, so a class-based override is the only option at this step.)
   - Fix: `.bofa-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__* { border-color: #aab6cf }`
     — specificity sits between Material's resting rule and its hover/focus rules, so hover (dark) and
     focus (primary) outlines are untouched, matching the legacy behaviour.
   - Evidence (probe, retail): `.mdc-notched-outline__leading` `border-bottom: 1px solid rgb(170, 182, 207)`.
5. **Dialog override moved to the wrong box**
   - Symptom: schematic rewrote `.mat-dialog-container` → `.mat-mdc-dialog-container` verbatim. On MDC the
     container is a transparent, padding-less wrapper around `.mat-mdc-dialog-surface`, so `padding: 28px` +
     our shadow produced a visible translucent halo 28px outside the white dialog (step2-wealth screenshot), and
     the surface kept Material's default black elevation shadow.
   - Root cause: MDC split container (layout) from surface (paint).
   - Fix: override is now `.mat-mdc-dialog-container .mdc-dialog__surface.mat-mdc-dialog-surface { box-shadow: … }`
     (three classes to out-rank the dialog's component-level elevation rule, which is injected after the theme).
     The never-effective `border-radius: 16px` / `padding: 28px` were dropped rather than ported — see baseline
     note: they did not render on Angular 14 either, so porting them would have *changed* the UI.
   - Evidence (probe, wealth): dialog surface `box-shadow: rgba(1, 33, 105, 0.25) 0px 12px 40px 0px`, identical
     to baseline; `border-radius: 4px` identical to baseline.
6. **Body text in form fields grew 15px → 16px**
   - Symptom: probe `form-field.font-size` and `text-input.font-size` `15px → 16px`.
   - Root cause: the schematic mapped legacy `$body-1` (15px, used by inputs) to `$body-2`, but MDC form-field
     and dialog body text read `body-1`, which fell back to Material's default 16px.
   - Fix: `_typography.scss` defines `$body-1` **and** `$body-2` as the 15px/24px level.
   - Evidence (probe, retail): `text-input.font-size 15px`, no longer in the diff.

### Silent changes (compiled/passed, but different) — reported, not fought

All measured with the probe, Angular 14 baseline → this step, both apps unless noted. None affects tests.

| Element | Baseline | MDC | Notes |
|---|---|---|---|
| `mat-card` padding / height | `16px` / 126px | `0px` / 115px | MDC pads header+content (16px each) instead of the card; title moves 16px left (x 123→107), lines up with content. Density change. |
| `mat-card-title` line box | 24px | 28px | MDC card title uses headline-6 line-height 28px. |
| Table cell padding | `0 0 0 24px` | `0 16px` | MDC data-table default; last column now has right padding. |
| Table row height | 48px | 52px | MDC default row height. |
| Table header/cell `background-color` | transparent | `#fff` | MDC paints cells; invisible on white cards. |
| Table/card/form-field `color` | `rgba(0,0,0,.87)` | `rgb(28,37,64)` | Legacy components set `.87` black themselves; MDC inherits the app's body colour. Text is now the design-system navy-black rather than Material grey-black. |
| `<input>` box height | 16.9px | 24px | MDC input line-height; form-field overall 83px → 78px. |
| Dialog padding | 24px on container | 0 on container; 24px on title/content/actions | Same visual inset, different DOM. |
| Primary button `box-shadow` | three `0 0 0 0` layers | `none` | Zero-size shadow → none: no visible change. |
| Material DOM classes | `mat-*` | `mat-mdc-*` + `mdc-*` | Not public API; only our own specs asserted on them (fixed above). |

Counts unchanged: cards 5 / 4, rows 5 / 5, buttons per page identical. No console errors in either app.

### No-ops / superseded

- Schematic's `.mat-mdc-dialog-container { border-radius: 16px; padding: 28px }` (a literal rename of the legacy
  rule) — superseded by the surface-targeted shadow-only rule (breakage 5). Porting the padding/radius was
  attempted first; it produced the halo and is what the `step2-wealth` screenshot shows.
- First dialog-shadow fix used `.mat-mdc-dialog-container .mat-mdc-dialog-surface` (two classes) — compiled,
  no effect (component-level elevation rule injected later at equal specificity). Superseded by the three-class
  selector.
- Schematic's `TODO(mdc-migration)` comments removed once each flagged rule was resolved.
- `mat.all-component-typographies` / `mat.core()` / `mat.all-component-themes` written by the schematic kept as-is.

### Did not break

Library build (ng-packagr), `BofaDialogService.confirm()` contract and its 2 specs (`MatDialog` from
`@angular/material/dialog` replaces `MatLegacyDialog`, same `afterClosed()` shape), reactive-forms CVA on
text-input/datepicker, datepicker (never had a legacy variant), theme Sass compile, app bootstrap.

### Deviation from plan

Four style fixes (breakages 3–6) go beyond "rename selectors". Justification: each restores a *design-system
intent that rendered on Angular 14* (navy secondary/ghost buttons, `#aab6cf` outline, navy dialog shadow, 15px
body) rather than normalising MDC density. Density/padding/row-height differences were deliberately left as-is
and are tabled above for review.

### Evidence

```
npm run test:all   -> ui-components 5/5 SUCCESS, retail-banking 3/3 SUCCESS, wealth-portal 2/2 SUCCESS, EXIT=0, 0 ERROR lines
npm run build:apps -> retail-banking Initial Total 715.48 kB (warning budget; +52 kB vs step 1: MDC component
                      CSS is heavier), wealth-portal 527.54 kB (now also over the 500 kB warning budget; both
                      far under the 1 MB error budget), EXIT=0
```

---

## Step 3 — Angular 15 → 16 (Node 16.20.2)

Commands: `ng update @angular/core@16 @angular/cli@16`, then `ng update @angular/material@16 --allow-dirty`
(`--allow-dirty` only because the first update's `package.json`/lock changes were intentionally left
uncommitted so both updates land in this one commit). Resulting versions: core/common/… 16.2.12,
cli/build-angular 16.2.16, cdk/material 16.2.14, ng-packagr 16.2.3, zone.js 0.13.3; TypeScript stays 4.9.5
(inside v16's `>=4.9.3 <5.2` range).

Migrations run: `defaultProject` removal, `defaultCollection`→`schematicCollections`, server-builder
`buildOptimizer`, guard/resolver interface removal, `moduleId` removal — all "No changes made" (nothing in
this workspace used them). CDK/Material v16 migrations: no changes.

### Breakages

None. First run of the full sequence was green.

### Silent changes (compiled/passed, but different)

- **Table text colour** (both apps): `tr.mat-mdc-row` computed `color` `rgb(28,37,64)` (step 2) →
  `rgba(0,0,0,.87)`. Material 16 moved table colours to tokens (`--mat-table-row-item-label-text-color`,
  set by `mat.all-component-themes` to the theme foreground) so the MDC table once again paints its own
  text colour instead of inheriting the app's navy-black body colour. This is the *Angular 14 baseline*
  value returning — step 2's navy rows were the transient state. Reported, not fought.
- `ng-tns-c<N>` scope attribute values changed (v16 hashes component ids) — not visual.
- Everything else in the probe (buttons incl. secondary/ghost tokens, cards, table geometry, form-field
  outline `#aab6cf`, 15px inputs, dialog surface shadow) is byte-identical to step 2.

### No-ops / superseded

None.

### Did not break

Library partial build under ng-packagr 16, all 10 specs (Karma builder discovery unchanged), MDC theme
Sass under Material 16 (no deprecation output), CVA form components, app bootstrap.

### Deviation from plan

None.

### Evidence

```
npm run test:all   -> ui-components 5/5 SUCCESS, retail-banking 3/3 SUCCESS, wealth-portal 2/2 SUCCESS, EXIT=0, 0 ERROR lines
npm run build:apps -> retail-banking Initial Total 707.33 kB (warning budget), wealth-portal 497.40 kB
                      (back under the 500 kB warning), EXIT=0
```

---

## Step 4 — Angular 16 → 17, Node 16.20.2 → 20.18.1

Node switched first (`nvm install 20.18.1 && nvm use 20.18.1`; Angular 17 requires ^18.13 || ^20.9), then
`ng update @angular/core@17 @angular/cli@17` (the CLI installs a temporary 17.3.17 CLI to run the update),
then `ng update @angular/material@17 --allow-dirty`. Resulting versions: core/common/… 17.3.12,
cli/build-angular 17.3.17, cdk/material 17.3.10, ng-packagr 17.3.0, **typescript 5.4.5** (was 4.9.5),
zone.js 0.14.10. `.nvmrc` → `20.18.1`; README toolchain section updated.

Migrations run: `@nguniversal` → `@angular/ssr` (n/a), deprecated `angular.json` options
(**1 file modified**: `browserTarget` → `buildTarget` in both apps' `serve` and `extract-i18n` targets —
option rename only, the `browser`/`dev-server` builders are unchanged as planned), `browser-sync` (n/a),
control-flow `@`/`}` entity escaping (no changes: no templates contain literal `@` or `}`), `TransferState`
import move (n/a), `useJit`/`missingTranslation` removal (n/a), invalid two-way binding longform (n/a).
CDK/Material v17: no changes.

### Breakages

None. TypeScript 5.4 under the workspace's strict flags compiled the library and both apps without edits.

### Silent changes (compiled/passed, but different)

- Probe diff step 3 → step 4, both apps: **no computed-style differences**. Only `ng-tns-c<hash>` values and
  one new class on the open dialog container (`mat-mdc-dialog-container-with-actions`, Material 17 adds it
  when `mat-dialog-actions` is present; no style attached in our theme).
- Bundle sizes grew (retail 707 → 730 kB, wealth 497 → 597 kB initial) — wealth is now also over the 500 kB
  *warning* budget. Both remain well under the 1 MB *error* budget, so no budget change per the approved
  plan. Warnings are not red.

### No-ops / superseded

None.

### Did not break

Library partial build under ng-packagr 17 / TS 5.4, all 10 specs on Karma builder 17 under Node 20,
MDC theme Sass under Material 17 (no deprecation output), CVA form components, `browser` builder apps.

### Deviation from plan

None (Node 20.18.1 at this step was the plan).

### Evidence

```
node -v            -> v20.18.1
npm run test:all   -> ui-components 5/5 SUCCESS, retail-banking 3/3 SUCCESS, wealth-portal 2/2 SUCCESS, EXIT=0, 0 ERROR lines
npm run build:apps -> retail-banking Initial total 730.28 kB (warning budget), wealth-portal 597.17 kB (warning budget), EXIT=0
```

---

## Step 5 — Angular 17 → 18 (Node 20.18.1)

Commands: `ng update @angular/core@18 @angular/cli@18`, then `ng update @angular/material@18 --allow-dirty`.
Resulting versions: core/common/… 18.2.14, cli/build-angular 18.2.21, cdk/material 18.2.14, ng-packagr 18.2.1;
TypeScript stays 5.4.5 (inside v18's `>=5.4 <5.6`), zone.js stays 0.14.10. Library `peerDependencies`
bumped `^14.2.0` → `^18.2.0` for `@angular/{common,core,forms,cdk,material}` (`rxjs ^7.5.0` unchanged).
README toolchain section updated to Angular 18.

Migrations run — `@angular/cli`: the *optional* `use-application-builder` migration was offered and **not run**
(builders stay `browser` / `ng-packagr` / `karma` per plan). `@angular/core`: invalid two-way binding
longform, `HttpClientModule` → `provideHttpClient`, `afterRender` phase API, `BootstrapContext` in
`main.server.ts` — all "No changes made". `@angular/material` v18: **3 files modified** —
`_palettes.scss`, `_theme.scss`, `_typography.scss`: `mat.define-palette` → `mat.m2-define-palette`,
`mat.$red-palette` → `mat.$m2-red-palette`, `mat.define-light-theme` → `mat.m2-define-light-theme`,
`mat.define-typography-config/-level` → `mat.m2-define-…`. Pure rename of the 2018 (M2) theming API so
it can coexist with the new M3 API; no values changed.

### Breakages

None.

### Silent changes (compiled/passed, but different)

- Probe diff step 4 → step 5, both apps: **no computed-style differences**. Only `ng-tns-c<hash>` values and
  one new structural class on the form-field outline pieces (`mat-mdc-notch-piece` alongside
  `mdc-notched-outline__leading`). Our `#aab6cf` outline override still targets the `mdc-notched-outline__*`
  classes, which are still present, and the probe confirms `border-bottom: 1px solid rgb(170, 182, 207)`.
- Budget reporting: CLI 18 prints the 500 kB budget as `512.00 kB` (it now reports in KiB). Same configured
  budget; retail 736.49 kB and wealth 616.90 kB initial are both over the *warning* budget and far under the
  1 MB *error* budget → no budget change.
- No console errors in either app.

### No-ops / superseded

None.

### Did not break

Library partial build under ng-packagr 18, all 10 specs under Karma builder 18, M2 theme Sass after the API
rename (no deprecation output), CVA form components, `browser` builder apps.

### Deviation from plan

None. Optional application-builder migration deliberately declined (plan item 5).

### Evidence

```
node -v            -> v20.18.1
npm run test:all   -> ui-components 5/5 SUCCESS, retail-banking 3/3 SUCCESS, wealth-portal 2/2 SUCCESS, EXIT=0, 0 ERROR lines
npm run build:apps -> retail-banking Initial total 736.49 kB (warning budget), wealth-portal 616.90 kB (warning budget), EXIT=0
```

---

## Wrap-up: public API and cumulative visual delta (Angular 14 → 18)

**Public API is unchanged.** `git diff baseline-angular-14 -- libs/ui-components/src/public-api.ts
libs/ui-components/src/lib/**/*.component.ts libs/ui-components/src/lib/dialog/dialog.service.ts
libs/ui-components/src/lib/**/*.html` is empty: every exported symbol (`UiComponentsModule`, the six `Bofa*`
components, `BofaDialogService`, `BofaTableColumn`, `BofaConfirmDialogData`), selector, `@Input`, CVA
behaviour and the `confirm(): Observable<boolean>` contract are byte-identical to the baseline. The Step 1/2
edits to `dialog.service.ts` / `confirm-dialog.component.ts` (legacy imports, then back) net to zero. The only
source changes in the library are `ui-components.module.ts` (net zero as well), SCSS, and the spec
DOM-class assertions. Consumers (`apps/*/app.module.ts`, `app.component.ts/html`, `styles.scss` via
`bofa.bofa-theme()`) were not edited except for their two spec selectors.

**Cumulative silent visual delta vs Angular 14** (all introduced at Step 2 by MDC; steps 3–5 added nothing).
For the user to accept or reject:

| Element | Angular 14 | Angular 18 |
|---|---|---|
| Card padding / height | 16px / 126px | ~~0 (header+content 16px each) / 115px~~ → 16px / 126px (restored, see Post-review 1) |
| Card title line box | 24px | ~~28px~~ → 24px (restored, see Post-review 1) |
| Table cell padding | `0 0 0 24px` | ~~`0 16px`~~ → `0 0 0 24px` (restored, see Post-review 2) |
| Table row height | 48px | ~~52px~~ → 48px (restored, see Post-review 2) |
| Table cell background | transparent | white (invisible on white cards) |
| Card / form-field text colour | `rgba(0,0,0,.87)` | inherits app body `#1c2540` |
| Table text colour | `rgba(0,0,0,.87)` | `rgba(0,0,0,.87)` (navy at step 2 only; v16 tokens restored it) |
| `<input>` box height / form-field height | 16.9px / 83px | 24px / ~~78px~~ → 83px footprint (restored, see Post-review 2; the MDC input box itself stays 56px) |
| Dialog inset | 24px on container | 24px on title/content/actions |

Everything else the design system specifies (pill buttons, navy primary / navy-on-transparent secondary
and ghost, card radius/border/shadow, uppercase navy table headers with 2px rule, `#aab6cf` outline,
15px body, dialog shadow, calendar selected ring) renders identically to the baseline.

## Post-review 1 — restore legacy card geometry (Angular 18, separate commit)

User reviewed the Step 2 card density diff (screenshots of retail-banking) and rejected it: with MDC's
layout the "Make a payment" panel no longer aligned with "Recent transactions", the title lost its 16px
inset and the header→content gap disappeared. Decision: restore the legacy geometry in the design-system
overrides (`.mat-mdc-card.bofa-card` in `_theme.scss`), not in Material.

### Breakage (user-judged visual regression, no test involved)

- Symptom: cards 115px tall instead of 126px; title/subtitle flush with content (x 107 vs 123); form starts
  directly under the subtitle (y 376 vs 401 in the screenshot); subtitle 14px/22px instead of 15px/normal.
- Root cause: legacy `mat-card` = `padding:16px`, `.mat-card-header-text{margin:0 16px}`,
  `.mat-card-header .mat-card-title{margin-bottom:12px}`, `.mat-card-subtitle{margin:-8px 0 16px}`,
  subtitle typography body-1 15px. MDC `mat-card` = `padding:0`, header `padding:16px 16px 0`, content
  `padding:0 16px` (+16px bottom when last), no header margins, subtitle typography subtitle-2 14px/22px.
- Fix (`libs/ui-components/src/styles/_theme.scss`):
  ```scss
  .mat-mdc-card.bofa-card {
    padding: 16px;
    .mat-mdc-card-header { padding: 0; }
    .mat-mdc-card-header-text { margin: 0 16px; }
    .mat-mdc-card-title { margin-bottom: 12px; line-height: normal; }
    .mat-mdc-card-subtitle { margin: -8px 0 16px; font-size: 15px; line-height: normal; }
    .mat-mdc-card-content { padding: 0; }
  }
  ```
- Evidence: geometry probe (offsets relative to card top) on the Angular 14 worktree vs this branch, retail:
  ```
  base14: card 126  header y17 h61  title y17 h24  subtitle y45 h17 fs15  content y78 h31
  fixed : card 126  header y17 h61  title y17 h24  subtitle y45 h17 fs15  content y78 h31
  ```
  `compare.py base14-retail fix-retail` / `base14-wealth fix-wealth`: the `card.padding`, `card.height`,
  `card.size`, `card-title.height/size` lines have dropped out of the diff; remaining card lines are the
  `mat-mdc-*` class names and the body-colour inheritance (`rgba(0,0,0,.87)` → `#1c2540`) already tabled.

### No-ops / superseded

- First attempt set `.mat-mdc-card-title{line-height:24px}` and left the subtitle at MDC's 14px/22px:
  card came out 131px (5px too tall). Superseded by `line-height:normal` on both and `font-size:15px`
  on the subtitle, which is what legacy actually rendered (legacy card title/subtitle had no explicit
  line-height; the subtitle inherited the 15px body size).

### Did not break

Tests 5/5, 3/3, 2/2; both apps build; no other computed-style line changed in the probe diff.

### Deviation from plan

The plan said "report MDC density diffs, don't fight them"; this reverses one of them on explicit user
instruction. Table density (52px rows, `0 16px` cell padding) and the other tabled diffs are still
left as reported.

## Post-review 2 — re-align the retail panel pair (table density + form-field footprint)

After Post-review 1 the user asked for "Recent transactions" and "Make a payment" to be aligned. Their
bottoms were 34px apart (411px vs 377px cards; baseline 391px / 391px): MDC rows are 52px instead of 48px
(+20px over five rows) while MDC outline form-fields are 78px instead of 83px (−15px over three fields),
so the two panels drifted in opposite directions. Restored both footprints in `_theme.scss`.

### Breakage (user-judged visual regression, no test involved)

- Symptom: panel cards 411px / 377px; table rows 52px with `0 16px` cell padding; form-fields 78px.
- Root cause: MDC data-table token `--mat-table-row-item-container-height` defaults to 52px and cells to
  `0 16px`; legacy rows were 48px with `0 0 0 24px`. MDC outline form-field = 56px box + 22px subscript,
  no outer margin; legacy = ~55px box + 1.34375em subscript padding + `.25em 0` wrapper margin = 82.78px.
- Fix:
  ```scss
  table.mat-mdc-table.bofa-table {
    --mat-table-row-item-container-height: 48px;
    th.mat-mdc-header-cell, td.mat-mdc-cell { padding: 0 0 0 24px; }
  }
  .bofa-field.mat-mdc-form-field {
    margin: 0.25em 0;
    .mat-mdc-form-field-subscript-wrapper { height: 19.25px; }  // 56 + 19.25 + 7.5 = 82.75px
  }
  ```
- Evidence: panel geometry probe, retail (y / height):
  ```
  base14: cards [321,391] [321,391]  tr 48  td '0 0 0 24px'  form children y 399/486/572/659  form 296
  fixed : cards [321,391] [321,391]  tr 48  td '0 0 0 24px'  form children y 399/486/572/659  form 296
  ```
  `compare.py base14-retail fix2-retail`: `table-row.height`, `table-cell.padding`, `table-header.padding`
  lines dropped out of the diff. Header row stays 56px (legacy `th` was 54px inside a 56px row; same row).

### No-ops / superseded

- `--mat-form-field-subscript-text-line-height: 1.3em` — the subscript band is a 16px inline-block spacer
  plus the hint line box, so line-height alone gave 21px (field 84.5px). Superseded by an explicit height.
- `.mat-mdc-form-field-subscript-wrapper { height: 1.285em }` — `em` there resolves against the 12px
  subscript font, giving 15px (field 79px). Superseded by `19.25px`.

### Did not break

Tests 5/5, 3/3, 2/2; both apps build; hint text still renders (it overflows the shorter band by ~3px into
the 4px form gap, as the legacy absolutely-positioned hint did).

### Deviation from plan

Second reversal of a tabled MDC density diff, again on explicit user instruction. Remaining tabled diffs:
table cell background (white), inherited text colour, 24px input line box, dialog padding DOM location.
