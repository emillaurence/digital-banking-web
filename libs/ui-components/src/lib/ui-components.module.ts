import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

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
