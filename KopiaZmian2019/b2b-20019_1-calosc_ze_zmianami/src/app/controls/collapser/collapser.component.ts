import { Component, OnInit, Input, Output, EventEmitter, HostBinding, ViewEncapsulation, AfterContentChecked } from '@angular/core';

@Component({
    selector: 'app-collapser',
    templateUrl: './collapser.component.html',
    host: { 'class': 'app-collapser' },
    styleUrls: ['./collapser.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CollapserComponent implements OnInit, AfterContentChecked {


    @HostBinding('class.expanded') @Input()
    isOpen: boolean;

    @Input()
    name: string;

    @Input()
    whenCollapsing: boolean;

    @Input()
    ariaHaspopup: string;

    @Input()
    ariaLabel: string;

    @Input()
    focusContentOnOpen: boolean;

    @Output()
    close: EventEmitter<any>;

    @Output()
    open: EventEmitter<any>;

    @Output()
    firstOpen: EventEmitter<any>;


    wasOpened: boolean;


    constructor() {

        this.focusContentOnOpen = true;

        if (this.whenCollapsing === undefined) {
            this.whenCollapsing = true;
        }

        if (this.isOpen === undefined) {
            this.isOpen = false;
        }

        this.open = new EventEmitter<any>();
        this.close = new EventEmitter<any>();
        this.firstOpen = new EventEmitter<any>();
    }

    ngOnInit() {

        if (this.whenCollapsing === true && this.isOpen === true) {
            this.firstOpen.emit();
            this.wasOpened = true;
        } else {
            this.wasOpened = false;
        }
    }

    ngAfterContentChecked(): void {
        this.selectFirstFocusable();
    }

    changeDisplay() {

        this.isOpen = !this.isOpen;

        if (this.isOpen) {

            if (!this.wasOpened) {
                this.firstOpen.emit();
                this.wasOpened = true;
            }

            this.open.emit();

            if (this.focusContentOnOpen) {
                this.selectFirstFocusable();

            }

        } else {

            this.close.emit();

        }
    }



    selectFirstFocusable() {

        //const focused = this.el.nativeElement.querySelectorAll<HTMLUnknownElement>('collapsing *:focus');

        //if (focused.length === 0) {
        //    window.setTimeout(() => {
        //        const focusables = this.el.nativeElement.querySelectorAll<HTMLUnknownElement>('collapsing input, collapsing a, collapsing label, collapsing [tabindex]');
        //        if (focusables.length > 0) {
        //            focusables.item(0).focus();
        //        }
        //    });
        //}
    }
}
