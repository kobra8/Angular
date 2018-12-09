import { Component, ViewEncapsulation, Input, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, HostBinding } from '@angular/core';
import { tns } from 'tiny-slider/src/tiny-slider.module';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    host: { class: 'app-slider' },
    encapsulation: ViewEncapsulation.None
})
export class SliderComponent implements AfterViewInit, OnDestroy {



    @Input()
    mode: 'carousel' | 'gallery';

    @Input()
    loop: boolean;

    @Input()
    axis: 'horizontal' | 'vertical';

    @Input()
    items: number;

    @Input()
    slideBy: number;

    @Input()
    controls: boolean;

    @Input()
    controlsText: string[];

    @Input()
    nav: boolean;

    @Input()
    speed: number;

    @Input()
    autoplay: boolean;

    @Input()
    autoplayTimeout: number;

    @Input()
    autoplayHoverPause: number;

    @Input()
    navAsThumbnails: boolean;

    @Input()
    navContainer: string;

    @Input()
    responsive: any;

    @Output()
    indexChange: EventEmitter<{index: number, slide: Element}>;


    @Output()
    init: EventEmitter<any>;

    @HostBinding('style.display')
    display: string;

    private slider: any;

    constructor(private el: ElementRef) {
        this.init = new EventEmitter<any>();
        this.indexChange = new EventEmitter<{ index: number, slide: Element }>();
    }


    ngAfterViewInit(): void {
        //viev must be fully initialized becouse rebinding destorys the slider

        this.initSlider();

    }

    initSlider(): void {
        if (this.el.nativeElement && this.el.nativeElement.children.length > 1) {

            this.slider = tns({
                container: this.el.nativeElement,
                mode: this.mode || 'carousel',
                axis: this.axis || 'horizontal',
                items: this.items || 2,
                slideBy: this.items || 2,
                controls: (this.controls === undefined) ? true : this.controls,
                controlsText: this.controlsText || ['', ''],
                nav: (this.nav === undefined) ? true : this.nav,
                navContainer: this.navContainer || false,
                speed: this.speed || 400,
                autoplay: !!this.autoplay,
                autoplayTimeout: this.autoplayTimeout || 5000,
                autoplayHoverPause: (this.autoplayHoverPause === undefined) ? true : this.autoplayHoverPause,
                lazyLoad: false,
                loop: (this.loop === undefined) ? true : this.loop,
                navAsThumbnails: !!this.navAsThumbnails,
                responsive: this.responsive
            });


            this.init.emit(this.slider);

            this.slider.events.on('indexChanged', (e) => {

                this.indexChange.emit({ index: e.index, slide: e.slideItems[e.index] });
            });

        }
    }

    ngOnDestroy() {

        if (this.slider) {
            this.slider.events.off('indexChanged');

            try {
                this.slider.destroy();
            } catch (err) {

                //[IE <= 11 only] throws undefined DOM element error
                this.slider.pause();

            }

            delete this.slider;
        }

    }

    


}
