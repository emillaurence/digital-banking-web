# digital-banking-web

Angular workspace for the customer-facing web frontends: Bank of America **Online Banking**
(`retail-banking`) and Merrill **Wealth Management** (`wealth-portal`), both built on the
shared **BofA Design System** component library (`@bofa/ui-components`).

> This repository is a representative reference application used for framework-migration
> rehearsals. It is not production code.

## Projects

| Project | Path | What it is |
|---|---|---|
| `ui-components` | `libs/ui-components` | `@bofa/ui-components` — the BofA Design System: shared components (button, card, text input, table, confirm dialog, datepicker) wrapping Angular Material 18 (MDC components) with our theme |
| `retail-banking` | `apps/retail-banking` | Online Banking accounts dashboard (port 4200) |
| `wealth-portal` | `apps/wealth-portal` | Merrill portfolio page (port 4300) |

Both apps consume the library **as a built package**: the root `tsconfig.json` maps
`@bofa/ui-components` to `dist/ui-components`. The theme Sass, by contrast, is consumed
from library source.

## Toolchain

- **Node 18.20.8** (`.nvmrc` — run `nvm use`). Angular 18 requires Node `^18.19.1 || ^20.11.1 || ^22.0.0`.
- npm only (lockfile is `package-lock.json`); no yarn/pnpm.
- Angular 18.2.x, Angular Material/CDK 18.2.x, TypeScript 5.5.x — versions are pinned exactly
  in `package.json`; do not upgrade ad hoc.
- Architecture deliberately retained through the migration: NgModules (no standalone),
  `@angular-devkit/build-angular:browser` (no esbuild application builder), Karma,
  `MatNativeDateModule`. Theming uses the Material 2 Sass API (`mat.m2-*`).

## Build order constraint

**The library must be built before either app will compile or test.** The npm scripts
below encode this; if you bypass them, run `npm run build:lib` first. A "Cannot find
module '@bofa/ui-components'" error means `dist/ui-components` is missing or stale.

## Scripts

| Script | What it does |
|---|---|
| `npm run build:lib` | Build `ui-components` into `dist/ui-components` |
| `npm run build:apps` | Build both apps (requires the lib to be built) |
| `npm run build:all` | Lib, then both apps (the gate used during migration is the explicit `build:lib` → `build:apps` pair) |
| `npm run test:all` | Build the lib, then run all three test suites headlessly |
| `npm run start:retail` | Build the lib, serve Online Banking on http://localhost:4200 |
| `npm run start:wealth` | Build the lib, serve the Merrill portal on http://localhost:4300 |

## Testing notes

Unit tests run on Karma + Jasmine with `ChromeHeadless` (works with current Chrome);
single project: `npx ng test <project> --watch=false --browsers=ChromeHeadless`.
Specs assert against MDC class names (`mat-mdc-unelevated-button`, `th.mat-mdc-header-cell`,
`tr.mat-mdc-row`).
Every `karma.conf.js` sets `clearContext: true`; the schematic default of `false` makes
the Jasmine HTML reporter navigate after the run, which Karma logs as a spurious
"full page reload" ERROR. If the launcher ever hangs or crashes on a new machine,
install the pinned `puppeteer` contingency and point `CHROME_BIN` at its bundled
Chromium in each `karma.conf.js` (see `plans/02-applications.md`).

## Migration baseline

The tag `baseline-angular-14` marks the completed Angular 14 baseline (Node 16.20.2 /
TS 4.7). Migration rehearsals branch from — and reset to — this tag; never move or
delete it. The 14 → 18 migration itself (one commit per major, MDC split into its own
commit) is documented phase by phase in `MIGRATION_NOTES.md`, including the accepted
MDC density differences and the restored brand overrides in
`libs/ui-components/src/styles/_theme.scss`.

Dev-server tip: `ng-packagr` wipes `dist/ui-components` on every `build:lib`, so restart
any running `ng serve` after rebuilding the library.
