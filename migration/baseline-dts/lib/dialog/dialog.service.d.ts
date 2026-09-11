import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { BofaConfirmDialogData } from './confirm-dialog.component';
import * as i0 from "@angular/core";
export declare class BofaDialogService {
    private dialog;
    constructor(dialog: MatDialog);
    confirm(data: BofaConfirmDialogData): Observable<boolean>;
    static ɵfac: i0.ɵɵFactoryDeclaration<BofaDialogService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<BofaDialogService>;
}
