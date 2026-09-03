import { TestBed } from '@angular/core/testing';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { BofaTableComponent } from './table.component';

describe('BofaTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatTableModule],
      declarations: [BofaTableComponent],
    }).compileComponents();
  });

  it('renders one row per data item and one header per column', () => {
    const fixture = TestBed.createComponent(BofaTableComponent);
    fixture.componentInstance.columns = [
      { key: 'name', header: 'Name' },
      { key: 'amount', header: 'Amount', align: 'right' },
    ];
    fixture.componentInstance.data = [
      { name: 'Groceries', amount: '-$54.20' },
      { name: 'Payroll', amount: '+$3,200.00' },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('th.mat-header-cell').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('tr.mat-row').length).toBe(2);
  });
});
