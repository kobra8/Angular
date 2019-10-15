import { Component, ViewEncapsulation, OnDestroy, HostBinding, ComponentFactoryResolver, AfterViewInit, ViewContainerRef, ViewChild, ComponentRef, Type } from '@angular/core';
import { ResourcesService } from '../../src/app/model/resources.service';
import { ConfigService } from '../../src/app/model/config.service';
import { SliderComponent } from '../../src/app/controls/slider/slider.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiUtils } from '../../src/app/helpers/ui-utils';
import { AccountService } from '../../src/app/model/account.service';

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

    @ViewChild('container', { read: ViewContainerRef })
    container: ViewContainerRef;

    safeContent: SafeHtml;
    dynamicSliders: ComponentRef<SliderComponent>[];

    testHomepageContent =
     `
        <template appSlider [items]="1" [slideBy]="1" [autoplay]="true" [autoplayTimeout]="6000">
            <div class="slide">
                <img src="ClientApp/assets/images/slider/slide1.png" alt="Platforma sprzedaży B2B">
                <div class="caption">
                <p class="desc">Bruk-Bet ® </</p>
                <p class="desc-logged">Witamy w systemie sprzedaży firmy Bruk-Bet Sp. z o.o.</br> oraz Bruk-Bet SOLAR</p>
                </div>
            </div>
            <div class="slide">
                <a href="https://www.bruk-bet.pl/produkty/kostka-brukowa" target="_blank">
                    <img src="ClientApp/assets/images/slider/slide2.jpg" alt="Platforma sprzedaży B2B">
                </a>
            </div>
            <div class="slide">
                <a href="https://www.bruk-bet.pl/produkty/plyty-tarasowe/rezydencja-romantica" target="_blank">
                    <img src="ClientApp/assets/images/slider/slide3.jpg" alt="Platforma sprzedaży B2B">
                </a>
            </div>
            <div class="slide">
                <a href="https://solar.bruk-bet.pl/panele-moduly-fotowoltaiczne/glass-glass/" target="_blank">
                    <img src="ClientApp/assets/images/slider/slide4.jpg" alt="Platforma sprzedaży B2B">
                </a>
            </div>
            <div class="slide">
                <a href="https://solar.bruk-bet.pl/panele-moduly-fotowoltaiczne/prestige/bem-310wp/" target="_blank">
                    <img src="ClientApp/assets/images/slider/slide5.jpg" alt="Platforma sprzedaży B2B">
                </a>
            </div>
        </template>`;


    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
        public accountService: AccountService,
        private componentFactoryResolver: ComponentFactoryResolver,
        private domSanitizer: DomSanitizer
    ) {
        this.r = resourcesService;
    }

    ngAfterViewInit(): void {
        this.dynamicSliders = [];
        this.configService.loaderSubj.next(false);
        this.groupsOpened = false;

        this.configService.permissionsPromise.then(() => {
            this.isSidebar = this.configService.permissions.showProducts;
        });


        this.r.translationsPromise.then(() => {
            // Get html homePage template form database translations and pass to slider component
           //  this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.r.translations.homePageContent);
             this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.testHomepageContent);

            window.setTimeout(() => {
                const sliders = this.container.element.nativeElement.querySelectorAll('[appslider], [appSlider]');
                sliders.forEach(slider => {
                    this.dynamicSliders.push(UiUtils.createDynamicComponent(slider, this.container, SliderComponent, this.componentFactoryResolver));
                });

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
    }
}



