import { Component, ViewEncapsulation, OnDestroy, HostBinding, ComponentFactoryResolver, AfterViewInit, ViewContainerRef, ViewChild, ComponentRef, Type, ElementRef } from '@angular/core';
import { ResourcesService } from '../../src/app/model/resources.service';
import { ConfigService } from '../../src/app/model/config.service';
import { SliderComponent } from '../../src/app/controls/slider/slider.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiUtils } from '../../src/app/helpers/ui-utils';
import { LazyImageComponent } from 'src/app/controls/lazy-image/lazy-image.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    host: { class: 'app-home' },
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnDestroy, AfterViewInit {

    r: ResourcesService;

    @HostBinding('class.view-with-sidebar')
    isSidebar: boolean;

    groupsOpened: boolean;

    @ViewChild('container', { read: ViewContainerRef, static: true })
    container: ViewContainerRef;

    safeContent: SafeHtml;
    dynamicSliders: ComponentRef<SliderComponent>[];

    dynamicImages: ComponentRef<LazyImageComponent>[];

    homePageContent = `
    <template appSlider [items]="1" [slideBy]="1" [autoplay]="true" [autoplayTimeout]="6000">
    <div class="slide">
    <img src="ClientApp/assets/images/slider/slide1.png" alt="Platforma sprzedaży B2B">
    <div class="caption">
    <p class="title">Bruk-Bet ® </p>
    <p class="desc">Witamy w systemie sprzedaży firmy Bruk-Bet Sp. z o.o. oraz Bruk-Bet SOLAR</p>
    </div>
    </div>
    <div class="slide">
    <a href="https://www.bruk-bet.pl/produkty/kostka-brukowa&quot; target="_blank">
    <img src="ClientApp/assets/images/slider/slide2.jpg" alt="Platforma sprzedaży B2B">
    </a>
    </div>
    <div class="slide">
    <a href="https://www.bruk-bet.pl/produkty/plyty-tarasowe/rezydencja-romantica&quot; target="_blank">
    <img src="ClientApp/assets/images/slider/slide3.jpg" alt="Platforma sprzedaży B2B">
    </a>
    </div>
    <div class="slide">
    <a href="https://solar.bruk-bet.pl/panele-moduly-fotowoltaiczne/glass-glass/&quot; target="_blank">
    <img src="ClientApp/assets/images/slider/slide4.jpg" alt="Platforma sprzedaży B2B">
    </a>
    </div>
    <div class="slide">
    <a href="https://solar.bruk-bet.pl/panele-moduly-fotowoltaiczne/prestige/bem-310wp/&quot; target="_blank">
    <img src="ClientApp/assets/images/slider/slide5.jpg" alt="Platforma sprzedaży B2B">
    </a>
    </div>
    </template>`;

    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private domSanitizer: DomSanitizer,
        private el: ElementRef
    ) {
        this.r = resourcesService;
    }

    ngAfterViewInit(): void {
        this.dynamicSliders = [];
        this.dynamicImages = [];
        this.configService.loaderSubj.next(false);
        this.groupsOpened = false;


        window.setTimeout(() => {
            this.isSidebar = this.configService.permissions.hasAccessToArticleList;
        }, 0);


        this.r.translationsPromise.then(() => {

          //  this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.r.translations.homePageContent);
            this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.homePageContent);

            window.setTimeout(() => {

                const sliders = this.container.element.nativeElement.querySelectorAll('[appslider], [appSlider], [app-slider]');

                if (sliders.length > 0) {

                    sliders.forEach(slider => {
                        this.dynamicSliders.push(UiUtils.createDynamicComponent(slider, this.container, SliderComponent, this.componentFactoryResolver));
                    });
                }

                const images = this.container.element.nativeElement.querySelectorAll('[applazyimage], [appLazyImage], [app-lazy-image]');

                if (images.length > 0) {
                    images.forEach(image => {
                        this.dynamicImages.push(UiUtils.createDynamicComponent(image, this.container, LazyImageComponent, this.componentFactoryResolver));
                    });
                }

            }, 0);
        });


    }


    handleGroupsVisibility(visibility?: boolean) {

        if (visibility === undefined) {

            this.groupsOpened = !this.groupsOpened;

        } else {

            this.groupsOpened = visibility;
        }
    }

    ngOnDestroy(): void {

        this.dynamicSliders.forEach(slider => {
            UiUtils.destroyDynamicComponent(slider);
        });

        this.dynamicImages.forEach(image => {
            UiUtils.destroyDynamicComponent(image);
        });
    }
}



