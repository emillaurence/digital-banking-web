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
