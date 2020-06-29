import { Component, ViewEncapsulation, OnInit, OnDestroy, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import { CartsService } from './model/carts.service';
import { Subscription, fromEvent } from 'rxjs';
import { AfterAddingToCart } from './model/enums/after-adding-to-cart.enum';
import { ResourcesService } from './model/resources.service';
import { Router } from '@angular/router';
import { ConfigService } from './model/config.service';
import { DateHelper } from './helpers/date-helper';
import { SwUpdate } from '@angular/service-worker';
import { MenuService } from './model/menu.service';
import { AddToCartResponseEnum } from './model/enums/add-to-cart-response-enum';
import { CommonModalService } from './model/shared/common-modal.service';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, AfterContentChecked, OnDestroy {

    r: ResourcesService;

    private addingToCartSub: Subscription;
    private showModalSub: Subscription;
    // JD
    private showCommercialSub: Subscription;

    afterAddingToCartModal: {
        opened: boolean;
        cartId?: number;
        saveBehaviour?: boolean;
        addToCartStatus?: AddToCartResponseEnum;
    };

    modalData: {
        isOpened: boolean;
        message?: string;
    };
    //JD
    showCommercial = false;
    animateCommercialOut = false;

    noPermissions: boolean;

    private beforeInstallPromptSub: Subscription;
    private beforeInstallPromptEvent;
    installPromptOpened: boolean;

    footerHide: boolean;
    isMobile: boolean;

    loader: boolean;
    loaderSub: Subscription;

    constructor(
        public router: Router,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        public cartsService: CartsService,
        swUpdate: SwUpdate,
        public menuService: MenuService,
        private commonModalService: CommonModalService
    ) {

        this.r = resourcesService;

        this.afterAddingToCartModal = {
            opened: false
        };

        this.modalData = {
            isOpened: false
        };
      //  this.showCommercial = false;

        this.noPermissions = false;
        this.installPromptOpened = false;

        this.isMobile = this.configService.isMobile;

        /**
         * Binding using subject, not simple variable, to avoid error "expression has changed after it was checked"
         */
        this.loaderSub = this.configService.loaderSubj.subscribe(isVisible => {
            this.loader = isVisible;
        });

        swUpdate.available.subscribe(() => {
            window.location.reload();
        });

      
    }

    ngOnInit() {

        if (this.cartsService.afterAddingToCart !== AfterAddingToCart.go) {
            this.addingToCartSub = this.cartsService.productAdded.subscribe((res) => {
                this.afterAddingToCartModal.opened = true;
                this.afterAddingToCartModal.cartId = res.cartId;
                this.afterAddingToCartModal.addToCartStatus = res.addToCartResponseEnum;
            });
        }
        this.showModalSub = this.commonModalService.showModalSubject.subscribe((res) => {
            this.modalData.isOpened = true;
            this.modalData.message = res;
        });
        // JD
        this.showCommercialSub = this.commonModalService.showCommercialEmited$.subscribe((res) => {
                this.showCommercial = res;

        });

        this.configService.permissionsPromise.then(() => {
            this.noPermissions = Object.values(this.configService.permissions).filter(value => value).length === 0;
        });

        if (this.configService.isSafari) {

            const installAppPromptDelay = localStorage.getItem('installAppPromptDelay') ? new Date(Number(localStorage.getItem('installAppPromptDelay'))) : null;

            if ((<any>window).BeforeInstallPromptEvent && (installAppPromptDelay === null || installAppPromptDelay < new Date())) {

                this.beforeInstallPromptSub = fromEvent(window, 'beforeinstallprompt').subscribe((e: any) => {

                    e.preventDefault();

                    this.beforeInstallPromptEvent = e;

                    this.installPromptOpened = true;

                    this.beforeInstallPromptEvent.userChoice.then((choice) => {

                        this.installPromptOpened = false;
                        this.beforeInstallPromptEvent = null;

                        if (this.beforeInstallPromptSub && !this.beforeInstallPromptSub.closed) {
                            this.beforeInstallPromptSub.unsubscribe();
                        }

                        if (choice === 'dismissed') {
                            localStorage.setItem('installAppPromptDelay', (<Date>DateHelper.calculateMonths(new Date(), 1)).getTime().toString());
                        }


                    });
                });
            }
        }


    }

    ngAfterContentChecked() {

        if (this.isMobile) {
            this.footerHide = true;
        } else {
            this.footerHide = false;
        }
    }

    closeInform(modalType: 'afterAddingToCart' | 'noPermissions' | 'installPrompt' | 'infoModal' ): void {

        switch (modalType) {
            case 'afterAddingToCart':
                this.afterAddingToCartModal.opened = false;
                break;

            case 'infoModal':
                this.modalData.isOpened = false;
                break;

            case 'noPermissions':
                this.noPermissions = false;
                break;

            case 'installPrompt':
                if (this.installPromptOpened === true) {
                    this.installPromptOpened = false;

                    this.beforeInstallPromptEvent = null;

                    if (this.beforeInstallPromptSub && !this.beforeInstallPromptSub.closed) {
                        this.beforeInstallPromptSub.unsubscribe();
                    }

                    localStorage.setItem('installAppPromptDelay', (<Date>DateHelper.calculateMonths(new Date(), 1)).getTime().toString());
                }
                break;
            default:
                break;
        }
    }

    saveAfterAddingBehaviour(behaviourType: AfterAddingToCart) {

        if (this.afterAddingToCartModal.saveBehaviour === true) {
            this.cartsService.saveAddToCartBehaviour(behaviourType);
        }
    }

    setIfSaveBehaviour(ifSave: boolean) {
        this.afterAddingToCartModal.saveBehaviour = ifSave;
    }

    promptInstallAppBanner() {
        this.beforeInstallPromptEvent.prompt();
    }
    // JD
    hideCommercial() {
        this.animateCommercialOut = true;
        setTimeout(() => {
            this.commonModalService.showModalCommercial(false);
            this.animateCommercialOut = false;
        }, 2000);
    }


    ngOnDestroy(): void {

        if (this.addingToCartSub) {
            this.addingToCartSub.unsubscribe();
        }

        if (this.showModalSub) {
            this.showModalSub.unsubscribe();
        }

        this.loaderSub.unsubscribe();
        // JD
        this.showCommercialSub.unsubscribe();
        this.configService.loaderSubj.unsubscribe();

        if (this.beforeInstallPromptSub && !this.beforeInstallPromptSub.closed) {
            this.beforeInstallPromptSub.unsubscribe();
        }
    }
}
