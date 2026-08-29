# 04 — Design-system components in the library

## Goal

`@bofa/ui-components` exports six working design-system components/services wrapping Angular Material — button, card, text input, table, confirm dialog (+ dialog service), datepicker — and the library builds and passes unit tests.

## Prerequisites

- Plan 03 done (`ng build ui-components` green, theme applied). Node 16.20.2 active, a working headless Chrome for Karma (see plan 02's risks — if the apps' test runs needed the Puppeteer fallback, apply the same `CHROME_BIN` line to `libs/ui-components/karma.conf.js`).

## Steps

All file paths relative to the repo root. Create each file with exactly the contents shown.

1. **Button** — `libs/ui-components/src/lib/button/button.component.ts`:

   ```ts
   import { Component, Input } from '@angular/core';

   export type BofaButtonVariant = 'primary' | 'secondary' | 'ghost';

   @Component({
     selector: 'bofa-button',
     templateUrl: './button.component.html',
     styleUrls: ['./button.component.scss'],
   })
   export class BofaButtonComponent {
     @Input() variant: BofaButtonVariant = 'primary';
     @Input() disabled = false;
     @Input() type: 'button' | 'submit' = 'button';
   }
   ```

   `libs/ui-components/src/lib/button/button.component.html`:

   ```html
   <button
     mat-flat-button
     class="bofa-button bofa-button--{{ variant }}"
     [color]="variant === 'primary' ? 'primary' : undefined"
     [disabled]="disabled"
     [type]="type"
   >
     <ng-content></ng-content>
   </button>
   ```

   `libs/ui-components/src/lib/button/button.component.scss`:

   ```scss
   .bofa-button--secondary {
     background: transparent;
     color: #012169;
     box-shadow: inset 0 0 0 1.5px #012169;
   }

   .bofa-button--ghost {
     background: transparent;
     color: #012169;
   }
   ```

2. **Card** — `libs/ui-components/src/lib/card/card.component.ts`:

   ```ts
   import { Component, Input } from '@angular/core';

   @Component({
     selector: 'bofa-card',
     templateUrl: './card.component.html',
     styleUrls: ['./card.component.scss'],
   })
   export class BofaCardComponent {
     @Input() title = '';
     @Input() subtitle = '';
   }
   ```

   `libs/ui-components/src/lib/card/card.component.html`:

   ```html
   <mat-card class="bofa-card">
     <mat-card-header *ngIf="title">
       <mat-card-title>{{ title }}</mat-card-title>
       <mat-card-subtitle *ngIf="subtitle">{{ subtitle }}</mat-card-subtitle>
     </mat-card-header>
     <mat-card-content>
       <ng-content></ng-content>
     </mat-card-content>
   </mat-card>
   ```

   `libs/ui-components/src/lib/card/card.component.scss`:

   ```scss
   :host {
     display: block;
   }

   .bofa-card {
     height: 100%;
   }
   ```

3. **Text input (ControlValueAccessor)** — `libs/ui-components/src/lib/text-input/text-input.component.ts`:

   ```ts
   import { Component, forwardRef, Input } from '@angular/core';
   import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

   @Component({
     selector: 'bofa-text-input',
     templateUrl: './text-input.component.html',
     styleUrls: ['./text-input.component.scss'],
     providers: [
       {
         provide: NG_VALUE_ACCESSOR,
         useExisting: forwardRef(() => BofaTextInputComponent),
         multi: true,
       },
     ],
   })
   export class BofaTextInputComponent implements ControlValueAccessor {
     @Input() label = '';
     @Input() placeholder = '';
     @Input() hint = '';
     @Input() type: 'text' | 'number' | 'email' = 'text';

     value = '';
     disabled = false;

     onTouched: () => void = () => {};
     private onChange: (value: string) => void = () => {};

     writeValue(value: string | null): void {
       this.value = value ?? '';
     }

     registerOnChange(fn: (value: string) => void): void {
       this.onChange = fn;
     }

     registerOnTouched(fn: () => void): void {
       this.onTouched = fn;
     }

     setDisabledState(isDisabled: boolean): void {
       this.disabled = isDisabled;
     }

     handleInput(event: Event): void {
       this.value = (event.target as HTMLInputElement).value;
       this.onChange(this.value);
     }
   }
   ```

   `libs/ui-components/src/lib/text-input/text-input.component.html`:

   ```html
   <mat-form-field appearance="outline" class="bofa-field">
     <mat-label>{{ label }}</mat-label>
     <input
       matInput
       [type]="type"
       [placeholder]="placeholder"
       [value]="value"
       [disabled]="disabled"
       (input)="handleInput($event)"
       (blur)="onTouched()"
     />
     <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
   </mat-form-field>
   ```

   `libs/ui-components/src/lib/text-input/text-input.component.scss`:

   ```scss
   .bofa-field {
     width: 100%;
   }
   ```

4. **Table** — `libs/ui-components/src/lib/table/table.component.ts`:

   ```ts
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
   ```

   `libs/ui-components/src/lib/table/table.component.html`:

   ```html
   <table mat-table [dataSource]="data" class="bofa-table">
     <ng-container *ngFor="let column of columns" [matColumnDef]="column.key">
       <th mat-header-cell *matHeaderCellDef [class.bofa-table__cell--right]="column.align === 'right'">
         {{ column.header }}
       </th>
       <td mat-cell *matCellDef="let row" [class.bofa-table__cell--right]="column.align === 'right'">
         {{ row[column.key] }}
       </td>
     </ng-container>

     <tr mat-header-row *matHeaderRowDef="columnKeys"></tr>
     <tr mat-row *matRowDef="let row; columns: columnKeys"></tr>
   </table>
   ```

   `libs/ui-components/src/lib/table/table.component.scss`:

   ```scss
   .bofa-table__cell--right {
     text-align: right;
   }
   ```

5. **Dialog** — `libs/ui-components/src/lib/dialog/confirm-dialog.component.ts`:

   ```ts
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
   ```

   `libs/ui-components/src/lib/dialog/confirm-dialog.component.html`:

   ```html
   <h2 mat-dialog-title>{{ data.title }}</h2>
   <mat-dialog-content>{{ data.message }}</mat-dialog-content>
   <mat-dialog-actions align="end">
     <bofa-button variant="ghost" (click)="close(false)">{{ data.cancelLabel || 'Cancel' }}</bofa-button>
     <bofa-button variant="primary" (click)="close(true)">{{ data.confirmLabel || 'Confirm' }}</bofa-button>
   </mat-dialog-actions>
   ```

   `libs/ui-components/src/lib/dialog/dialog.service.ts`:

   ```ts
   import { Injectable } from '@angular/core';
   import { MatDialog } from '@angular/material/dialog';
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
   ```

6. **Datepicker (ControlValueAccessor)** — `libs/ui-components/src/lib/datepicker/datepicker.component.ts`:

   ```ts
   import { Component, forwardRef, Input } from '@angular/core';
   import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
   import { MatDatepickerInputEvent } from '@angular/material/datepicker';

   @Component({
     selector: 'bofa-datepicker',
     templateUrl: './datepicker.component.html',
     styleUrls: ['./datepicker.component.scss'],
     providers: [
       {
         provide: NG_VALUE_ACCESSOR,
         useExisting: forwardRef(() => BofaDatepickerComponent),
         multi: true,
       },
     ],
   })
   export class BofaDatepickerComponent implements ControlValueAccessor {
     @Input() label = '';
     @Input() hint = '';

     value: Date | null = null;
     disabled = false;

     onTouched: () => void = () => {};
     private onChange: (value: Date | null) => void = () => {};

     writeValue(value: Date | null): void {
       this.value = value;
     }

     registerOnChange(fn: (value: Date | null) => void): void {
       this.onChange = fn;
     }

     registerOnTouched(fn: () => void): void {
       this.onTouched = fn;
     }

     setDisabledState(isDisabled: boolean): void {
       this.disabled = isDisabled;
     }

     handleDateChange(event: MatDatepickerInputEvent<Date>): void {
       this.value = event.value;
       this.onChange(event.value);
     }
   }
   ```

   `libs/ui-components/src/lib/datepicker/datepicker.component.html`:

   ```html
   <mat-form-field appearance="outline" class="bofa-field">
     <mat-label>{{ label }}</mat-label>
     <input
       matInput
       [matDatepicker]="picker"
       [value]="value"
       [disabled]="disabled"
       (dateChange)="handleDateChange($event)"
       (blur)="onTouched()"
     />
     <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
     <mat-datepicker #picker></mat-datepicker>
     <mat-hint *ngIf="hint">{{ hint }}</mat-hint>
   </mat-form-field>
   ```

   `libs/ui-components/src/lib/datepicker/datepicker.component.scss`:

   ```scss
   .bofa-field {
     width: 100%;
   }
   ```

7. **Module** — replace `libs/ui-components/src/lib/ui-components.module.ts` with:

   ```ts
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
   ```

8. **Public API** — replace `libs/ui-components/src/public-api.ts` with:

   ```ts
   export * from './lib/ui-components.module';
   export * from './lib/button/button.component';
   export * from './lib/card/card.component';
   export * from './lib/datepicker/datepicker.component';
   export * from './lib/dialog/confirm-dialog.component';
   export * from './lib/dialog/dialog.service';
   export * from './lib/table/table.component';
   export * from './lib/text-input/text-input.component';
   ```

9. **Tests.** Create three spec files.

   `libs/ui-components/src/lib/button/button.component.spec.ts`:

   ```ts
   import { TestBed } from '@angular/core/testing';
   import { MatButtonModule } from '@angular/material/button';
   import { BofaButtonComponent } from './button.component';

   describe('BofaButtonComponent', () => {
     beforeEach(async () => {
       await TestBed.configureTestingModule({
         imports: [MatButtonModule],
         declarations: [BofaButtonComponent],
       }).compileComponents();
     });

     it('renders a Material flat button with the variant class', () => {
       const fixture = TestBed.createComponent(BofaButtonComponent);
       fixture.componentInstance.variant = 'secondary';
       fixture.detectChanges();

       const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
       expect(button.classList).toContain('mat-flat-button');
       expect(button.classList).toContain('bofa-button--secondary');
     });

     it('disables the native button', () => {
       const fixture = TestBed.createComponent(BofaButtonComponent);
       fixture.componentInstance.disabled = true;
       fixture.detectChanges();

       const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
       expect(button.disabled).toBeTrue();
     });
   });
   ```

   `libs/ui-components/src/lib/table/table.component.spec.ts`:

   ```ts
   import { TestBed } from '@angular/core/testing';
   import { MatTableModule } from '@angular/material/table';
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
   ```

   `libs/ui-components/src/lib/dialog/dialog.service.spec.ts`:

   ```ts
   import { of } from 'rxjs';
   import { MatDialog } from '@angular/material/dialog';
   import { BofaDialogService } from './dialog.service';

   describe('BofaDialogService', () => {
     function serviceWithDialogResult(result: unknown): BofaDialogService {
       const dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
       dialogSpy.open.and.returnValue({ afterClosed: () => of(result) } as never);
       return new BofaDialogService(dialogSpy);
     }

     it('maps a confirmed close to true', (done) => {
       serviceWithDialogResult(true)
         .confirm({ title: 'T', message: 'M' })
         .subscribe((confirmed) => {
           expect(confirmed).toBeTrue();
           done();
         });
     });

     it('maps a dismissed dialog (undefined) to false', (done) => {
       serviceWithDialogResult(undefined)
         .confirm({ title: 'T', message: 'M' })
         .subscribe((confirmed) => {
           expect(confirmed).toBeFalse();
           done();
         });
     });
   });
   ```

10. **Commit:**

    ```bash
    git add -A
    git commit -m "Implement design-system components in ui-components"
    ```

## Verification

```bash
npx ng build ui-components                                            # exits 0
npx ng test ui-components --watch=false --browsers=ChromeHeadless     # 5 specs, 0 failures
ls dist/ui-components/*.d.ts                                          # at least one typings file exists — ng-packagr 14 emits index.d.ts at the package root
grep -c export dist/ui-components/index.d.ts                          # > 0 (typings emitted)
```

(If `index.d.ts` is not the name ng-packagr 14 actually emitted, the `ls` above shows what is — the check is "at least one `.d.ts` at the package root with exports", not a specific filename.)

## Done when

The library build exits 0 and the headless test run reports `SUCCESS` with 5 passing specs and 0 failures.

## Risks

- **Strict-template errors** (workspaces are generated with `strict: true`). Likeliest offenders: `[color]="... : undefined"` on the button (if the compiler rejects `undefined` for `ThemePalette`, use `$any(undefined)` or `null!`), and `row[column.key]` indexing in the table (if rejected, change the cell to `{{ $any(row)[column.key] }}`). Fix per compiler message; the component design doesn't change.
- **`BofaDialogService` constructor visibility in the spec.** The spec news up the service with a spy, which requires the constructor to be callable from the spec — it is (`private` only restricts member access, and the spec passes the spy positionally). If TS complains about the spy type, cast: `new BofaDialogService(dialogSpy as unknown as MatDialog)`.
- **ng-packagr warns about `rxjs`** as a non-peer dependency. It's declared in `peerDependencies` (plan 03 step 3), so this shouldn't appear; if it does, the warning is safe, but check the lib `package.json` wasn't reverted.
- **Dynamic `matColumnDef` inside `*ngFor`** is a long-standing documented pattern; if the table test fails with "duplicate column definition", the `columns` input has repeated keys — a data problem, not a component problem.
