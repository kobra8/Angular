import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild } from '@angular/core';
import { b2b } from '../../../b2b';
import { b2bCarts } from 'src/integration/b2b-carts';
import { CustomerService } from '../../model/customer.service';
import { ResourcesService } from '../../model/resources.service';
import { Subscription, Subject } from 'rxjs';
import { CartsService } from '../../model/carts.service';
import { ProductsService } from '../../model/products.service';
import { Router, NavigationEnd } from '@angular/router';
import { MenuService } from '../../model/menu.service';
import { NgForm } from '@angular/forms';
import { AccountService } from '../../model/account.service';
import { ConfigService } from '../../model/config.service';
import { filter, debounceTime } from 'rxjs/operators';
import { Config } from '../../helpers/config';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2bStore } from 'src/integration/store/b2b-store';
import { StoresService } from '../../model/store/stores.service';
import { CommonAvailableCartsService } from '../../model/shared/common-available-carts.service';
import { b2bProducts } from 'src/integration/products/b2b-products';
import { b2bShared } from 'src/integration/b2b-shared';


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
    isProfileInactive: boolean;
    creditInfo: b2b.HeaderCustomerInfo;
    private creditInfoChanged: Subscription;

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
        cart: b2bCart.CartIdentifier;
    };

    onlySpacesInSearchForm = false;

    routerSub: Subscription;

    maxCartNameLength = Config.maxCartNameLength;

    stores: b2bStore.StoreIdentifier[];
    private storesChangedSub: Subscription;

    searchValue: string;
    autocompleteConfig: b2bShared.AutocompleteConfig;
    private suggestionsChangedSub: Subscription;

    private changeSearchValueSub: Subscription;
    private changeSearchValueSubject: Subject<void>;

    constructor(
        public router: Router,
        resourcesService: ResourcesService,
        public accountService: AccountService,
        public customerService: CustomerService,
        public configService: ConfigService,
        cartsService: CartsService,
        private productsService: ProductsService,
        public menuService: MenuService,
        private storesService: StoresService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {

        this.carts = cartsService;
        this.r = resourcesService;

        this.removeConfirmModal = {
            visibility: false,
            cart: undefined
        };

        this.carts.cartPreviewExtra = {};

        this.autocompleteConfig = {
            isAutocompleteEnabled: true,
            loading: true
        };

        this.changeSearchValueSubject = new Subject();
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
            if (this.searchForm && this.searchForm.controls.searchPhrase && !e.url.includes(this.menuService.routePaths.items) && !e.url.includes(this.menuService.routePaths.itemDetails)) {
                this.resetSearchForm();
                this.configService.searchEvent.next({ searchPhrase: '' });
            }

            this.isProfileInactive = this.router.url.includes(this.menuService.routePaths.pending) || this.router.url.includes(this.menuService.routePaths.store);
        });

        this.storesChangedSub = this.storesService.storesChanged.subscribe((stores: b2bStore.StoreIdentifier[]) => {
            this.stores = stores;
        });
    }

    initLoggedUserHeader(): Promise<any> {

        return this.configService.configPromise.then(() => {
            const headerPromise = this.customerService.loadHeaderData().then((res) => {
                this.creditInfo = res;
            });

            this.creditInfoChanged = this.customerService.creditInfoChanged.subscribe((res) => {
                this.creditInfo = res;
            });

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

            if (this.configService.permissions.hasAccessToStore) {
                this.storesService.refreshStores();
            }

            if (this.configService.permissions.hasAccessToCart) {
                this.commonAvailableCartsService.refreshAvailableCarts();
            }

            if (this.configService.permissions.hasAccessToArticleList) {
                this.suggestionsChangedSub = this.productsService.suggestionsChanged.subscribe((suggestions: b2bProducts.SuggestionBase[]) => {
                    this.autocompleteConfig = {
                        ...this.autocompleteConfig,
                        items: suggestions,
                        loading: false
                    };
                });

                this.changeSearchValueSub = this.changeSearchValueSubject.pipe(debounceTime(500)).subscribe(() => {
                    this.autocompleteConfig = {
                        ...this.autocompleteConfig,
                        loading: true
                    };

                    if (this.searchForm.valid && !this.onlySpacesInSearchForm) {
                        this.productsService.getSuggestions(this.searchForm.value.searchPhrase.trim());
                    }
                });
            }

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
                    this.resetSearchForm();
                }
            }
        }
    }

    private resetSearchForm() {
        this.searchForm.reset();
        this.autocompleteConfig = {
            isAutocompleteEnabled: true,
            loading: true,
            items: [],
        };
    }

    searchInputKeyPress(event) {
        const trimmedValue = event.target.value.trim();
        (trimmedValue.length > 0) ? this.onlySpacesInSearchForm = false : this.onlySpacesInSearchForm = true;
        this.changeSearchValueSubject.next();
    }

    onSelectSuggestion(articleId: number) {
        const groupId = location.href.includes(this.menuService.routePaths.items) ? this.productsService.groupId : 0;
        this.router.navigate([`${this.menuService.routePaths.itemDetails}/${articleId}`], { queryParams: { group: groupId } });
    }


    showConfirmModal(cartId: number, cartName: string) {
        this.removeConfirmModal.cart = { cartId: cartId, cartName: cartName };
        this.removeConfirmModal.visibility = true;
    }

    closeModal() {
        this.removeConfirmModal.cart = undefined;
        this.removeConfirmModal.visibility = false;
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
        this.creditInfo = undefined;
    }


    onClickEditCartName(cartId: number) {
        this.carts.cartPreviewExtra[cartId] = {
            isNameEdited: true,
            newName: this.carts.carts.get(cartId).currencies[0].cartName
        } as b2bCarts.CartPreviewExtraProperties;
    }

    onClickSaveNewCartName(cartId: number, newCartName: string) {
        this.carts.updateCartName(cartId, newCartName).then(() => {
            this.carts.cartPreviewExtra[cartId] = undefined;
        });
    }

    ngOnDestroy() {

        this.routeSubscription.unsubscribe();
        this.logOutSub.unsubscribe();
        this.logInSub.unsubscribe();

        if (this.creditInfoChanged) {
            this.creditInfoChanged.unsubscribe();
        }

        if (this.accountService.authenticated) {
            this.destroyLoggedUserHeader();
        }
        this.storesChangedSub.unsubscribe();

        if (this.suggestionsChangedSub) {
            this.suggestionsChangedSub.unsubscribe();
        }

        if (this.changeSearchValueSub) {
            this.changeSearchValueSub.unsubscribe();
        }
    }
}
