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

            this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.r.translations.homePageContent);

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



