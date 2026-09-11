import { ControlValueAccessor } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import * as i0 from "@angular/core";
export declare class BofaDatepickerComponent implements ControlValueAccessor {
    label: string;
    hint: string;
    value: Date | null;
    disabled: boolean;
    onTouched: () => void;
    private onChange;
    writeValue(value: Date | null): void;
    registerOnChange(fn: (value: Date | null) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    handleDateChange(event: MatDatepickerInputEvent<Date>): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<BofaDatepickerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BofaDatepickerComponent, "bofa-datepicker", never, { "label": "label"; "hint": "hint"; }, {}, never, never, false>;
}
