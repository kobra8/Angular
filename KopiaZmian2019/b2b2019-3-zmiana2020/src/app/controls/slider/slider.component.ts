import { Component, ViewChild, ElementRef, AfterContentInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation, EventEmitter, Output, OnDestroy, HostBinding } from '@angular/core';
import { Swiper, Navigation, Pagination, Controller, Autoplay } from 'swiper/dist/js/swiper.esm.js';
import { ConfigService } from 'src/app/model/config.service';

Swiper.use([Swiper, Navigation, Pagination, Controller, Autoplay]);

@Component({
    selector: 'app-slider',
    templateUrl: './slider.component.html',
    styleUrls: ['./slider.component.scss'],
    host: { class: 'app-slider app-swiper' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderComponent implements AfterContentInit, OnDestroy {

    @Input()
    thumbs: boolean;

    @Input()
    zoom: boolean;

    @Input() @HostBinding('class.loop')
    loop: boolean;

    @Input()
    axis: 'horizontal' | 'vertical';

    @Input()
    items: number;

    @Input()
    slideBy: number;

    @Input()
    controls: boolean;

    @Input() @HostBinding('class.slider-nav')
    nav: boolean;

    @Input()
    speed: number;

    @Input()
    autoplay: boolean;

    @Input()
    autoplayTimeout: number;

    @Input()
    autoplayHoverPause: boolean;

    @Input()
    responsive: any;

    @Input() @HostBinding('class.dom-changes')
    domChanges: boolean;

    @Output()
    indexChange: EventEmitter<number>;

    @Output()
    init: EventEmitter<any>;

    @Output()
    domChange: EventEmitter<any>;

    zoomVisibility: boolean;

    swiper;
    slidesAmount: number;
    private thumbsSwiper;
    private zoomSwiper;
    private zoomThumbsSwiper;

    private slidesForZoom: HTMLDivElement[];
    private zoomThumbsSlidesPerView: number;
    private centeredZoomThumbs: boolean;
    private loopedSlides: number;

    @ViewChild('slider', { static: true })
    private sliderDom: ElementRef<HTMLDivElement>;

    @ViewChild('slides', { static: true })
    private slidesCnt: ElementRef<HTMLDivElement>;

    @ViewChild('thumbsSlider', { static: false })
    private thumbsDom: ElementRef<HTMLDivElement>;

    @ViewChild('thumbsSlides', { static: false })
    private thumbsSlidesCnt: ElementRef<HTMLDivElement>;

    @ViewChild('zoomSlider', { static: false })
    private zoomDom: ElementRef<HTMLDivElement>;

    @ViewChild('zoomSlides', { static: false })
    private zoomSlidesCnt: ElementRef<HTMLDivElement>;

    @ViewChild('zoomThumbsSlider', { static: false })
    private zoomThumbsDom: ElementRef<HTMLDivElement>;

    @ViewChild('zoomThumbsSlides', { static: false })
    private zoomThumbsSlidesCnt: ElementRef<HTMLDivElement>;

    private sliderDisabled: boolean;

    constructor(private changeDetector: ChangeDetectorRef, public configService: ConfigService) {

        this.init = new EventEmitter<any>();
        this.indexChange = new EventEmitter<number>();
        this.domChange = new EventEmitter<void>();
        this.loopedSlides = 2;
    }

    ngAfterContentInit(): void {

        this.slidesAmount = this.slidesCnt.nativeElement.children.length;
        this.zoomThumbsSlidesPerView = this.slidesAmount > 3 ? 3 : this.slidesAmount;
        this.centeredZoomThumbs = this.slidesAmount !== 2;


        this.setDefaults();

        window.setTimeout(() => {

            if (this.thumbs && this.slidesAmount > 1) {
                this.createThumbsSlider();
            }

            if (this.zoom) {
                this.prepareSlidesForZoom();
            }

            if (this.slidesAmount > 1) {

                this.createMainSlider();


                if (this.thumbs) {
                    this.swiper.controller.control = this.thumbsSwiper;
                    this.thumbsSwiper.controller.control = this.swiper;
                }
            }



            this.changeDetector.markForCheck();

        }, 0);

    }


    createThumbsSlider() {

        if (!this.thumbsSwiper) {
            for (let i = 0; i < this.slidesAmount; i++) {
                const slideCopy = <HTMLImageElement>this.slidesCnt.nativeElement.children.item(i).cloneNode(true);
                slideCopy.classList.add('swiper-slide');
                const sizeString = slideCopy.querySelector<HTMLImageElement>('img').src.replace(/width=\d*&height=\d*/gi, 'width=82&height=82');
                slideCopy.querySelector<HTMLImageElement>('img').src = sizeString;
                this.thumbsSlidesCnt.nativeElement.append(slideCopy);
            }

            this.thumbsSwiper = new Swiper(this.thumbsDom.nativeElement, {
                centeredSlides: this.centeredZoomThumbs,
                slidesPerView: this.zoomThumbsSlidesPerView,
                touchRatio: 0.2,
                slideToClickedSlide: true,
                loop: this.loop && !this.domChanges,
                loopedSlides: this.loopedSlides,
                //navigation: {
                //    nextEl: '.swiper-button-next',
                //    prevEl: '.swiper-button-prev',
                //}
            });
        }
    }

    createZoomSlider() {

        if (!this.zoomSwiper) {
            this.slidesForZoom.forEach(slide => {

                this.zoomSlidesCnt.nativeElement.append(slide);

                if (this.slidesAmount > 1) {
                    const slideCopy = <HTMLImageElement>slide.cloneNode(true);
                    slideCopy.classList.add('swiper-slide');
                    const sizeString = slideCopy.querySelector<HTMLImageElement>('img').src.replace(/width=\d*&height=\d*/gi, 'width=82&height=82');
                    slideCopy.querySelector<HTMLImageElement>('img').src = sizeString;
                    this.zoomThumbsSlidesCnt.nativeElement.append(slideCopy);
                }

            });

            this.slidesForZoom = undefined;

            if (this.slidesAmount > 1) {
                this.zoomSwiper = new Swiper(this.zoomDom.nativeElement, {
                    slidesPerView: 1,
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    loop: this.loop && !this.domChanges,
                    loopedSlides: this.loopedSlides
                });


                this.zoomThumbsSwiper = new Swiper(this.zoomThumbsDom.nativeElement, {
                    centeredSlides: this.centeredZoomThumbs,
                    slidesPerView: this.zoomThumbsSlidesPerView,
                    touchRatio: 0.2,
                    slideToClickedSlide: true,
                    loop: this.loop && !this.domChanges,
                    loopedSlides: this.loopedSlides,
                    //navigation: {
                    //    nextEl: '.swiper-button-next',
                    //    prevEl: '.swiper-button-prev',
                    //}
                });


                this.zoomSwiper.controller.control = this.zoomThumbsSwiper;
                this.zoomThumbsSwiper.controller.control = this.zoomSwiper;
            }
        }
    }


    createMainSlider() {

        if (!this.swiper) {
            for (let i = 0; i < this.slidesAmount; i++) {
                const slide = <HTMLDivElement>this.slidesCnt.nativeElement.children.item(i);
                slide.classList.add('swiper-slide');
            }

            const swiperConfig = this.adaptConfigWithoutResponsive(this.collectInputs());

            if (this.loop) {
                swiperConfig.loopedSlides = this.loopedSlides;
            }

            swiperConfig.watchOverflow = true;

            if (this.responsive) {
                const breakpoints = {};

                Object.keys(this.responsive).forEach(key => {
                    breakpoints[key] = this.adaptConfigWithoutResponsive(this.responsive[key]);
                });

                swiperConfig.breakpoints = breakpoints;
            }

            this.swiper = new Swiper(this.sliderDom.nativeElement, swiperConfig);

            this.sliderDisabled = this.checkIsDisabled();

            if (this.domChanges) {
                this.swiper.params.loop = false;
            }

            this.swiper.on('slideChange', (e) => {
                this.indexChange.next(this.swiper.realIndex);
            });

            this.swiper.on('init', () => {
                this.init.next();
            });


            if (this.swiper.observer && this.domChanges) {
                this.swiper.on('observerUpdate', () => {

                    this.swiper.detachEvents();
                    for (let i = 0; i < this.slidesAmount; i++) {
                        const slide = <HTMLImageElement>this.slidesCnt.nativeElement.children.item(i);
                        if (!slide.classList.contains('swiper-slide')) {
                            slide.classList.add('swiper-slide');

                        }
                    }

                    this.swiper.update();
                    this.swiper.slideReset(20, false);
                    //this.swiper.attachEvents();

                    this.sliderDisabled = this.checkIsDisabled();

                    this.domChange.emit();
                    this.changeDetector.markForCheck();

                });
            }
        }
    }

    prepareSlidesForZoom() {

        this.slidesForZoom = [];

        for (let i = 0; i < this.slidesAmount; i++) {
            const slideCopy = <HTMLDivElement>this.slidesCnt.nativeElement.children.item(i).cloneNode(true);
            slideCopy.classList.add('swiper-slide');
            const sizeString = slideCopy.querySelector<HTMLImageElement>('img').src.replace(/width=(\d+)&height=(\d+)/gi, 'width=2048&height=2048');
            slideCopy.querySelector<HTMLImageElement>('img').src = sizeString;
            this.slidesForZoom.push(slideCopy);
        }
    }


    toogleZoom(visibility: boolean) {

        this.zoomVisibility = visibility === undefined ? !this.zoomVisibility : visibility;

        if (!this.zoomSwiper && this.zoomVisibility) {

            window.setTimeout(() => {
                this.createZoomSlider();
                this.zoomSwiper.slideToLoop(this.swiper.realIndex);
                this.changeDetector.markForCheck();
            }, 0);

            return;
        }

        if (this.zoomVisibility) {
            this.zoomSwiper.slideToLoop(this.swiper.realIndex);
        } else {
            this.swiper.slideToLoop(this.zoomSwiper.realIndex);
        }

        this.changeDetector.markForCheck();
    }


    collectInputs() {

        return {
            loop: this.loop && !this.domChanges,
            axis: this.axis,
            items: this.items,
            slideBy: this.slideBy,
            controls: this.controls,
            nav: this.nav,
            speed: this.speed,
            autoplay: this.autoplay,
            autoplayTimeout: this.autoplayTimeout,
            autoplayHoverPause: this.autoplayHoverPause,
            responsive: this.responsive,
            observer: this.domChanges,
            observeSlideChildren: this.domChanges
        };
    }

    adaptConfigWithoutResponsive(config) {

        const newConfig: any = {};

        if (config.loop) {
            newConfig.loop = config.loop;
        }

        if (config.axis) {
            newConfig.direction = config.axis;
        }

        if (config.items) {
            newConfig.slidesPerView = Number(config.items);
        }

        if (config.slideBy) {
            newConfig.slidesPerGroup = Number(config.slideBy);
        }

        if (config.controls) {
            newConfig.navigation = {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            };
        }

        if (config.nav) {
            newConfig.pagination = {
                el: '.swiper-pagination',
                type: 'bullets',
                clickable: true
            };
        }

        if (config.speed) {
            newConfig.speed = Number(config.speed);
        }

        if (config.autoplay || config.autoplayTimeout) {
            newConfig.autoplay = {
                delay: config.autoplayTimeout || 5000,
            };
        }

        if (config.responsive) {
            newConfig.breakpoints = config.responsive;
        }

        if (config.observer) {
            newConfig.observer = config.observer;
            newConfig.observeSlideChildren = config.observeSlideChildren;
        }

        return newConfig;
    }


    setDefaults() {

        if (this.loop === undefined) {
            this.loop = true;
        }

        if (this.slideBy === undefined) {
            this.slideBy = 1;
        }

        if (this.controls === undefined) {
            this.controls = true;
        }

        if (this.items === undefined) {
            this.items = 2;
        }


        if (this.nav === undefined) {
            this.nav = true;
        }

        if (this.speed === undefined) {
            this.speed = 500;
        }
    }

    handleFakeLoopNext(e: MouseEvent & { target: HTMLDivElement }) {
        e.preventDefault();

        
        const lastSlide = this.getLastSlideIndex();

        if (this.swiper.activeIndex !== lastSlide) {
            this.swiper.slideNext();
        } else {
            this.swiper.slideTo(0);
        }
    }

    handleFakeLoopPrev(e: MouseEvent & { target: HTMLDivElement }) {
        e.preventDefault();

        const lastSlide = this.getLastSlideIndex();

        if (this.swiper.activeIndex !== 0) {
            this.swiper.slidePrev();
        } else {
            this.swiper.slideTo(lastSlide);
        }
    }

    getLastSlideIndex(): number {

        let lastSlide;
        if (this.swiper.pagination) {
            lastSlide = this.swiper.pagination.bullets.length - 1;
        } else {
            lastSlide = this.swiper.pagination.bullets.length % 2 ? this.swiper.slides.length - 1 : this.swiper.slides.length - 2;
        }

        return lastSlide;
    }

    ngOnDestroy(): void {

        if (this.swiper) {
            this.swiper.detachEvents();
            this.swiper.destroy(true, true);
        }

        if (this.zoomSwiper) {
            this.zoomSwiper.destroy(true, true);
        }

        if (this.thumbsSwiper) {
            this.thumbsSwiper.destroy(true, true);
        }

        if (this.zoomThumbsSwiper) {
            this.zoomThumbsSwiper.destroy(true, true);
        }

    }

    checkIsDisabled(): boolean {
        return !this.swiper.pagination || (this.swiper.pagination.bullets && this.swiper.pagination.bullets.length === 1);

    }
}
