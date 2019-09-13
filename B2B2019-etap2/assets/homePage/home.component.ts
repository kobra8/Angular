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

    private homePageContent = '<template appSlider [items]="1" [slideBy]="1">   <div class="slide">       <img src="ClientApp/assets/images/slider/slide1.png" alt="Platforma sprzedaży B2B">       <div class="caption">           <p class="title">Bruk-Bet ® </p>           <p class="desc">Witamy w systemie B2B</p>       </div>   </div>    <div class="slide">     </div></template>';

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

             this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.r.translations.homePageContent);
             // JD
            // if (this.accountService.authenticated) {
            //     this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.homePageContent);
            // } else {
            //     this.safeContent = this.domSanitizer.bypassSecurityTrustHtml(this.homePageContent);
            // }

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



