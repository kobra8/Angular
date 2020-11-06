import { Component, Input, ViewEncapsulation, Output, EventEmitter, forwardRef, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, Validator, AbstractControl, ValidationErrors, NG_VALIDATORS } from '@angular/forms';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-checkbox',
    templateUrl: './checkbox.component.html',
    host: { 'class': 'app-checkbox' },
    styleUrls: ['./checkbox.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => CheckboxComponent),
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => CheckboxComponent),
            multi: true,
        }
    ]
})
export class CheckboxComponent implements ControlValueAccessor, Validator {
    
    

    @Input()
    value: boolean; 

    @Input()
    name: string;

    @Input()
    ariaLabel: string;


    @Input()
    tabindex: number;

    @Output()
    changeValue: EventEmitter<any>;

    onChangeCallback: Function;
    onTouchedCallback: Function;

    disabled: boolean;

    @ViewChild('focusable')
    focusableRef: ElementRef<HTMLInputElement>;

    onValidatorChange: Function;

    private _required: boolean;

    @Input()
    set required(isRequired: boolean) {
        this._required = isRequired;

        window.setTimeout(() => {
            if (this.onValidatorChange) {
                this.onValidatorChange();
            }
        }, 0);
    }

    get required() {
        return this._required;
    }

    constructor(private changeDetector: ChangeDetectorRef, public r: ResourcesService) {
       
        this.changeValue = new EventEmitter<any>();

    }

    changeMiddleware(value: boolean) {

        if (value !== null && value !== undefined && value !== this.value) {

            this.writeValue(value);
            this.changeValue.emit(this.value);

            window.setTimeout(() => {
                if (this.onChangeCallback) {
                    this.onChangeCallback(this.value);
                }
            });
        }
    }


    writeValue(value: boolean): void {

        if (value !== null && value !== undefined && value !== this.value) {
            this.value = value;
            this.changeDetector.markForCheck();
        }
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }


    validate(control: AbstractControl): ValidationErrors | null {
        //false is some value, so default required validator wouldn't work for false value
        //it has to be overrided

        if (this.required && !this.value) {
            return { 'required': false };
        }
 
        return null;
    }

    registerOnValidatorChange(fn: Function): void {
        this.onValidatorChange = fn;
    }

    


}
