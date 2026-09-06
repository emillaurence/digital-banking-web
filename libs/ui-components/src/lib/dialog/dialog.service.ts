import { Injectable } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { map, Observable } from 'rxjs';
import { BofaConfirmDialogComponent, BofaConfirmDialogData } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class BofaDialogService {
  constructor(private dialog: MatDialog) {}

  confirm(data: BofaConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open(BofaConfirmDialogComponent, { width: '420px', data })
      .afterClosed()
      .pipe(map((result) => result === true));
  }
}
