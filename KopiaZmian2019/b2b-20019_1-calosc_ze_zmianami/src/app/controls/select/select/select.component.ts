import { Component, Output, EventEmitter, Input, QueryList, ContentChildren, OnDestroy, AfterContentChecked, HostBinding, ViewEncapsulation, forwardRef, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OptionComponent } from '../option/option.component';
import { ConfigService } from '../../../model/config.service';
import { Subscription } from 'rxjs';


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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent implements ControlValueAccessor, AfterContentChecked, OnDestroy {


    //ControlValueAccessor interface makes custom form fields compatible with angular forms api.
    //ControlValueAccessor enables usage of ngModel and form validation on custom field.

    @Input()
    value: any;

    @Input()
    name: string;

    @Input()
    initialLabel: any;

    @Input()
    ariaLabel: string;

    label: any;
    activeDescendantId: string;

    @HostBinding('class.opened')
    private _isOpened: boolean;

    @ViewChild('trigger')
    private trigger: ElementRef<HTMLButtonElement>;

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

    @Output()
    labelChange: EventEmitter<void>;

    private wasOpened: boolean;
    private firstChange: boolean;

    @HostBinding('class.disabled')
    disabled: boolean;

    @ViewChild('optionsContainer')
    optionsContainer: ElementRef<HTMLUnknownElement>;


    private _options: QueryList<OptionComponent>;

    private optionsClickSubscriptions: Subscription[];

    @ContentChildren(OptionComponent)
    set options(contentChildren: QueryList<OptionComponent>) {

        if (contentChildren) {

            if (this.optionsClickSubscriptions && this.optionsClickSubscriptions.length > 0) {
                this.unsubscribeClickForAllOptions();
            }

            this._options = contentChildren;

            if (!this.initialLabel && this._options.length > 0 && this.value === undefined) {

                this.writeValue(this._options.first.value);
            }

            this._options.forEach((item, i) => {

                this.setOptionAccessibilityProperties(item, i);

                const clickSub = item.clickValue.subscribe(value => {

                    this.label = value.label;
                    this.activeDescendantId = value.id;
                    this.changeMiddleware(value.value);

                });

                this.optionsClickSubscriptions.push(clickSub);
            });

            this.focusSelectedOption();
            setTimeout(this.fixWebsiteGridHeight.bind(this), 0);
        }
    }

    constructor(private configService: ConfigService, private changeDetector: ChangeDetectorRef) {
        this.changeValue = new EventEmitter<any>();
        this.firstOpen = new EventEmitter<void>();
        this.open = new EventEmitter<void>();
        this._isOpened = false;
        this.wasOpened = false;
        this.firstChange = true;
        this.labelChange = new EventEmitter<void>();
        this.optionsClickSubscriptions = [];
    }


    ngAfterContentChecked(): void {

        if (!this.initialLabel && this._options && this._options.length > 0 && !this.label) {
            this.updateLabel();
            this.changeDetector.markForCheck();

        }

    }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.changeVisibility(false);
    }


    setOptionAccessibilityProperties(opt, i) {

        let tabindex = -1;
        const id = `${this.name}-${opt.value}`;


        if ((this.value === undefined && i === 0) || (this.value !== undefined && opt.value === this.value)) {

            this.activeDescendantId = id;
            tabindex = 0;

        }

        opt.id = id;
        opt.el.nativeElement.id = id;
        opt.el.nativeElement.setAttribute('role', 'option');
        opt.el.nativeElement.setAttribute('tabindex', tabindex + '');
    }

    writeValue(value: any): void {

        if (value !== null && value !== undefined && value !== this.value) {

            if (value === '' && (this._options.length === 0 || !this._options.find(opt => opt.value === ''))) {
                return;
            }

            this.value = value;

            window.setTimeout(() => {
                if (this.onChangeCallback) {
                    this.onChangeCallback(this.value);
                }
            }, 0);
            

            if (this._options && this._options.length > 0) {
                this.updateLabel();
            }


        } 
        this.changeVisibility(false);

        this.changeDetector.markForCheck();
    }

    changeMiddleware(value: any) {

        if (value !== null && value !== undefined && value !== this.value) {

            if (value === '' && (this._options.length === 0 || !this._options.find(opt => opt.value === ''))) {
                return;
            }

            this.writeValue(value);

            window.setTimeout(() => { this.changeValue.emit(this.value); }, 0);
            
        }
    }

    updateLabel() {

        let selected = this._options.find(item => item.value === this.value);

        if (!selected) {
            selected = this._options.first;
        }

        this.label = selected.label;
        this.labelChange.emit();
        this.changeDetector.markForCheck();
    }

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }


    changeVisibility(isOpen?: boolean) {

        if (this.disabled) {

            this._isOpened = false;

            if (this.configService.isMobile) {
                this.configService.bodyRef.style.overflowY = 'scroll';
            }

            return;
        }

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

            this.focusSelectedOption();

            this.open.emit();

        } else if (this.configService.isMobile) {

            this.configService.bodyRef.style.overflowY = 'scroll';

        } else {
            if (this._isOpened) {
                window.setTimeout(this.trigger.nativeElement.focus.bind(this.trigger.nativeElement), 0);
            }
        }

        window.setTimeout(this.fixWebsiteGridHeight.bind(this), 0);

    }


    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }


    focusSelectedOption() {

        if (this._isOpened && this._options.length > 0) {
            let selected = this._options.find(opt => opt.value === this.value);

            if (!selected) {
                selected = this._options.first;
            }

            window.setTimeout(selected.el.nativeElement.focus.bind(selected.el.nativeElement), 0);
        }
    }


    fixWebsiteGridHeight() {

        const websiteGridRef = document.querySelector<HTMLUnknownElement>('[fixheightwhenselectopened]');

        if (!this._isOpened) {
            websiteGridRef.style.height = 'auto';
            return;
        }

        if (this.optionsContainer && this.optionsContainer.nativeElement) {
            const websiteGridBottom = websiteGridRef.getBoundingClientRect().bottom;

            const optionsContainerBottom = this.optionsContainer.nativeElement.getBoundingClientRect().bottom;

            if (optionsContainerBottom > websiteGridBottom) {

                const diff = optionsContainerBottom - websiteGridBottom;
                websiteGridRef.style.height = websiteGridRef.clientHeight + diff + 'px';
            } else {
                websiteGridRef.style.height = 'auto';
            }
        }
    }

    /**
     * Unsubcribing click listeners.
     */
    unsubscribeClickForAllOptions() {

        this.optionsClickSubscriptions.forEach(sub => {
            sub.unsubscribe();
        });

        this.optionsClickSubscriptions = [];
    }

    ngOnDestroy(): void {

        this.unsubscribeClickForAllOptions();
    }

}
