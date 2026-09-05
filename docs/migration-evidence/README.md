# Migration evidence (Angular 14 → 18)

Artifacts backing the claims in `../../MIGRATION_NOTES.md`. Nothing here is consumed by the build or tests.

## screenshots/
1280×900 captures of both apps (12 retail + 8 wealth surfaces + `metrics.json` of element geometry/computed styles), taken with `tools/capture.js` against the dev servers on :4200/:4300.

- `baseline-14/` — tag `baseline-angular-14`, the reference for every step.
- `15a/`, `15b/`, `16/`, `17/`, `18/`, `18-fix/` — capture after each green commit (`18-fix` = post-e2e hint-spacing fix).
- `15b-raw/` — raw output of the Material MDC schematic *before* the theme restoration; kept to show the silent regressions that 15b fixed.
- `<step>-diff/` — pixelmatch diffs of `<step>` against `baseline-14` (`summary.json` = differing pixel counts per surface).
- `<step>-vs-<prev>/` — pixelmatch diffs against the previous step (used to attribute Material-owned rendering changes).

## logs/
Per-step green-gate output (`tools/green.sh`): `build-*.log`, `test-*.log`, `serve-*.log`, `toolchain.log`, `compare.txt` (visual), `metrics.diff` (geometry vs baseline), `dts.diff` (public `.d.ts` vs the Angular 14 baseline `dist/ui-components`), `pkg-meta.diff`, `build-warnings.txt`. `green-<step>.out` is the gate's combined stdout; `green-*-ng-update-*.log` are the raw `ng update` schematic logs; `sanity-14/` is the baseline run on the tag. `18-fix/styles-*.json` are the computed-style dumps used to diagnose the hint-spacing regression.

Paths inside the logs are the originating machine's (`/home/ubuntu/...`); they map onto this folder as `visual/` → `screenshots/`, `green/` → `logs/`.

## tools/
The capture/compare/gate scripts (Node, `playwright-core` + `pixelmatch` + `pngjs`; `npm i` in this folder). Not wired into the workspace's `package.json`.
