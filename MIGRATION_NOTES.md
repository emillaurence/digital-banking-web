# MIGRATION_NOTES.md — digital-banking-web: Angular 14 → 18

Per-phase log of every breakage met during the migration described in `UPGRADE_PLAN.md`.
Loud (compile/test) and silent (CSS/layout) changes are recorded separately. Each entry uses the
same four-part format:

```
- **Symptom:** what was observed (error text, failing spec name, or which screenshot differs)
  **Cause:** the framework/Material change behind it (link the guide item or changelog line)
  **Fix:** the exact change made (file, before → after)
  **Evidence:** how it was confirmed fixed (command + exit code, spec count, screenshot pair)
```

Rules carried from `UPGRADE_PLAN.md` §7: tests are updated to the new truth, never weakened — a
rewritten assertion needs its rationale here; MDC **density** differences are reported for judgement,
not auto-fixed; broken **alignment** is a regression and must be restored. Each phase section is
closed only when its green gate (§6) holds and the commit is made.

---

## Phase 0 — Baseline (Angular 14, tag `baseline-angular-14`)

No framework change. Baseline captured: `npm ci` / `build:all` / `test:all` green on Node 16.20.2 (5 / 3 / 2 specs); `.d.ts` snapshot in `migration/baseline-dts/`; screenshots in `migration/baseline-screenshots/`.

**Green gate result:** PASSED — `build:all` exit 0, `test:all` exit 0 with no `ERROR` lines (5 / 3 / 2), `.d.ts` diff empty by construction, screenshots captured as the reference.

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---

## Phase 1 — 14→15 framework only (legacy Material)

`ng update @angular/core@15 @angular/cli@15` then `ng update @angular/material@15`; imports auto-rewritten to `legacy-*`. DOM must be unchanged.

**Green gate result:** _pending_ (build / 3 suites / `.d.ts` diff / visual)

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---

## Phase 2 — MDC migration on v15

`ng generate @angular/material:mdc-migration`; hand-rewrite `_theme.scss` selectors and the four spec assertions. Visual check is the arbiter.

**Green gate result:** _pending_ (build / 3 suites / `.d.ts` diff / visual)

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---

## Phase 3 — 15→16

`ng update @angular/core@16 @angular/cli@16` then `ng update @angular/material@16`.

**Green gate result:** _pending_ (build / 3 suites / `.d.ts` diff / visual)

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---

## Phase 4 — 16→17

Pre-gate: `grep -r "material/legacy-" libs apps` returns nothing; Node 20 installed and `.nvmrc` updated. `ng update @angular/core@17 @angular/cli@17` then `ng update @angular/material@17`.

**Green gate result:** _pending_ (build / 3 suites / `.d.ts` diff / visual)

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---

## Phase 5 — 17→18

`ng update @angular/core@18 @angular/cli@18` then `ng update @angular/material@18`.

**Green gate result:** _pending_ (build / 3 suites / `.d.ts` diff / visual)

### Loud changes (compile/test)

_Build or test failures — compiler errors, Sass compile errors, red specs, `ng update` refusals._

- _none recorded yet_

### Silent changes (CSS/layout)

_Anything the build and tests did not catch — dead selectors, density/spacing shifts, alignment breaks — found only by the visual check against `migration/baseline-screenshots/`._

- _none recorded yet_

### No-op fixes

_Changes applied that turned out to be unnecessary, or schematic edits that changed nothing observable. Record them so they are not repeated._

- _none recorded yet_

### Deviations from plan

_Any step taken that differs from `UPGRADE_PLAN.md` §4, with the reason._

- _none recorded yet_

---
