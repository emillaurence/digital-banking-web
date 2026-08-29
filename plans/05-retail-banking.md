# 05 — Retail banking app consumes the library

## Goal

`retail-banking` is a themed Bank of America **Online Banking** accounts dashboard built from `@bofa/ui-components`: summary cards, a transactions table, and a payment form (text inputs + datepicker) whose submit opens the library's confirm dialog.

Branding rules: the header is a **text wordmark** styled with the brand colours — do **not** download, embed, or reproduce the Bank of America logo. Account identifiers use obviously masked formats. All copy is US-locale: dollars, MM/DD/YYYY dates, `en-US` formatting, US product and merchant names.

## Prerequisites

- Plan 04 done (library builds and tests green). Node 16.20.2 active.
- **The library must be built** before this app can compile: `npx ng build ui-components`.

## Steps

1. **App module** — replace `apps/retail-banking/src/app/app.module.ts` with:

   ```ts
   import { NgModule } from '@angular/core';
   import { BrowserModule } from '@angular/platform-browser';
   import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
   import { ReactiveFormsModule } from '@angular/forms';
   import { UiComponentsModule } from '@bofa/ui-components';

   import { AppComponent } from './app.component';

   @NgModule({
     declarations: [AppComponent],
     imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, UiComponentsModule],
     bootstrap: [AppComponent],
   })
   export class AppModule {}
   ```

2. **Component class** — replace `apps/retail-banking/src/app/app.component.ts` with:

   ```ts
   import { Component } from '@angular/core';
   import { FormBuilder, Validators } from '@angular/forms';
   import { BofaDialogService, BofaTableColumn } from '@bofa/ui-components';

   interface TransactionRow extends Record<string, unknown> {
     date: string;
     description: string;
     amount: string;
   }

   @Component({
     selector: 'app-root',
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.scss'],
   })
   export class AppComponent {
     readonly summaryCards = [
       { title: 'Advantage Plus Checking', subtitle: 'Routing 026009593 · Acct •••• 1190', amount: '$4,821.55' },
       { title: 'Advantage Savings', subtitle: '2.85% APY', amount: '$12,406.10' },
       { title: 'BankAmericard Credit Card', subtitle: 'Statement due Sep 12', amount: '−$638.42' },
     ];

     readonly transactionColumns: BofaTableColumn[] = [
       { key: 'date', header: 'Date' },
       { key: 'description', header: 'Description' },
       { key: 'amount', header: 'Amount', align: 'right' },
     ];

     transactions: TransactionRow[] = [
       { date: '08/27/2026', description: 'Whole Foods Market', amount: '−$54.20' },
       { date: '08/26/2026', description: 'MTA Subway Fare', amount: '−$8.60' },
       { date: '08/25/2026', description: 'Payroll — Hartwell LLC', amount: '+$3,204.17' },
       { date: '08/24/2026', description: 'Acme Utilities Bill Pay', amount: '−$112.00' },
       { date: '08/22/2026', description: 'Transfer to Advantage Savings', amount: '−$500.00' },
     ];

     readonly paymentForm = this.formBuilder.group({
       payee: ['', Validators.required],
       amount: ['', [Validators.required, Validators.min(0.01)]],
       date: [null as Date | null, Validators.required],
     });

     constructor(
       private formBuilder: FormBuilder,
       private dialogs: BofaDialogService
     ) {}

     submitPayment(): void {
       if (this.paymentForm.invalid) {
         this.paymentForm.markAllAsTouched();
         return;
       }

       const { payee, amount, date } = this.paymentForm.getRawValue();
       const formattedAmount = Number(amount).toFixed(2);
       const formattedDate = date ? date.toLocaleDateString('en-US') : '';

       this.dialogs
         .confirm({
           title: 'Confirm payment',
           message: `Send $${formattedAmount} to ${payee} on ${formattedDate}?`,
           confirmLabel: 'Send payment',
         })
         .subscribe((confirmed) => {
           if (!confirmed) {
             return;
           }
           this.transactions = [
             { date: formattedDate, description: `Payment to ${payee}`, amount: `−$${formattedAmount}` },
             ...this.transactions,
           ];
           this.paymentForm.reset();
         });
     }
   }
   ```

3. **Template** — replace `apps/retail-banking/src/app/app.component.html` with:

   ```html
   <header class="app-header">
     <span class="app-header__brand">Bank of America</span>
     <span class="app-header__product">Online Banking</span>
   </header>

   <main class="page">
     <h1>Your accounts</h1>

     <section class="summary-grid">
       <bofa-card *ngFor="let card of summaryCards" [title]="card.title" [subtitle]="card.subtitle">
         <p class="summary-amount">{{ card.amount }}</p>
       </bofa-card>
     </section>

     <section class="panel-grid">
       <bofa-card title="Recent transactions" subtitle="Advantage Plus Checking">
         <bofa-table [columns]="transactionColumns" [data]="transactions"></bofa-table>
       </bofa-card>

       <bofa-card title="Make a payment" subtitle="Zelle & ACH transfers">
         <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()">
           <bofa-text-input label="Payee" placeholder="e.g. Acme Utilities" formControlName="payee"></bofa-text-input>
           <bofa-text-input
             label="Amount (USD)"
             type="number"
             placeholder="0.00"
             hint="Daily limit $25,000"
             formControlName="amount"
           ></bofa-text-input>
           <bofa-datepicker label="Payment date" formControlName="date"></bofa-datepicker>
           <bofa-button variant="primary" type="submit">Send payment</bofa-button>
         </form>
       </bofa-card>
     </section>
   </main>
   ```

4. **Styles** — replace `apps/retail-banking/src/app/app.component.scss` with:

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
     max-width: 1100px;
     margin: 0 auto;
     padding: 32px;
   }

   .summary-grid {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 20px;
     margin-bottom: 24px;
   }

   .panel-grid {
     display: grid;
     grid-template-columns: 3fr 2fr;
     gap: 20px;
     align-items: start;
   }

   .summary-amount {
     margin: 0;
     font-size: 26px;
     font-weight: 700;
   }

   form {
     display: flex;
     flex-direction: column;
     align-items: stretch;
     gap: 4px;
   }
   ```

5. **Spec** — replace `apps/retail-banking/src/app/app.component.spec.ts` (the generated one references the deleted placeholder template) with:

   ```ts
   import { TestBed } from '@angular/core/testing';
   import { ReactiveFormsModule } from '@angular/forms';
   import { NoopAnimationsModule } from '@angular/platform-browser/animations';
   import { UiComponentsModule } from '@bofa/ui-components';
   import { AppComponent } from './app.component';

   describe('AppComponent', () => {
     beforeEach(async () => {
       await TestBed.configureTestingModule({
         imports: [ReactiveFormsModule, NoopAnimationsModule, UiComponentsModule],
         declarations: [AppComponent],
       }).compileComponents();
     });

     it('creates the dashboard', () => {
       const fixture = TestBed.createComponent(AppComponent);
       expect(fixture.componentInstance).toBeTruthy();
     });

     it('renders one summary card per account', () => {
       const fixture = TestBed.createComponent(AppComponent);
       fixture.detectChanges();
       expect(fixture.nativeElement.querySelectorAll('bofa-card').length).toBe(5); // 3 summary + 2 panels
     });

     it('renders the recent transactions in the shared table', () => {
       const fixture = TestBed.createComponent(AppComponent);
       fixture.detectChanges();
       expect(fixture.nativeElement.querySelectorAll('bofa-table tr.mat-row').length).toBe(5);
     });
   });
   ```

6. **Commit:**

   ```bash
   git add -A
   git commit -m "Build retail-banking dashboard on ui-components"
   ```

## Verification

```bash
npx ng build ui-components      # must run first — the app compiles against dist/
npx ng build retail-banking     # exits 0
npx ng test retail-banking --watch=false --browsers=ChromeHeadless   # 3 specs, 0 failures
npx ng serve retail-banking     # then check http://localhost:4200 manually:
```

Manual check at `http://localhost:4200`: navy header with red accent rule, "Bank of America / Online Banking" wordmark, three themed summary cards with dollar amounts, transactions table with navy uppercase headers and MM/DD/YYYY dates, payment form on the right. Fill in payee/amount, pick a date from the Material calendar, press **Send payment** → rounded confirm dialog appears → **Send payment** in the dialog → new row appears at the top of the table and the form clears.

## Done when

App build exits 0, the 3 headless specs pass, and the manual dialog round-trip above adds a transaction row.

## Risks

- **`Cannot find module '@bofa/ui-components'`** — the library wasn't built (or `dist/` was cleaned). Run `npx ng build ui-components` and retry. This ordering is the deliberate downstream-coupling property of the repo.
- **Typed-forms friction** (Angular 14 introduced strictly typed reactive forms). The form uses string/Date-or-null initial values so inference should be clean; if `getRawValue()` destructuring complains, annotate: `const { payee, amount, date } = this.paymentForm.getRawValue() as { payee: string; amount: string; date: Date | null };`.
- **Datepicker errors about a missing `DateAdapter`.** `MatNativeDateModule` is imported (and its providers supplied) via `UiComponentsModule`; if the error appears anyway, add `MatNativeDateModule` to the app module's imports directly.
- **Dialog renders unstyled/unanimated in the browser.** Confirm `BrowserAnimationsModule` is in the app module and the theme include (plan 03 step 7) is in `styles.scss`.
