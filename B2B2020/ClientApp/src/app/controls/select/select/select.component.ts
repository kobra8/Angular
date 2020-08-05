import { Component, Output, EventEmitter, Input, QueryList, ContentChildren, OnDestroy, HostBinding, ViewEncapsulation, forwardRef, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, AfterViewInit, AfterContentInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { b2bShared } from 'src/integration/b2b-shared';
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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {


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

    @Input()
    isValid: boolean;

    @Input()
    alwaysRefreshLabel: boolean;

    label: any;
    activeDescendantId: string;

    @HostBinding('class.opened')
    private _isOpened: boolean;

    @ViewChild('trigger', { static: true })
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

    @Output()
    editLinkClicked: EventEmitter<void>;

    private wasOpened: boolean;
    private firstChange: boolean;
    showEditLink: boolean;

    @HostBinding('class.disabled')
    disabled: boolean;

    @ViewChild('optionsContainer', { static: true })
    optionsContainer: ElementRef<HTMLUnknownElement>;


    private _options: QueryList<OptionComponent>;

    private optionsClickSubscriptions: Subscription[];
    private optionsLabelChangedSubscriptions: Subscription[];

    @ContentChildren(OptionComponent)
    set options(contentChildren: QueryList<OptionComponent>) {

        if (contentChildren && contentChildren.length > 0) {

            if (this.optionsClickSubscriptions && this.optionsClickSubscriptions.length > 0) {
                this.unsubscribeClickForAllOptions();
            }

            this._options = contentChildren;

            if (!this.initialLabel) {

                if (this.value === undefined) {
                    this.writeValue(this._options.first.value);
                }

                if (this.value !== undefined && this.label === undefined) {
                    this.updateLabel();
                }
            }

            if (this.alwaysRefreshLabel && this.value && this.label) {
                this.updateLabel();
            }

            this._options.forEach((item, i) => {

                if (item.value === this.value) {
                    this.updateLabel();
                }

                this.setOptionAccessibilityProperties(item, i);

                const clickSub = item.clickValue.subscribe((model: b2bShared.SelectOptionChangeModel) => {

                    this.label = model.label;
                    this.activeDescendantId = model.id;
                    this.showEditLink = model.hasEditLink;
                    this.changeMiddleware(model.value);

                });
                this.optionsClickSubscriptions.push(clickSub);

                const labelChangedSub = item.labelChanged.subscribe(res => {
                    if (this.value === res.value) {
                        this.updateLabel();
                    }
                });
                this.optionsLabelChangedSubscriptions.push(labelChangedSub);
            });

            this.focusSelectedOption();
            setTimeout(this.fixWebsiteGridHeight.bind(this), 0);
        } else {
            this.hideLabel();
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
        this.optionsLabelChangedSubscriptions = [];
        this.isValid = true;
        this.showEditLink = false;

        this.editLinkClicked = new EventEmitter<void>();
    }

    ngAfterViewInit() {


        if (!this.initialLabel && this._options && this._options.length > 0 && !this.label) {
            this.updateLabel();

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

            if (this._options && this._options.length > 0) {
                this.updateLabel();
            }

            window.setTimeout(() => {
                if (this.onChangeCallback) {
                    this.onChangeCallback(this.value);
                }
            }, 0);

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

            window.setTimeout(() => {
                if (this.onChangeCallback) {
                    this.onChangeCallback(this.value);
                }
                this.changeValue.emit(this.value);
            }, 0);

        }
    }

    updateLabel() {

        window.setTimeout(() => {
            let selected = this._options.find(item => item.value === this.value);

            if (!selected) {
                selected = this._options.first;
            }

            this.label = selected.label;
            this.showEditLink = selected.hasEditLink;
            this.labelChange.emit();
            this.changeDetector.markForCheck();
        }, 200);

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
                this.configService.bodyRef.classList.remove('select-opened');
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
                this.configService.bodyRef.classList.add('select-opened');
            }

            this.focusSelectedOption();

            this.open.emit();

        } else if (this.configService.isMobile) {

            this.configService.bodyRef.classList.remove('select-opened');

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

        if (this._isOpened && this._options && this._options.length > 0) {
            let selected = this._options.find(opt => opt.value === this.value);

            if (!selected) {
                selected = this._options.first;
            }

            window.setTimeout(selected.el.nativeElement.focus.bind(selected.el.nativeElement), 0);
        }
    }


    fixWebsiteGridHeight() {

        const refs = document.querySelectorAll<HTMLUnknownElement>('[fixheightwhenselectopened]');

        refs.forEach(elToFix => {

            if (!this._isOpened) {
                elToFix.style.height = 'auto';
                return;
            }

            if (this.optionsContainer && this.optionsContainer.nativeElement) {
                const websiteGridBottom = elToFix.getBoundingClientRect().bottom;

                const optionsContainerBottom = this.optionsContainer.nativeElement.getBoundingClientRect().bottom;

                if (optionsContainerBottom > websiteGridBottom) {

                    const diff = optionsContainerBottom - websiteGridBottom;
                    elToFix.style.height = elToFix.clientHeight + diff + 'px';
                } else {
                    elToFix.style.height = 'auto';
                }
            }
        });
        
    }

    private hideLabel() {
        this.label = undefined;
        this.initialLabel = undefined;
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

    unsubscribeLabelChangedForAllOptions() {
        this.optionsLabelChangedSubscriptions.forEach(sub => {
            sub.unsubscribe();
        });
        this.optionsLabelChangedSubscriptions = [];
    }

    onClickEditLink() {
        this.editLinkClicked.emit();
        this.changeVisibility(false);
    }

    ngOnDestroy(): void {
        this.unsubscribeClickForAllOptions();
        this.unsubscribeLabelChangedForAllOptions();
    }

}
