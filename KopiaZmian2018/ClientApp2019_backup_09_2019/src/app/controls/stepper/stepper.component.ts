import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter, forwardRef, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { ConvertingUtils } from '../../helpers/converting-utils';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    host: { 'class': 'app-stepper' },
    styleUrls: ['./stepper.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => StepperComponent),
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => StepperComponent),
            multi: true,
        }
    ]
})
export class StepperComponent implements OnInit, ControlValueAccessor, Validator {

    private _value: number;
    private _displayedValue: string;
    private _min: number;
    private _max: number;
    private _isUnitTotal: 0 | 1;

    defaultMaxValues: [number, number];
    defaultMinValues: [number, number];

    @ViewChild('input')
    inputField: ElementRef<HTMLInputElement>;

    @Input()
    name: string;

    @Input()
    label: string;

    @Input()
    labelVisible: string;

    @Input()
    ariaInputLabel: string;

    @Input()
    ariaControlLabel: string;

    @Input()
    ariaIncreaseLabel: string;

    @Input()
    ariaDecreaseLabel: string;

    @Input()
    required: boolean;

    @Input()
    disabled: boolean;

    private regexp: RegExp;


    /**
    * Event emitted when value change.
    * Do not emit the event inside writeValue method, becouse it will fire event during data rebinding which cause unnessesary requests.
    */
    @Output()
    changeValue: EventEmitter<number>;


    //properties for forms api interfaces;
    private onChangeCallback: Function;
    private onTouchedCallback: Function;
    private onValidatorChange: Function;


    @Input()
    set isUnitTotal(isTotal: 0 | 1) {

        if (isTotal > 1) {
            isTotal = 1;
        }

        if (isTotal !== this._isUnitTotal) {

            this._isUnitTotal = isTotal;

            if (this._min === this.defaultMinValues[0] || this._min === this.defaultMinValues[1]) {
                this._min = this.defaultMinValues[this._isUnitTotal];
            }

            if (this._max === this.defaultMaxValues[0] || this._max === this.defaultMinValues[1]) {
                this._max = this.defaultMaxValues[this._isUnitTotal];
            }

            if (this._value !== undefined) {


                if (this._value < Math.min(this._min, this.defaultMinValues[this._isUnitTotal])) {
                    this.value = Math.min(this._min, this.defaultMinValues[this._isUnitTotal]);
                }

                if (this._value > this.defaultMaxValues[this._isUnitTotal]) {
                    this.value = this.defaultMaxValues[this._isUnitTotal];
                }

                this.fixDisplayedDecimalPlaces();

            }

            if (this.onValidatorChange) {
                this.onValidatorChange();
            }

        }
    }

    get isUnitTotal() {
        return this._isUnitTotal;
    }

    @Input()
    set min(minValue: number) {

        if (minValue !== this._min) {

            if (minValue < 0) {

                this._min = this.defaultMinValues[this._isUnitTotal];

            } else {
                this._min = minValue;
            }

            if (this.onValidatorChange) {
                this.onValidatorChange();
            }


        }
    }

    get min() {
        return this._min;
    }


    @Input()
    set max(maxValue: number) {

        if (maxValue !== this._max) {

            if (maxValue < 0) {
                this._max = this.defaultMaxValues[this._isUnitTotal];
            } else {
                this._max = maxValue;
            }

            if (this.onValidatorChange) {
                this.onValidatorChange();
            }

        }
    }

    get max() {
        return this._max;
    }


    @Input()
    set value(newValue: string | number) {

        if (newValue === undefined || !this.regexp.test(newValue + '')) {
            this.updateNativeControl();
            return;
        }

        this._value = ConvertingUtils.stringToNum(<any>newValue);
        this._displayedValue = ConvertingUtils.numToString(<any>newValue);

        const cursorPos = this.inputField.nativeElement.selectionStart;

        this.correctValueDefaultRang(this._value);
        this.fixDisplayedDecimalPlaces();

        this.updateNativeControl(cursorPos);

    }


    get value() {
        return this._displayedValue;
    }


    constructor(private changeDetector: ChangeDetectorRef, public r: ResourcesService) {

        this.regexp = new RegExp(/^[0-9]+[.,]{0,1}[0-9]*$/);

        this.defaultMaxValues = [999999.9999, 999999];
        this.defaultMinValues = [0.0001, 1];

        this._isUnitTotal = 1;

        this.changeValue = new EventEmitter<number>();

    }

    ngOnInit() {

        if (this._min === undefined) {
            this._min = this.defaultMinValues[this._isUnitTotal];
        }

        if (this._max === undefined) {
            this._max = this.defaultMaxValues[this._isUnitTotal];
        }

        if (this._value === undefined) {
            this._value = (this._min === 0) ? 0 : Math.min(1, this._max);
        }

        if (this.onValidatorChange) {
            this.onValidatorChange();
        }

        if (this._displayedValue !== undefined) {
            this.fixDisplayedDecimalPlaces();
        }

    }

    increase() {
        if (this._value < this.defaultMaxValues[this._isUnitTotal]) {


            this.value = this._value + 1;
            this.writeValue(this.value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.updateNativeControl();

            this.changeValue.emit(this._value);
        }
    }

    decrease() {

        if (this._value > this._min) {

            this.value = this._value - 1;
            this.writeValue(this.value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.updateNativeControl();

            this.changeValue.emit(this._value);
        }
    }

    /**
     * Separate method for handling input changes.
     * It's important not to emit valueChange event inside writeValue method, becouse it's used also by angular forms api.
     * Angular form calls writeValue method also after data rebinding, so emitting event in separate method is nessesary to detect user changes only.
     */
    properChange(value) {

        if (value === '') {
            value = this.defaultMinValues[this._isUnitTotal];
        }

        if (ConvertingUtils.stringToNum(value) !== this._value) {

            this.writeValue(value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.changeValue.emit(this._value);
        }

    }

    correctValueDefaultRang(value: number) {


        const localMin = Math.min(this.min, this.defaultMinValues[this._isUnitTotal]);

        if (value === undefined || value === null || value < localMin) {
            value = localMin;
        }

        if (value > this.defaultMaxValues[this._isUnitTotal]) {
            value = this.defaultMaxValues[this._isUnitTotal];
        }

        if (this._isUnitTotal === 1) {
            value = Math.floor(value);
        }

        this._value = value;
        this._displayedValue = ConvertingUtils.numToString(value);

    }

    fixDisplayedDecimalPlaces() {

        if (this._isUnitTotal === 0) {

            const separated = this._displayedValue.split(',');

            if (separated.length > 1) {
                separated[1] = (separated[1] + '0000').slice(0, 4);
                this._displayedValue = separated.join(',');
                this._value = ConvertingUtils.stringToNum(this._displayedValue);
            } else {
                this._displayedValue += ',0000';
            }

        } else {
            this._value = Math.floor(this._value);
            this._displayedValue = ConvertingUtils.numToString(this._value);
        }

    }


    // Methods of angular forms api interfaces.
    // Methods are using by forms api. Registered callbacks informs forms api about important changes and fires proper api methods.
    // Eg. informs about changing validation conditions, about changing control value, and fires revalidation.

    /**
     * Setting current value to control. Method is used also by angular forms api, eg. by ngModelChange event
     */
    writeValue(value: number): void {

        if (value !== null && value !== undefined) {
            //method is called by ngModelChange event and onInput event without using setter, so setter is used here
            this.value = value;
            this.changeDetector.markForCheck();
        }


    }

    updateNativeControl(cursorPosition?: number) {

        window.setTimeout(() => {

            this.inputField.nativeElement.value = this._displayedValue;

            if (cursorPosition) {
                this.inputField.nativeElement.setSelectionRange(cursorPosition, cursorPosition);
            }

        }, 0);
    }


    handleSeparator(e: KeyboardEvent) {
        e.preventDefault();
        const pos = this.inputField.nativeElement.value.indexOf(',') + 1;
        this.inputField.nativeElement.setSelectionRange(pos, pos);
    }

    handleDelete(e: KeyboardEvent) {

        const commaPos = this.inputField.nativeElement.value.indexOf(',');
        const currentPos = this.inputField.nativeElement.selectionStart;

        if (e.key.toLowerCase() === 'backspace' && commaPos === currentPos - 1) {
            e.preventDefault();
            this.inputField.nativeElement.setSelectionRange(commaPos, commaPos);
        }

        if (e.key.toLowerCase() === 'delete' && commaPos === currentPos) {
            e.preventDefault();
            this.inputField.nativeElement.setSelectionRange(commaPos + 1, commaPos + 1);
        }

        if (this._value === 1 && !this._isUnitTotal) {
            e.preventDefault();
            this.value = this.defaultMinValues[this._isUnitTotal];
            this.updateNativeControl(commaPos + 1);
        }


    }


    selectAll() {
        const length = this.inputField.nativeElement.value.length;
        this.inputField.nativeElement.setSelectionRange(0, length);
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


    /**
     * Validation method used by angular forms api.
     */
    validate(c: AbstractControl): ValidationErrors | null {

        if (this._value !== undefined && this._value !== null) {

            if (this._value > this._max) {
                return { 'max': false };
            }

            if (this._value < this._min) {
                return { 'min': false };
            }

            if (+this._value !== +this._value) {
                return { 'numeric': false };
            }

        } else if (this.required) {
            return { 'required': false };
        }


        return null;

    }


    registerOnValidatorChange(fn: any): void {

        this.onValidatorChange = () => {
            fn();
            this.changeDetector.markForCheck();
        };
    }

}
