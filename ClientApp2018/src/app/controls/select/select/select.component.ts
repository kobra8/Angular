import { Component, Output, EventEmitter, Input, QueryList, ContentChildren, OnDestroy, AfterContentChecked, HostBinding, ViewEncapsulation, forwardRef, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OptionComponent } from '../option/option.component';
import { ConfigService } from '../../../model/config.service';


@Component({
    selector: 'app-select',
    templateUrl: './select.component.html',
    styleUrls: ['./select.component.scss'],
    host: { class: 'app-select' },
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => SelectComponent),
        },
    ]
})
export class SelectComponent implements ControlValueAccessor, AfterContentChecked, OnDestroy {


    @Input()
    value: any;

    @Input()
    initialLabel: any;

    label: any;

    @HostBinding('class.opened')
    private _isOpened: boolean;

    set isOpened(visibility: boolean) {

        if (this._isOpened !== visibility) {
            this.changeVisibility(visibility);
        }
    }

    get isOpened() {
        return this._isOpened;
    }

    private onChangeCallback: Function;
    private onTouchedCallback: Function;

    @Output()
    changeValue: EventEmitter<any>;


    @Output()
    firstOpen: EventEmitter<void>;

    @Output()
    open: EventEmitter<void>;

    private wasOpened: boolean;
    private firstChange: boolean;

    @HostBinding('class.disabled')
    disabled: boolean;

    private _options: QueryList<OptionComponent>;

    @ContentChildren(OptionComponent)
    set options(contentChildren: QueryList<OptionComponent>) {

        this._options = contentChildren;

        if (!this.initialLabel) {

            if (this._options.length > 0 && this.value !== undefined) {
                this.updateLabel();
            }

            
        }

        this._options.forEach(item => {

            item.clickValue.subscribe(value => {

                this.label = value.label;
                this.writeValue(value.value);

            });
        });

    }

    constructor(private configService: ConfigService) {
        this.changeValue = new EventEmitter<any>();
        this.firstOpen = new EventEmitter<void>();
        this.open = new EventEmitter<void>();
        this._isOpened = false;
        this.wasOpened = false;
        this.firstChange = true;
    }


    ngAfterContentChecked(): void {

        if (!this.initialLabel && this._options && this._options.length > 0 && !this.label && this.value === undefined) {

            //if no initial value
            this.label = this._options.first.label;

        }
    }


    writeValue(value: any): void {

        if (value !== null && value !== this.value && this._options && this._options.length > 0) {

            this.value = value;

            if (!this.firstChange || this.initialLabel) {

                this.changeValue.emit(value);
                this.changeVisibility(false);

                if (this.onChangeCallback) {
                    this.onChangeCallback(value);
                }

            }

            this.firstChange = false;

            this.updateLabel();


        } else {
            this.changeVisibility(false);
        }

    }

    updateLabel() {

        let selected = this._options.find(item => item.value === this.value);

        if (!selected) {
            selected = this._options.first;
        }

        this.label = selected.label;
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }


    changeVisibility(isOpen?: boolean) {

        if (isOpen === undefined) {
            this._isOpened = !this._isOpened;
        } else {
            this._isOpened = isOpen;
        }

        if (!this.wasOpened && this._isOpened) {
            this.wasOpened = true;
            this.firstOpen.emit();
        }

        if (this._isOpened) {

            if (this.configService.isMobile) {
                this.configService.bodyRef.style.overflowY = 'hidden';
            }

            this.open.emit();

        } else if (this.configService.isMobile) {

            this.configService.bodyRef.style.overflowY = 'scroll';
        }
    }


    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    ngOnDestroy(): void {

        this._options.forEach(item => {
            item.clickValue.unsubscribe();
        });
    }

}
