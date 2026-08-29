# 06 — Wealth portal consumes the library; final wiring

## Goal

`wealth-portal` is a themed **Merrill Wealth Management** portfolio page built from `@bofa/ui-components` (cards, holdings table, rebalance confirm dialog), root npm scripts encode the build/test ordering, a repo `README.md` documents the workspace, the full end-to-end verification passes, and the finished baseline is tagged `baseline-angular-14`.

Branding rules: Merrill is Bank of America's wealth management arm — the header is a **text wordmark** (no downloaded/embedded logos). Holdings use plausible generic US-market fund names, not real Merrill product names. All copy is US-locale: dollars, `en-US` formatting, US account-wrapper names (brokerage/IRA).

## Prerequisites

- Plan 05 done (retail-banking green). Node 16.20.2 active.
- Library built: `npx ng build ui-components`.

## Steps

1. **App module** — replace `apps/wealth-portal/src/app/app.module.ts` with:

   ```ts
   import { NgModule } from '@angular/core';
   import { BrowserModule } from '@angular/platform-browser';
   import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
   import { UiComponentsModule } from '@bofa/ui-components';

   import { AppComponent } from './app.component';

   @NgModule({
     declarations: [AppComponent],
     imports: [BrowserModule, BrowserAnimationsModule, UiComponentsModule],
     bootstrap: [AppComponent],
   })
   export class AppModule {}
   ```

2. **Component class** — replace `apps/wealth-portal/src/app/app.component.ts` with:

   ```ts
   import { Component } from '@angular/core';
   import { BofaDialogService, BofaTableColumn } from '@bofa/ui-components';

   @Component({
     selector: 'app-root',
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.scss'],
   })
   export class AppComponent {
     readonly summaryCards = [
       { title: 'Total portfolio value', subtitle: 'All accounts, as of today', amount: '$1,248,900' },
       { title: 'YTD performance', subtitle: 'Net of fees', amount: '+6.4%' },
       { title: 'Cash available', subtitle: 'Brokerage + IRA', amount: '$38,150' },
     ];

     readonly holdingColumns: BofaTableColumn[] = [
       { key: 'name', header: 'Holding' },
       { key: 'assetClass', header: 'Asset class' },
       { key: 'value', header: 'Value', align: 'right' },
       { key: 'weight', header: 'Weight', align: 'right' },
     ];

     readonly holdings: Record<string, unknown>[] = [
       { name: 'US Large-Cap Growth Fund', assetClass: 'Equities', value: '$512,300', weight: '41.0%' },
       { name: 'S&P 500 Index Fund', assetClass: 'Equities', value: '$287,450', weight: '23.0%' },
       { name: 'US Corporate Bond Fund', assetClass: 'Fixed income', value: '$224,800', weight: '18.0%' },
       { name: 'Global Real Estate Securities Fund', assetClass: 'Alternatives', value: '$186,200', weight: '14.9%' },
       { name: 'Cash & Money Market', assetClass: 'Cash', value: '$38,150', weight: '3.1%' },
     ];

     lastRebalanceRequest = '';

     constructor(private dialogs: BofaDialogService) {}

     requestRebalance(): void {
       this.dialogs
         .confirm({
           title: 'Request rebalance',
           message: 'Ask your advisor to rebalance this portfolio back to its target allocation?',
           confirmLabel: 'Send request',
         })
         .subscribe((confirmed) => {
           if (confirmed) {
             this.lastRebalanceRequest = new Date().toLocaleString('en-US');
           }
         });
     }
   }
   ```

3. **Template** — replace `apps/wealth-portal/src/app/app.component.html` with:

   ```html
   <header class="app-header">
     <span class="app-header__brand">Merrill</span>
     <span class="app-header__product">Wealth Management</span>
   </header>

   <main class="page">
     <h1>Your portfolio</h1>

     <section class="summary-grid">
       <bofa-card *ngFor="let card of summaryCards" [title]="card.title" [subtitle]="card.subtitle">
         <p class="summary-amount">{{ card.amount }}</p>
       </bofa-card>
     </section>

     <bofa-card title="Holdings" subtitle="Target allocation: 60/25/15">
       <bofa-table [columns]="holdingColumns" [data]="holdings"></bofa-table>
       <div class="holdings-actions">
         <p *ngIf="lastRebalanceRequest" class="holdings-actions__note">
           Rebalance requested {{ lastRebalanceRequest }} — your advisor will confirm within one business day.
         </p>
         <bofa-button variant="secondary" (click)="requestRebalance()">Request rebalance</bofa-button>
       </div>
     </bofa-card>
   </main>
   ```

4. **Styles** — replace `apps/wealth-portal/src/app/app.component.scss` with:

   ```scss
   .app-header {
     display: flex;
     align-items: baseline;
     gap: 12px;
     padding: 16px 32px;
     background: #012169;
     border-bottom: 3px solid #e31837;
     color: #fff;
   }

   .app-header__brand {
     font-size: 20px;
     font-weight: 700;
   }

   .app-header__product {
     opacity: 0.7;
   }

   .page {
     max-width: 1000px;
     margin: 0 auto;
     padding: 32px;
   }

   .summary-grid {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 20px;
     margin-bottom: 24px;
   }

   .summary-amount {
     margin: 0;
     font-size: 26px;
     font-weight: 700;
   }

   .holdings-actions {
     display: flex;
     justify-content: flex-end;
     align-items: center;
     gap: 16px;
     margin-top: 16px;
   }

   .holdings-actions__note {
     margin: 0;
     font-size: 13px;
     color: #4a5a80;
   }
   ```

5. **Spec** — replace `apps/wealth-portal/src/app/app.component.spec.ts` with:

   ```ts
   import { TestBed } from '@angular/core/testing';
   import { NoopAnimationsModule } from '@angular/platform-browser/animations';
   import { UiComponentsModule } from '@bofa/ui-components';
   import { AppComponent } from './app.component';

   describe('AppComponent', () => {
     beforeEach(async () => {
       await TestBed.configureTestingModule({
         imports: [NoopAnimationsModule, UiComponentsModule],
         declarations: [AppComponent],
       }).compileComponents();
     });

     it('creates the portfolio page', () => {
       const fixture = TestBed.createComponent(AppComponent);
       expect(fixture.componentInstance).toBeTruthy();
     });

     it('renders the holdings in the shared table', () => {
       const fixture = TestBed.createComponent(AppComponent);
       fixture.detectChanges();
       expect(fixture.nativeElement.querySelectorAll('bofa-table tr.mat-row').length).toBe(5);
     });
   });
   ```

6. **Root npm scripts** — in the root `package.json`, replace the `"scripts"` block with:

   ```json
   "scripts": {
     "ng": "ng",
     "build:lib": "ng build ui-components",
     "build:apps": "ng build retail-banking && ng build wealth-portal",
     "build:all": "npm run build:lib && npm run build:apps",
     "test:all": "npm run build:lib && ng test ui-components --watch=false --browsers=ChromeHeadless && ng test retail-banking --watch=false --browsers=ChromeHeadless && ng test wealth-portal --watch=false --browsers=ChromeHeadless",
     "start:retail": "npm run build:lib && ng serve retail-banking",
     "start:wealth": "npm run build:lib && ng serve wealth-portal"
   }
   ```

7. **Commit:**

   ```bash
   git add -A
   git commit -m "Build wealth-portal on ui-components and add workspace scripts"
   ```

8. **Repo README.** Replace the generated root `README.md` with the following. It is an internal engineering README — do not claim this is Bank of America's actual codebase, and do not embed brand logos.

   ````markdown
   # digital-banking-web

   Angular workspace for the customer-facing web frontends: Bank of America **Online Banking**
   (`retail-banking`) and Merrill **Wealth Management** (`wealth-portal`), both built on the
   shared **BofA Design System** component library (`@bofa/ui-components`).

   > This repository is a representative reference application used for framework-migration
   > rehearsals. It is not production code.

   ## Projects

   | Project | Path | What it is |
   |---|---|---|
   | `ui-components` | `libs/ui-components` | `@bofa/ui-components` — the BofA Design System: shared components (button, card, text input, table, confirm dialog, datepicker) wrapping Angular Material 14 with our theme |
   | `retail-banking` | `apps/retail-banking` | Online Banking accounts dashboard (port 4200) |
   | `wealth-portal` | `apps/wealth-portal` | Merrill portfolio page (port 4300) |

   Both apps consume the library **as a built package**: the root `tsconfig.json` maps
   `@bofa/ui-components` to `dist/ui-components`. The theme Sass, by contrast, is consumed
   from library source.

   ## Toolchain

   - **Node 16.20.2** (`.nvmrc` — run `nvm use`). Angular 14 does not support Node 18+.
   - npm only (lockfile is `package-lock.json`); no yarn/pnpm.
   - Angular 14.2.x, Angular Material 14.2.x, TypeScript 4.7.x — versions are pinned exactly
     in `package.json`; do not upgrade ad hoc.

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

   Unit tests run on Karma + Jasmine with `ChromeHeadless`. Recent Chrome versions removed
   the old headless mode that Angular 14's `karma-chrome-launcher` uses; if test runs hang
   or the launcher crashes, install the pinned `puppeteer` fallback and point `CHROME_BIN`
   at its bundled Chromium in each `karma.conf.js` (see `plans/02-applications.md`).

   ## Migration baseline

   The tag `baseline-angular-14` marks the completed Angular 14 baseline. Migration
   rehearsals branch from — and reset to — this tag.
   ````

   Commit it:

   ```bash
   git add README.md
   git commit -m "Add workspace README"
   ```

9. **Tag the baseline** — the restore point for repeated Angular 14 → 18 migration rehearsals; it will be used often:

   ```bash
   git tag baseline-angular-14
   git tag --list baseline-angular-14   # prints the tag name
   ```

   (Tag after the README commit so the tagged tree includes the README.)

## Verification

The full end-to-end check from `00-index.md`:

```bash
node -v              # v16.20.2
npm run build:all    # lib, then both apps — all exit 0
npm run test:all     # 5 lib specs + 3 retail specs + 2 wealth specs — all green
npm run start:retail # http://localhost:4200 — dashboard works incl. dialog round-trip
npm run start:wealth # http://localhost:4300 — Merrill portfolio; "Request rebalance" opens the dialog,
                     # confirming shows the timestamped note
git tag --list baseline-angular-14   # tag exists
test -f README.md && head -3 README.md   # README in place
```

Downstream-coupling check (proves the demo's core property): temporarily rename `variant` to `kind` in `libs/ui-components/src/lib/button/button.component.ts`, run `npm run build:all` — the **retail-banking build fails** on its template even though the lib builds. Revert with `git checkout -- libs/`.

## Done when

`npm run build:all` and `npm run test:all` both exit 0, both apps pass the manual checks above, the downstream-coupling check fails in the app build (then reverts cleanly, `git status` clean), `README.md` exists and is committed, and `git tag --list baseline-angular-14` prints the tag.

## Risks

- **Stale `dist/ui-components`.** Any "missing export" or type mismatch against the lib usually means `dist/` predates the latest lib source. `npm run build:lib` and retry — the scripts exist precisely to prevent this.
- **Port already in use** when serving both apps at once — wealth-portal was pinned to 4300 in plan 02; if that edit was missed, `ng serve wealth-portal --port 4300`.
- **Karma runs serially three times in `test:all`** and takes a few minutes; a hang at "Connected on socket" is a Chrome-launch failure (old headless mode removed — see plan 02 risks and the Puppeteer fallback), not a slow test run.
- **Tagging before the README commit.** The tag is the rehearsal restore point and should include the README — step 9 runs after step 8's commit deliberately. If tagged too early: `git tag -d baseline-angular-14` and re-tag.
