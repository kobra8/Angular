import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { b2b } from '../../../b2b';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/debounceTime';
import { FormattingUtils } from '../../helpers/formatting-utils';

@Component({
    selector: 'app-stepper',
    templateUrl: './stepper.component.html',
    host: { 'class': 'app-stepper' },
    styleUrls: ['./stepper.component.scss'],

    encapsulation: ViewEncapsulation.None,
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
    private _min: number;
    private _max: number;
    private _isUnitTotal: 0 | 1;

    defaultMaxValues: [number, number];
    defaultMinValues: [number, number];

    @ViewChild('input')
    inputField: ElementRef;

    @Input()
    name: string;

    @Input()
    required: boolean;

    @Input()
    disabled: boolean;

    private regexp: RegExp;

    //Value set when user is deleting input value. It's used to detect deleting coma.
    private valueToDelete: number;

    /**
    * Event emitted when value change.
    * Do not emit the event inside writeValue method, becouse it will fire event during data rebinding which cause unnessesary requests.
    */
    @Output()
    valueChange: EventEmitter<number>;


    //properties for forms api interfaces;
    private onChangeCallback: Function;
    private onTouchedCallback: Function;
    private onValidatorChange: Function;



    //setters and getters

    @Input()
    set isUnitTotal(isTotal: 0 | 1) {

        if (isTotal > 1) {
            isTotal = 1; //?
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

        if ((typeof newValue === 'number' && !Number.isNaN(newValue)) || this.regexp.test(newValue.toString())) {
            //only digits and coma allowed

            //Don't correct value with proper min and max values here.
            //Cart should display initial value without correcting, even when the user exceeds the stock level.
            //Only default rang should be respected in cart and everywhere else.
            let numericValue = FormattingUtils.stringToNum(<any>newValue);

            if (numericValue !== this._value) {

                if (this.valueToDelete !== undefined) {

                    //deleting decimal part when coma is deleted

                    if (!Number.isInteger(this.valueToDelete) && Number.isInteger(numericValue)) {
                        numericValue = Math.floor(this.valueToDelete);
                    }

                    this.valueToDelete = undefined;
                }

                numericValue = this.correctValueDefaultRang(numericValue);

                this._value = numericValue;


                this.fixDisplayedDecimalPlaces();


            }

        } else {

            this.inputField.nativeElement.value = FormattingUtils.numToString(this._value);
            this.fixDisplayedDecimalPlaces();
        }
    }

    get value() {
        return this._value;
    }

    //end of setters and getters




    constructor() {

        this.regexp = new RegExp(/^[0-9]+[,]{0,1}[0-9]*$/);

        this.defaultMaxValues = [999999.9999, 999999];
        this.defaultMinValues = [0.0001, 1];

        this._isUnitTotal = 1;

        this.valueChange = new EventEmitter<number>();

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
            this.fixDisplayedDecimalPlaces();
        }

        if (this.onValidatorChange) {
            this.onValidatorChange();
        }


    }

    increase() {
        if (this._value < this.defaultMaxValues[this._isUnitTotal]) {

            const value = this.correctValueDefaultRang(this._value + 1);
            this.writeValue(value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.valueChange.emit(this._value);
        }
    }

    decrease() {

        if (this._value > this._min) {

            const value = this.correctValueDefaultRang(this._value - 1);
            this.writeValue(value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.valueChange.emit(this._value);
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

        if (value.slice(-1) !== ',' && FormattingUtils.stringToNum(value) !== this._value) {

            this.writeValue(value);

            if (this.onChangeCallback) {
                this.onChangeCallback();
            }

            this.valueChange.emit(this._value);
        }
    }

    //
    //correctValue(value: number): number {

    //    if (typeof value === 'string') {
    //        value = FormattingUtils.stringToNum(value);
    //    }

    //    if (value === undefined || value === null || value < this._min) {
    //        value = this._min;
    //    }

    //    if (value > this._max) {
    //        value = this._max;
    //    }

    //    if (this._isUnitTotal === 1) {
    //        value = Math.floor(value);
    //    }

    //    return value;

    //}

    correctValueDefaultRang(value: number): number {


        const localMin = Math.min(this.min, this.defaultMinValues[this._isUnitTotal]);

        if (typeof value === 'string') {
            value = FormattingUtils.stringToNum(value);
        }

        if (value === undefined || value === null || value < localMin) {
            value = localMin;
        }

        if (value > this.defaultMaxValues[this._isUnitTotal]) {
            value = this.defaultMaxValues[this._isUnitTotal];
        }

        if (this._isUnitTotal === 1) {
            value = Math.floor(value);
        }

        return value;
    }

    fixDisplayedDecimalPlaces() {

        const cursorPos = this.inputField.nativeElement.selectionStart;

        if (this._isUnitTotal === 0) {

            const separated = this._value.toString().split('.');
            let fixed = separated[0];

            if (separated.length > 1) {
                separated[1] = (separated[1] + '0000').slice(0, 4);
                fixed = separated.join(',');
                this._value = Number(fixed.replace(',', '.'));
            }

            this.inputField.nativeElement.value = this._value.toFixed(4).replace('.', ',');

        } else {
            this._value = Math.floor(this._value);
            this.inputField.nativeElement.value = FormattingUtils.numToString(this._value);
        }



        this.inputField.nativeElement.setSelectionRange(cursorPos, cursorPos);
    }


    handleDeleting(value) {
        this.valueToDelete = FormattingUtils.stringToNum(value);
    }


    // Methods of angular forms api interfaces.
    // Methods are using by forms api. Registered callbacks informs forms api about important changes and fires proper api methods.
    // Eg. informs about changing validation conditions, about changing control value, and fires revalidation.

    /**
     * Setting current value to control. Method is used also by angular forms api, eg. by ngModelChange event
     */
    writeValue(value: number): void {

        if (value !== null) {
            //method is called by ngModelChange event and onInput event without using setter, so setter is used here
            this.value = value;
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
        this.onValidatorChange = fn;
    }

}
