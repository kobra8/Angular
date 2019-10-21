
import {fromEvent as observableFromEvent,  Subscription} from 'rxjs';
import { Directive, Input, ElementRef, OnDestroy, Output, EventEmitter, AfterContentInit } from '@angular/core';
import { UiUtils } from '../ui-utils';



@Directive({
    selector: '[appLazy]'
})
export class LazySrcDirective implements AfterContentInit, OnDestroy {


    private _lazySrc: string;

    @Input()
    set lazySrc(src) {

        if (src !== this._lazySrc) {
            this._lazySrc = src;

            if (this.el && this.el.nativeElement && this.el.nativeElement.getAttribute('src')) {
                //update src only when any src was loaded before
                this.el.nativeElement.setAttribute('src', src);
            }
        }
        
        
    }

    @Output()
    lazyAction: EventEmitter<void>;

    elementBounding: ClientRect;
    windowHeight: number;

    private scrollSub: Subscription;
    private resizeSub: Subscription;


    constructor(
        private el: ElementRef<HTMLUnknownElement>,
    ) {

        this.windowHeight = UiUtils.getWindowHeight();

        this.lazyAction = new EventEmitter<void>();

        this.scrollSub = observableFromEvent(window, 'scroll').subscribe(() => {

            if (this.checkAndLoad()) {
                this.scrollSub.unsubscribe();
            }

        });

        this.resizeSub = observableFromEvent(window, 'resize').subscribe(() => {

            this.windowHeight = UiUtils.getWindowHeight();

            if (this.checkAndLoad()) {
                this.resizeSub.unsubscribe();
            }

        });
    }

    ngAfterContentInit(): void {
        this.checkAndLoad();
    }


    checkAndLoad(): boolean {

        if (!this.lazyAction.closed) {

            const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            this.elementBounding = this.el.nativeElement.getBoundingClientRect();

            if (this.elementBounding.top >= -50 && this.elementBounding.top <= (scrollOffset + this.windowHeight) + 50) {

                if (this._lazySrc !== undefined) {
                    this.el.nativeElement.setAttribute('src', this._lazySrc);
                }

                this.lazyAction.emit();
                this.lazyAction.unsubscribe();

                return true;
            }

            return false;
        }
        return true;
    }





    ngOnDestroy(): void {

        if (!this.scrollSub.closed) {
            this.scrollSub.unsubscribe();
        }

        if (!this.resizeSub.closed) {
            this.resizeSub.unsubscribe();
        }
    }

}
