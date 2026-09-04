# digital-banking-web

Angular workspace for the customer-facing web frontends: Bank of America **Online Banking**
(`retail-banking`) and Merrill **Wealth Management** (`wealth-portal`), both built on the
shared **BofA Design System** component library (`@bofa/ui-components`).

> This repository is a representative reference application used for framework-migration
> rehearsals. It is not production code.

## Projects

| Project | Path | What it is |
|---|---|---|
| `ui-components` | `libs/ui-components` | `@bofa/ui-components` — the BofA Design System: shared components (button, card, text input, table, confirm dialog, datepicker) wrapping Angular Material with our theme |
| `retail-banking` | `apps/retail-banking` | Online Banking accounts dashboard (port 4200) |
| `wealth-portal` | `apps/wealth-portal` | Merrill portfolio page (port 4300) |

Both apps consume the library **as a built package**: the root `tsconfig.json` maps
`@bofa/ui-components` to `dist/ui-components`. The theme Sass, by contrast, is consumed
from library source.

## Toolchain

- **Node 20.18.1** (`.nvmrc` — run `nvm use`). Angular 18 requires Node 18.19+ / 20.11+ / 22.
- npm only (lockfile is `package-lock.json`); no yarn/pnpm.
- Angular 18.2.x, Angular Material 18.2.x (MDC components, M2 theme API), TypeScript 5.4.x — versions are
  pinned exactly in `package.json`; do not upgrade ad hoc. See `MIGRATION_NOTES.md` for the
  step-by-step record of the migration from 14.

## Build order constraint

**The library must be built before either app will compile or test.** The npm scripts
below encode this; if you bypass them, run `npm run build:lib` first. A "Cannot find
module '@bofa/ui-components'" error means `dist/ui-components` is missing or stale.

## Scripts

| Script | What it does |
|---|---|
| `npm run build:lib` | Build `ui-components` into `dist/ui-components` |
| `npm run build:apps` | Build both apps (requires the lib to be built) |
| `npm run build:all` | Lib, then both apps |
| `npm run test:all` | Build the lib, then run all three test suites headlessly |
| `npm run start:retail` | Build the lib, serve Online Banking on http://localhost:4200 |
| `npm run start:wealth` | Build the lib, serve the Merrill portal on http://localhost:4300 |

## Testing notes

Unit tests run on Karma + Jasmine with `ChromeHeadless` (works with current Chrome).
Every `karma.conf.js` sets `clearContext: true`; the schematic default of `false` makes
the Jasmine HTML reporter navigate after the run, which Karma logs as a spurious
"full page reload" ERROR. If the launcher ever hangs or crashes on a new machine,
install the pinned `puppeteer` contingency and point `CHROME_BIN` at its bundled
Chromium in each `karma.conf.js` (see `plans/02-applications.md`).

## Migration baseline

The tag `baseline-angular-14` marks the completed Angular 14 baseline. Migration
rehearsals branch from — and reset to — this tag.
