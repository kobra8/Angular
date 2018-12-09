import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChildren, QueryList, ElementRef, AfterViewChecked } from '@angular/core';
import { ResourcesService } from '../../src/app/model/resources.service';
import { AccountService } from '../../src/app/model/account.service';
import { tns } from 'tiny-slider/src/tiny-slider.module';
import { ConfigService } from '../../src/app/model/config.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    host: { class: 'app-home' },
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewChecked {


    r: ResourcesService;

    groupsOpened: boolean;

    sliderDomElements: Element[];

    sliderObjects: any[];

    constructor(
        resourcesService: ResourcesService,
        private accountService: AccountService,
        public configService: ConfigService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.groupsOpened = false;
        this.sliderObjects = [];

        if (document.cookie.includes('loggedIn=true')) {

            this.accountService.getIP().then(
                res => {
                    if (res && res.ip) {
                        this.accountService.logUser(res.ip, 'login');
                    }
                },
                () => { }
            );

            document.cookie = 'loggedIn=true;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
    }


    ngAfterViewChecked(): void {

        if (this.r.translations && this.sliderObjects.length === 0) {

            //angular strips and removes some html attribus (eg. data attributes) for security reasons.
            //template will render modified html, so sliderDomElement has to search data attributes in original html from translations

            this.sliderDomElements = Array.from(document.querySelectorAll('.app-slider'));

            if (this.sliderDomElements.length > 0) {

                const dom = document.createElement('div');
                dom.innerHTML = this.r.translations.homePageContent;
                const originalDomElements = Array.from(dom.querySelectorAll('.app-slider'));

                this.sliderDomElements.forEach((slider, i) => {
                    slider.setAttribute('data-config', originalDomElements[i].getAttribute('data-config'));
                });

                this.handleSliders();
            }
        }
    }

    handleSliders() {

        this.sliderDomElements.forEach(slider => {

            const config = JSON.parse(slider.getAttribute('data-config').replace(/'/g, '"'));

            this.sliderObjects.push(tns(
                Object.assign({ container: slider, controlsText: ['', ''] }, config)
            ));
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

        this.sliderObjects.forEach(slider => {

            try {
                slider.destroy();

            } catch (err) {

                //IE <= 11 (only) throws undefined DOM element error
                slider.pause();
            }

        });

        this.sliderObjects = undefined;
    }
}



