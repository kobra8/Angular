import { Component, OnInit, ViewEncapsulation, Input, EventEmitter, ViewChild, ElementRef, Output, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


@Component({
    selector: 'app-floating-label-input',
    templateUrl: './floating-label-input.component.html',
    styleUrls: ['./floating-label-input.component.scss'],
    host: { class: 'app-floating-label-input' },
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FloatingLabelInputComponent),
            multi: true
        }
    ]
})
export class FloatingLabelInputComponent implements OnInit, ControlValueAccessor {

    //ControlValueAccessor interface makes custom form fields compatible with angular forms api.
    //ControlValueAccessor enables usage of ngModel and form validation on custom field.

    @Input()
    type: string;

    @Input()
    name: string;

    @Input()
    required: boolean;

    @Input()
    value: any;

    @Output()
    inputChanged: EventEmitter<string>;

    @Input()
    maxlength: any;

    @ViewChild('inputField')
    inputField: ElementRef;

    //for ControlValueAccessor interface
    private onChange: Function;
    private onTouch: Function;


    constructor() {
        this.inputChanged = new EventEmitter<any>();

        if (this.type === undefined) {
            this.type = 'text';
        }

        if (this.type === 'text' && (this.value === null || this.value === undefined)) {
            this.value = '';
        }
    }


    ngOnInit() {

        

    }

    focusInput() {
        this.inputField.nativeElement.focus();
    }


    inputMiddleware(value: any) {

        if (value !== this.value) {

            this.writeValue(value);
            this.inputChanged.emit(value);
        }
    }

    //for ControlValueAccessor interface

    /**
     * ControlValueAccessor interface method. It's calling when angular calls ngModelChange event.
     * ControlValueAccessor interface makes custom form fields compatible with angular forms api.
     */
    writeValue(value: any): void {

        if (this.type === 'text' && (value === null || value === undefined)) {
            value = '';
        }

        this.value = value;

        if (this.onChange) {
            this.onChange(value);
        }
    }

    /**
     * ControlValueAccessor interface method
     * ControlValueAccessor interface makes custom form fields compatible with angular forms api.
     */
    registerOnChange(fn: any): void {
        this.onChange = fn;
    }


    /**
     * ControlValueAccessor interface method
     * ControlValueAccessor interface makes custom form fields compatible with angular forms api.
     */
    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }



}
