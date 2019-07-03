import { Component, ViewEncapsulation, OnDestroy, HostBinding, ComponentFactoryResolver, AfterViewInit, ViewContainerRef, ViewChild, ComponentRef, Type } from '@angular/core';
import { ResourcesService } from '../../src/app/model/resources.service';
import { ConfigService } from '../../src/app/model/config.service';
import { SliderComponent } from '../../src/app/controls/slider/slider.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UiUtils } from '../../src/app/helpers/ui-utils';

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

    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
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

            this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.r.translations.homePageContent);

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



