import { Component, ViewEncapsulation, QueryList, ContentChildren, OnDestroy, Input, AfterContentInit, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { UiUtils } from '../../helpers/ui-utils';

@Component({
    selector: 'app-navigable-by-keyboard',
    templateUrl: './navigable-by-keyboard.component.html',
    styleUrls: ['./navigable-by-keyboard.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavigableByKeyboardComponent implements OnDestroy, AfterContentInit {
   
    

    private _navigableOptions: HTMLUnknownElement[];

    private optionsKeySubscriptions: Subscription[];

    @Input()
    focusFirst: boolean;

    /**
     * If navigable element is not focusable, eg. navigable is custom control which contains proper native control,
     * then property name of focusable element refference should be specified.
     */
    @Input()
    focusablePropName: string;


    private currentFocusedIndex;

    @ContentChildren('navigable')
    set navigableOptions(contentChildren: QueryList<any>) {

        if (contentChildren) {

            if (this.optionsKeySubscriptions && this.optionsKeySubscriptions.length > 0) {
                this.unsubscribeAllKeySubscriptions();
            }

            contentChildren.forEach((opt, i) => {

                let properOption = opt;

                if (this.focusablePropName) {
                    properOption = opt[this.focusablePropName].nativeElement;
                }

                properOption.setAttribute('tabindex', (i === 0) ? '0' : '-1');

                this._navigableOptions.push(properOption);
            });

            if (this.focusFirst) {
                this._navigableOptions[0].focus();
            }
        }
    }

    constructor() {
        this.optionsKeySubscriptions = [];
        this._navigableOptions = [];
        this.currentFocusedIndex = 0;
    }


    @HostListener('keydown.arrowLeft', ['$event'])
    @HostListener('keydown.arrowUp', ['$event'])
    keyboardNavigationPrev(e: KeyboardEvent) {

        e.preventDefault();

        if (this._navigableOptions[this.currentFocusedIndex - 1]) {
            this.currentFocusedIndex -= 1;
            this._navigableOptions[this.currentFocusedIndex].focus();
        }

    }

    @HostListener('keydown.arrowDown', ['$event'])
    @HostListener('keydown.arrowRight', ['$event'])
    keyboardNavigationNext(e: KeyboardEvent) {

        e.preventDefault();

        if (this._navigableOptions[this.currentFocusedIndex + 1]) {
            this.currentFocusedIndex += 1;
            this._navigableOptions[this.currentFocusedIndex].focus();
        }

    }


    ngAfterContentInit(): void {
        if (this.focusFirst) {
            this._navigableOptions[0].focus();
        }
    }



    handleKeyboardNav(e: KeyboardEvent & { target: HTMLUnknownElement }) {
        let prev;
        let next;

        this._navigableOptions.forEach((opt, i, array) => {

            if (opt === e.target) {
                prev = array[i - 1] ? array[i - 1] : null;
                next = array[i + 1] ? array[i + 1] : null;
                return;
            }
        });

        UiUtils.keyboardArrowNavigation(e, prev, next);
    }


    unsubscribeAllKeySubscriptions() {

        this.optionsKeySubscriptions.forEach(sub => {
            sub.unsubscribe();
        });

        this.optionsKeySubscriptions = [];
    }


    ngOnDestroy(): void {
        this.unsubscribeAllKeySubscriptions();
    }
}
