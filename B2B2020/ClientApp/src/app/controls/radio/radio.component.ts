import { Component, Input, ViewEncapsulation, Output, EventEmitter, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-radio',
    templateUrl: './radio.component.html',
    host: { 'class': 'app-radio' },
    styleUrls: ['./radio.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => RadioComponent),
        }
    ]
})
export class RadioComponent implements ControlValueAccessor {
    

    @Input()
    required: boolean;

    @Input()
    name: string;

    @Input()
    value: any;

    @Input()
    selectedValue: any;

    @Output()
    changeValue: EventEmitter<any>;

    @Input()
    checked: boolean;

    @Input()
    disabled: boolean;

    @Input()
    ariaLabel: string;

    onChangeCallback: Function;
    onTouchedCallback: Function;

    constructor(private changeDetector: ChangeDetectorRef) {
        this.changeValue = new EventEmitter<any>();
    }

    writeValue(selectedValue: any): void {

        if (selectedValue !== null) {
            if (this.selectedValue === selectedValue) {
                this.clearSelectedValue();
            }
            this.selectedValue = selectedValue;
            this.changeDetector.markForCheck();
        }
    }

    private clearSelectedValue() {
        this.selectedValue = undefined;
        this.changeDetector.detectChanges();
    }

    changeMiddleware(targetValue: any) {


        if (targetValue !== null && targetValue !== this.selectedValue) {

            this.selectedValue = targetValue;
            this.changeValue.emit(targetValue);

            if (this.onChangeCallback) {
                this.onChangeCallback(this.selectedValue);
            }
        }
        
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }

}
