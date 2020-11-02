import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { UiUtils } from '../../../helpers/ui-utils';

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

    get label() {

        if (this.el && this.el.nativeElement) {
            return this.el.nativeElement.innerText.trim();
        }

        return '';
    }

    @Output()
    clickValue: EventEmitter<{ value: any, label: string, id: string }>;

    constructor(public el: ElementRef<HTMLUnknownElement>) {
        this.clickValue = new EventEmitter<{ value: any, label: string, id: string }>();
    }


    
    @HostListener('click')
    @HostListener('keydown.enter')
    clickMiddleware() {
        this.clickValue.emit({ value: this.value, label: this.label, id: this.id });
    }


    @HostListener('keydown.arrowLeft', ['$event'])
    @HostListener('keydown.arrowUp', ['$event'])
    @HostListener('keydown.arrowDown', ['$event'])
    @HostListener('keydown.arrowRight', ['$event'])
    keyboardNavigation(event: KeyboardEvent & { target: HTMLUnknownElement }) {

        UiUtils.keyboardArrowNavigation(event);
        
    }

}
