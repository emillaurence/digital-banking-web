import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';

import { BofaButtonComponent } from './button/button.component';
import { BofaCardComponent } from './card/card.component';
import { BofaDatepickerComponent } from './datepicker/datepicker.component';
import { BofaConfirmDialogComponent } from './dialog/confirm-dialog.component';
import { BofaTableComponent } from './table/table.component';
import { BofaTextInputComponent } from './text-input/text-input.component';

const COMPONENTS = [
  BofaButtonComponent,
  BofaCardComponent,
  BofaConfirmDialogComponent,
  BofaDatepickerComponent,
  BofaTableComponent,
  BofaTextInputComponent,
];

@NgModule({
  declarations: COMPONENTS,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatTableModule,
  ],
  exports: COMPONENTS,
})
export class UiComponentsModule {}
