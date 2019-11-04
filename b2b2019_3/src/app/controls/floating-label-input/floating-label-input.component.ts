import { Component, ViewEncapsulation, Input, EventEmitter, ViewChild, ElementRef, Output, forwardRef, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-floating-label-input',
    templateUrl: './floating-label-input.component.html',
    styleUrls: ['./floating-label-input.component.scss'],
    host: { class: 'app-floating-label-input' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FloatingLabelInputComponent),
            multi: true
        }
    ]
})
export class FloatingLabelInputComponent implements ControlValueAccessor  {

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
    maxlength: number;

    @Input()
    minlength: number;

    @Input() @HostBinding('class.disabled')
    disabled: boolean;

    @Input()
    ariaLabel: string;

    @Input()
    autofocus: boolean;

    @Input()
    tabindex: number;

    @Input()
    autocomplete: string;

    @ViewChild('inputField', { static: true })
    inputField: ElementRef<HTMLInputElement>;

    private onChange: Function;
    private onTouch: Function;

    constructor(public r: ResourcesService, private changeDetector: ChangeDetectorRef) {
        this.inputChanged = new EventEmitter<any>();

        if (this.type === undefined) {
            this.type = 'text';
        }

        if (this.type === 'text' && (this.value === null || this.value === undefined)) {
            this.value = '';
        }

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


    /**
     * ControlValueAccessor interface method. It's calling when angular calls ngModelChange event.
     * ControlValueAccessor interface makes custom form fields compatible with angular forms api.
     */
    writeValue(value: any): void {

        if (value === null || value === undefined) {
            if (this.type === 'text') {
                value = '';
            } else {
                return;
            }
        }

        if (this.value !== value) {

            this.value = value;

            if (this.onChange) {
                this.onChange(value);
            }

            this.changeDetector.markForCheck();
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

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

}
