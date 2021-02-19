import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { b2b } from '../../../b2b';
import { CustomerService } from '../../model/customer.service';
import { ResourcesService } from '../../model/resources.service';
import { Subscription } from 'rxjs';
import { CartsService } from '../../model/carts.service';
import { ProductsService } from '../../model/products.service';
import { Router, NavigationEnd } from '@angular/router';
import { MenuService } from '../../model/menu.service';
import { NgForm } from '@angular/forms';
import { AccountService } from '../../model/account.service';
import { ConfigService } from '../../model/config.service';
import { filter } from 'rxjs/operators';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    host: { 'class': 'app-header' },
    styleUrls: ['./header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, OnDestroy {


    carts: CartsService;
    r: ResourcesService;
    pendingMenuItem: b2b.MenuItem;


    routeSubscription: Subscription;

    @ViewChild('searchForm', { static: false })
    searchForm: NgForm;

    private searchSub: Subscription;

    /**
     * Event fires after user logged or when app is initializing with logged state
     */
    logInSub: Subscription;

    logOutSub: Subscription;

    removeConfirmModal: {
        visibility: boolean;
        cartId: number;
    };

    onlySpacesInSearchForm = false;

    routerSub: Subscription;

    constructor(
        public router: Router,
        resourcesService: ResourcesService,
        public accountService: AccountService,
        public customerService: CustomerService,
        public configService: ConfigService,
        cartsService: CartsService,
        private productsService: ProductsService,
        public menuService: MenuService,
        private commonModalService: CommonModalService
    ) {

        this.carts = cartsService;
        this.r = resourcesService;

        this.removeConfirmModal = {
            visibility: false,
            cartId: 0
        };

    }

    ngOnInit() {

        this.logInSub = this.accountService.logInSubj.subscribe(() => {
            this.initLoggedUserHeader();
        });

        this.logOutSub = this.accountService.logOutSubj.subscribe(() => {

            if (this.r.languages === undefined) {

                this.r.getLanguages();
            }

            this.destroyLoggedUserHeader();
        });


        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
            if (this.searchForm && this.searchForm.controls.searchPhrase && !e.url.includes(this.menuService.routePaths.items)) {
                this.searchForm.reset();
                this.configService.searchEvent.next({ searchPhrase: '' });
            }
        });
    }

    initLoggedUserHeader(): Promise<any> {

        return this.configService.configPromise.then(() => {

            const headerPromise = this.customerService.loadHeaderData();

            const cartPromise = this.carts.loadList().catch(() => {
                this.carts.carts = new Map();
            });


            const pendingMenuItemPromise = this.menuService.loadFullMenuItems().then(() => {
                this.pendingMenuItem = this.menuService.fullMenuItems.find(item => item.key === 'pending');
            });


            this.searchSub = this.configService.searchEvent.subscribe((res) => {

                if (res.searchPhrase !== this.searchForm.controls.searchPhrase.value) {
                    this.searchForm.controls.searchPhrase.setValue(res.searchPhrase);
                    this.productsService.filters.currentFilter.filter = res.searchPhrase;
                }

                if (res.searchPhrase === '') {
                    this.searchForm.form.markAsPristine();
                }
            });
            // JD - show commercial only after login
            //this.commonModalService.showModalCommercial(true);

            return Promise.all([cartPromise, pendingMenuItemPromise, headerPromise]);
        });

    }




    search(formValid, formValue) {

        if (formValid) {

            const trimmedValue = formValue.searchPhrase.trim();

            if (trimmedValue.length > 0) {

                this.productsService.filters.currentFilter.filter = trimmedValue;
                this.productsService.pagination.goToStart();

                if (!location.href.includes(this.menuService.routePaths.items)) {

                    this.router.navigateByUrl(this.menuService.routePaths.items);

                } else {

                    this.configService.searchEvent.next({ searchPhrase: trimmedValue });
                    this.searchForm.reset();
                }
            }
        }
    }

    searchInputKeyPress(event) {
        const trimmedValue = event.target.value.trim();
        (trimmedValue.length > 0) ? this.onlySpacesInSearchForm = false : this.onlySpacesInSearchForm = true;
    }

    confirmModalVisibility(cartId: number, isVisible?: boolean) {

        this.removeConfirmModal.cartId = cartId;
        this.removeConfirmModal.visibility = (isVisible !== undefined) ? isVisible : !this.removeConfirmModal.visibility;
    }


    changeLang(culture: string, id: number) {

        this.configService.loaderSubj.next(true);

        this.r.setCulture(culture, id).then(() => {

            this.r.loadTranslations(id).then(() => {

                this.configService.loaderSubj.next(false);
            });
        });
    }

    logOut() {
        this.configService.loaderSubj.next(true);
        this.accountService.logOut().then(() => {
            this.configService.loaderSubj.next(false);
        });

    }

    destroyLoggedUserHeader() {
        if (this.searchSub && !this.searchSub.closed) {
            this.carts.allCarts = null;
            this.searchSub.unsubscribe();
        }
    }

    ngOnDestroy() {

        this.routeSubscription.unsubscribe();
        this.logOutSub.unsubscribe();
        this.logInSub.unsubscribe();

        if (this.accountService.authenticated) {
            this.destroyLoggedUserHeader();
        }
    }

}
