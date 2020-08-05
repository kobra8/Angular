import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { UiUtils } from '../../../helpers/ui-utils';
import { b2bShared } from 'src/integration/b2b-shared';

@Component({
    selector: 'app-option',
    templateUrl: './option.component.html',
    styleUrls: ['./option.component.scss'],
    host: { class: 'app-option' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionComponent {

    @Input()
    value: any;

    @Input()
    id: string;

    private _label: any;
    @Input()
    set label(value: any) {
        if (this._label !== value) {
            this._label = value;
            this.labelChanged.emit({ value: this.value, label: this._label });
        }
    }

    get label() {

        if (this._label) {
            return this._label;
        }

        if (this.el && this.el.nativeElement) {
            return this.el.nativeElement.innerText.trim();
        }

        return '';
    }

    @Input()
    hasEditLink: boolean;

    @Output()
    clickValue: EventEmitter<b2bShared.SelectOptionChangeModel>;

    @Output()
    labelChanged: EventEmitter<{ value: any, label: string }>;

    constructor(public el: ElementRef<HTMLUnknownElement>) {
        this.clickValue = new EventEmitter<b2bShared.SelectOptionChangeModel>();
        this.labelChanged = new EventEmitter<{ value: any, label: string }>();
    }


    @HostListener('keydown.enter')
    clickMiddleware() {
        const changeModel = this.prepareChangeModel();
        this.clickValue.emit(changeModel);
    }

    private prepareChangeModel(): b2bShared.SelectOptionChangeModel {
        return {
            value: this.value,
            label: this.label,
            id: this.id,
            hasEditLink: this.hasEditLink
        };
    }


    @HostListener('keydown.arrowLeft', ['$event'])
    @HostListener('keydown.arrowUp', ['$event'])
    @HostListener('keydown.arrowDown', ['$event'])
    @HostListener('keydown.arrowRight', ['$event'])
    keyboardNavigation(event: KeyboardEvent & { target: HTMLUnknownElement }) {

        UiUtils.keyboardArrowNavigation(event);

    }
}
