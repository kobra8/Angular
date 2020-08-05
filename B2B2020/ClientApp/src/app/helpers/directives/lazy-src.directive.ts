import { Directive, Input, ElementRef, Output, EventEmitter, AfterViewInit } from '@angular/core';


@Directive({
    selector: '[appLazy]'
})
export class LazySrcDirective implements AfterViewInit {


    private static intersectionConfig: IntersectionObserverInit = {
        rootMargin: '50px',
        threshold: 0
    };

    private intersectionObserver: IntersectionObserver;

    private _lazySrc: string;

    @Input()
    set lazySrc(src) {

        if (src !== this._lazySrc) {
            this._lazySrc = src;

            if (this.el && this.el.nativeElement && this.el.nativeElement.getAttribute('src')) {
                //update src only when any src was loaded before
                this.el.nativeElement.setAttribute('src', src);
            }

            this.intersectionObserver.observe(this.el.nativeElement);
        }
    }

    @Output()
    lazyAction: EventEmitter<void>;

    constructor(
        private el: ElementRef<HTMLUnknownElement>,
    ) {

        this.lazyAction = new EventEmitter<void>();
        this.intersectionObserver = new IntersectionObserver(entries => {

            entries.forEach((entry: IntersectionObserverEntry) => {

                if (entry.isIntersecting && entry.target === this.el.nativeElement) {
                    this.callLazyActions();
                    this.intersectionObserver.unobserve(this.el.nativeElement);
                    this.intersectionObserver.disconnect();
                }
            });

        }, {});
    }

    ngAfterViewInit(): void {
        this.intersectionObserver.observe(this.el.nativeElement);
    }



    callLazyActions() {

        if (this._lazySrc !== undefined) {
            this.el.nativeElement.setAttribute('src', this._lazySrc);
        }

        this.lazyAction.emit();
    }
}

