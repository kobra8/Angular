import { Component, OnInit, Input, Output, EventEmitter, HostListener, ElementRef, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-option',
    templateUrl: './option.component.html',
    styleUrls: ['./option.component.scss'],
    host: { class: 'app-option' },
    encapsulation: ViewEncapsulation.None
})
export class OptionComponent {

    @Input()
    value: any;

    get label() {

        if (this.el && this.el.nativeElement) {
            return this.el.nativeElement.innerText.trim();
        }

        return '';
    }

    @Output()
    clickValue: EventEmitter<{ value: any, label: string }>;

    constructor(public el: ElementRef) {
        this.clickValue = new EventEmitter<{ value: any, label: string }>();
    }




    @HostListener('click')
    clickMiddleware() {
        this.clickValue.emit({ value: this.value, label: this.label });
    }

}
