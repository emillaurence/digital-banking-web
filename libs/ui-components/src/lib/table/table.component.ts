import { Component, Input } from '@angular/core';

export interface BofaTableColumn {
  key: string;
  header: string;
  align?: 'left' | 'right';
}

@Component({
  selector: 'bofa-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class BofaTableComponent {
  @Input() columns: BofaTableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];

  get columnKeys(): string[] {
    return this.columns.map((column) => column.key);
  }
}
