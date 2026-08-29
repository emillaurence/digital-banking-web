import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface BofaConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'bofa-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
})
export class BofaConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: BofaConfirmDialogData,
    private dialogRef: MatDialogRef<BofaConfirmDialogComponent>
  ) {}

  close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
