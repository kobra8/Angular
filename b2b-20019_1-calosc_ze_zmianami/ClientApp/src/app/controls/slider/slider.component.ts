import { Component, ViewEncapsulation, Input, ElementRef, AfterContentInit, Output, EventEmitter, OnDestroy, HostBinding } from '@angular/core';
import { tns } from 'tiny-slider/src/tiny-slider.module';
import { ConfigService } from '../../model/config.service';

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    host: { class: 'app-slider' },
    encapsulation: ViewEncapsulation.None
})
export class SliderComponent implements AfterContentInit, OnDestroy {



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

    @Input()
    zoom: boolean;

    @Input()
    areThumbs: boolean;

    @Output()
    indexChange: EventEmitter<{ index: number, realIndex: number, slide: Element }>;


    @Output()
    init: EventEmitter<any>;

    @HostBinding('style.display')
    display: string;

    noSlider: boolean;
    slider: any;
    thumbs: any;
    zoomSlider: any;
    zoomTrigger: any;
    originalSlides: HTMLUnknownElement[];

    @HostBinding('class.in-zoom')
    zoomOpened: boolean;

    currentRealIndex: number;

    constructor(private el: ElementRef<HTMLUnknownElement>, private configService: ConfigService) {
        this.init = new EventEmitter<any>();
        this.noSlider = false;
        this.indexChange = new EventEmitter<{ index: number, realIndex: number, slide: Element }>();
    }


    ngAfterContentInit(): void {
        //viev must be fully initialized becouse rebinding destorys the slider

        this.initSlider();

    }

    initSlider(): void {

        const sliderDom: HTMLUnknownElement = this.el.nativeElement.querySelector('.slides-wrapper');

        this.noSlider = sliderDom && sliderDom.children.length <= 1;

        this.currentRealIndex = 0;

        const thumbsDom = this.el.nativeElement.querySelector('[data-id="thumbs"]');

        if (sliderDom) {

            this.originalSlides = [];

            (<HTMLUnknownElement[]>Array.from(sliderDom.children)).forEach((el, i) => {

                el.dataset.realIndex = i + '';
                this.originalSlides.push(<HTMLUnknownElement>el.cloneNode(true));

                if (this.areThumbs) {
                    thumbsDom.appendChild(el.cloneNode(true));
                }
            });

            if (sliderDom.children.length > 1) {

                this.slider = tns({
                    container: sliderDom,
                    mode: this.mode || 'carousel',
                    axis: this.axis || 'horizontal',
                    items: this.items || 2,
                    slideBy: this.slideBy || 2,
                    controls: (this.controls === undefined) ? true : this.controls,
                    controlsText: this.controlsText || ['', ''],
                    nav: (this.nav !== false && !this.areThumbs) ? true : false,
                    navContainer: this.navContainer || false,
                    speed: this.speed || 400,
                    autoplay: !!this.autoplay,
                    autoplayTimeout: this.autoplayTimeout || 5000,
                    autoplayHoverPause: (this.autoplayHoverPause === undefined) ? true : this.autoplayHoverPause,
                    lazyLoad: false,
                    loop: (this.loop === undefined) ? true : this.loop,
                    responsive: this.responsive
                });


                this.init.emit(this.slider);

                if (this.zoom) {
                    document.querySelectorAll('.tns-ovh')[0].classList.add('loupe-hover', 'ti-zoom-in');
                }

                this.slider.events.off('indexChanged');
                this.slider.events.on('indexChanged', (e) => {

                    if (this.areThumbs) {
                        this.currentRealIndex = Number(e.slideItems[e.index].dataset.realIndex);

                        const thumbsLength = thumbsDom.children.length;

                        for (let i = 0; i < thumbsLength; i++) {
                            if (Number((<HTMLUnknownElement>thumbsDom.children[i]).dataset.realIndex) === this.currentRealIndex) {
                                thumbsDom.children[i].classList.add('real-active');
                            } else {
                                thumbsDom.children[i].classList.remove('real-active');
                            }
                        }

                        this.thumbs.goTo(this.currentRealIndex);
                    }

                    this.indexChange.emit({ index: e.index, realIndex: this.currentRealIndex, slide: e.slideItems[e.index] });

                });
            } else if (this.zoom) {
                sliderDom.children[0].classList.add('loupe-hover', 'ti-zoom-in');
            }
        }

        if (this.zoom) {
            this.zoomTrigger = this.el.nativeElement.querySelector('.tns-ovh') || this.el.nativeElement.querySelector('.slides-wrapper');
            this.zoomTrigger.addEventListener('click', () => { this.toggleZoom(); });
        }

        if (this.areThumbs && this.originalSlides.length > 1) {

            const thumbsLength = thumbsDom.children.length;


            for (let i = 0; i < thumbsLength; i++) {
                (<HTMLUnknownElement>thumbsDom.children[i]).dataset.realIndex = i + '';
            }

            this.thumbs = tns({
                container: thumbsDom,
                mode: this.mode || 'carousel',
                axis: this.axis || 'horizontal',
                items: 3,
                slideBy: this.slideBy || 1,
                controls: (this.controls === undefined) ? true : this.controls,
                controlsText: this.controlsText || ['', ''],
                nav: false,
                speed: this.speed || 400,
                autoplay: false,
                lazyLoad: false,
                loop: (this.loop === undefined) ? true : this.loop,
                responsive: this.responsive
            });

            const newThumbsLength = thumbsDom.children.length;

            for (let i = 0; i < newThumbsLength; i++) {

                if (Number((<HTMLUnknownElement>thumbsDom.children[i]).dataset.realIndex) === 0) {
                    thumbsDom.children[i].classList.add('real-active');
                }

                thumbsDom.children[i].removeEventListener('click', () => { });
                thumbsDom.children[i].addEventListener('click', (e: MouseEvent & { currentTarget: HTMLUnknownElement }) => {
                    this.slider.goTo(e.currentTarget.dataset.realIndex);

                    if (this.zoomSlider) {
                        this.zoomSlider.goTo(e.currentTarget.dataset.realIndex);
                    }
                });

            }
        }


    }


    initZoom() {

        const zoomDom = this.el.nativeElement.querySelector('[data-id="zoom-slides"]');

        if (zoomDom.children.length === 0) {
            this.originalSlides.forEach(el => {
                const newNode = el.cloneNode(true);
                const imgNode = (<HTMLUnknownElement>newNode).querySelector<HTMLImageElement>('img');
                imgNode.src = imgNode.src.replace(/width=(\d*)&height=(\d*)/gi, 'width=2048&height=2048');
                zoomDom.append(newNode);
            });
        }

        const zoomLength = zoomDom.children.length;

        if (this.originalSlides.length > 1) {

            for (let i = 0; i < zoomLength; i++) {
                (<HTMLUnknownElement>zoomDom.children[i]).dataset.realIndex = i + '';
            }

            this.zoomSlider = tns({
                container: zoomDom,
                mode: this.mode || 'carousel',
                axis: this.axis || 'horizontal',
                items: this.items || 2,
                slideBy: this.slideBy || 2,
                controls: (this.controls === undefined) ? true : this.controls,
                controlsText: this.controlsText || ['', ''],
                nav: (this.nav === true && !this.thumbs) ? true : false,
                navContainer: this.navContainer || false,
                speed: this.speed || 400,
                autoplay: !!this.autoplay,
                autoplayTimeout: this.autoplayTimeout || 5000,
                autoplayHoverPause: (this.autoplayHoverPause === undefined) ? true : this.autoplayHoverPause,
                lazyLoad: false,
                loop: (this.loop === undefined) ? true : this.loop,
                responsive: this.responsive
            });


            this.thumbs.goTo(this.currentRealIndex);

            this.zoomSlider.events.off('indexChanged');
            this.zoomSlider.events.on('indexChanged', (e) => {

                this.currentRealIndex = Number(e.slideItems[e.index].dataset.realIndex);
                this.slider.goTo(this.currentRealIndex);
            });
        }

    }


    toggleZoom(visibility?: boolean) {
        if (visibility === undefined) {
            visibility = !this.zoomOpened;
        }

        this.zoomOpened = visibility;


        if (this.zoomOpened) {
            this.configService.bodyRef.style.overflowY = 'hidden';
        } else {
            this.configService.bodyRef.style.overflowY = 'scroll';
        }

        setTimeout(() => {

            if (!this.zoomSlider && this.zoomOpened) {
                this.initZoom();
            }

            if (this.zoomSlider) {
                this.zoomSlider.goTo(this.currentRealIndex);
            }
        }, 0);
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

        const thumbsDom = this.el.nativeElement.querySelector('app-slider-thumbs');

        if (this.thumbs && thumbsDom && thumbsDom.children.length > 0) {

            const thumbsLength = thumbsDom.children.length;

            for (let i = 0; i < thumbsLength; i++) {
                thumbsDom.children[i].removeEventListener('click', () => { });
            }

            try {
                this.thumbs.destroy();
            } catch (err) {
                //[IE <= 11 only] throws undefined DOM element error
                this.thumbs.pause();
            }

        }


        if (this.zoomSlider) {

            this.zoomTrigger.removeEventListener('click', () => { });
            this.zoomSlider.events.off('indexChanged');

            try {
                this.zoomSlider.destroy();
            } catch (err) {
                //[IE <= 11 only] throws undefined DOM element error
                this.zoomSlider.pause();
            }
        }

    }




}
