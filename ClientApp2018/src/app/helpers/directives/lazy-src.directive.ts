import { Directive, Input, ElementRef, OnDestroy, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';

@Directive({
    selector: '[appLazy]'
})
export class LazySrcDirective implements AfterViewInit, OnDestroy {


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
        private el: ElementRef,
        private viewContainerRef: ViewContainerRef,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {

        this.lazyAction = new EventEmitter<void>();
    }

    ngAfterViewInit(): void {


        this.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        this.checkAndLoad();


        this.scrollSub = Observable.fromEvent(window, 'scroll').subscribe(() => {

            if (this.checkAndLoad()) {
                this.scrollSub.unsubscribe();
            }

        });

        this.resizeSub = Observable.fromEvent(window, 'resize').subscribe(() => {

            this.windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

            if (this.checkAndLoad()) {
                this.resizeSub.unsubscribe();
            }

        });

    }


    checkAndLoad(): boolean {

        const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.elementBounding = this.el.nativeElement.getBoundingClientRect();

        if (this.elementBounding.top >= -200 && this.elementBounding.top <= (scrollOffset + this.windowHeight) + 200) {

            if (this._lazySrc !== undefined) {
                this.el.nativeElement.setAttribute('src', this._lazySrc);
            }

            this.lazyAction.emit();

            return true;
        }

        return false;
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
