import { Component, ViewEncapsulation, Input, EventEmitter, ViewChild, ElementRef, Output, forwardRef, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef, OnInit} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ResourcesService } from '../../model/resources.service';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { b2bShared } from 'src/integration/b2b-shared';

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
export class FloatingLabelInputComponent implements ControlValueAccessor, OnInit  {

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

    @Input()
    autocompleteConfig: b2bShared.AutocompleteConfig;

    @Output()
    autocompleteOptionSelected: EventEmitter<number>;

    @ViewChild('inputField', { static: true })
    inputField: ElementRef<HTMLInputElement>;

    @ViewChild('trigger', { static: false })
    autoCompleteTrigger: MatAutocompleteTrigger;

    private onChange: Function;
    private onTouch: Function;

    matAutocompleteDisabled: boolean;

    constructor(public r: ResourcesService, private changeDetector: ChangeDetectorRef) {
        this.inputChanged = new EventEmitter<any>();
        this.autocompleteOptionSelected = new EventEmitter<number>();

        if (this.type === undefined) {
            this.type = 'text';
        }

        if (this.type === 'text' && (this.value === null || this.value === undefined)) {
            this.value = '';
        }

        this.matAutocompleteDisabled = true;
    }

    ngOnInit(): void { }


    focusInput() {
        this.inputField.nativeElement.focus();
    }

    blurInput() {
        this.inputField.nativeElement.blur();
    }


    inputMiddleware(value: any) {

        if (value !== this.value) {

            this.writeValue(value);
            this.inputChanged.emit(value);
        }
    }

    private showAutocompletePanelIfRequired(value: any) {
        if (this.autocompleteConfig && this.autocompleteConfig.isAutocompleteEnabled) {
            if (value && value.trim().length >= this.minlength) {
                this.matAutocompleteDisabled = false;
                this.autoCompleteTrigger.openPanel();
            } else {
                this.matAutocompleteDisabled = true;
                this.autocompleteConfig.loading = true;
                this.autoCompleteTrigger.closePanel();
            }
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

            this.showAutocompletePanelIfRequired(value);

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

    selectSearchListOption(selectedOptionId: number) {
        this.autocompleteOptionSelected.emit(selectedOptionId);
        this.blurInput();
    }

    displayAutocompleteFn() {
        return this.value;
    }
}
