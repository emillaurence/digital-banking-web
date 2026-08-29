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
