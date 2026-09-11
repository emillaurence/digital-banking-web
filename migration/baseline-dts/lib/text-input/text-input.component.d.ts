import { ControlValueAccessor } from '@angular/forms';
import * as i0 from "@angular/core";
export declare class BofaTextInputComponent implements ControlValueAccessor {
    label: string;
    placeholder: string;
    hint: string;
    type: 'text' | 'number' | 'email';
    value: string;
    disabled: boolean;
    onTouched: () => void;
    private onChange;
    writeValue(value: string | null): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    handleInput(event: Event): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<BofaTextInputComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<BofaTextInputComponent, "bofa-text-input", never, { "label": "label"; "placeholder": "placeholder"; "hint": "hint"; "type": "type"; }, {}, never, never, false>;
}
