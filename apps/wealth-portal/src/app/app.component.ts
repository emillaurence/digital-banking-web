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
