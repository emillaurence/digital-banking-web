import { MatDialogRef } from '@angular/material/dialog';
import * as i0 from "@angular/core";
export interface BofaConfirmDialogData {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}
export declare class BofaConfirmDialogComponent {
    data: BofaConfirmDialogData;
    private dialogRef;
    constructor(data: BofaConfirmDialogData, dialogRef: MatDialogRef<BofaConfirmDialogComponent>);
    close(confirmed: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<BofaConfirmDialogComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BofaConfirmDialogComponent, "bofa-confirm-dialog", never, {}, {}, never, never, false>;
}
