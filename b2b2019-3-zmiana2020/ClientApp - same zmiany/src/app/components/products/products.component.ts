
import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { ProductsService } from '../../model/products.service';
import { b2b } from '../../../b2b';
import { DisplayType } from '../../model/enums/display-type.enum';
import { Subscription } from 'rxjs';
import { CartsService } from '../../model/carts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupsService } from '../../model/groups.service';
import { ConfigService } from '../../model/config.service';
import { FormGroup, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuService } from 'src/app/model/menu.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { ModalMessageType } from 'src/app/model/shared/enums/modal-message-type';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    host: { 'class': 'app-products view-with-sidebar' },
    styleUrls: ['./products.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit, OnDestroy {

    groupsOpened: boolean;
    filtersOpened: boolean;

    r: ResourcesService;

    groupId: number;
    forbiddenGroup: boolean; //forbidden or not exist

    productsList: ProductsService;
    breadcrumbs: b2b.Group[];
    groups: GroupsService;

    cartNumbers: string[];

    message: string;

    filterMessageOpened: boolean;

    private searchFormEventSubscription: Subscription;
    globalCartId: number;

    private newListSub: Subscription;
    private groupsLoaded: Subscription;

    private activatedRouteSub: Subscription;

    @ViewChild('filtersForm', { static: false })
    filtersForm: NgForm;

    showUnacceptableDiscounts: boolean;

    /**
     * The filters selected by the user are constantly updated in the service.
     * Service filters are included when loading the list.
     * The visibleCurrentFilter variable specifies the filters that were selected by the user before loading the list and relate to the settings of the currently displayed list.
     */
    visibleCurrentFilter: b2b.CurrentFilter;

    isAnyFilterSelected: boolean;

    cartsToAdd: number[];
    private cartsForArticlesChanged: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        public menuService: MenuService,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private cartsService: CartsService,
        groupsService: GroupsService,
        productsService: ProductsService,
        public changeDetector: ChangeDetectorRef,
        private commonModalService: CommonModalService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
        this.productsList = productsService;

        this.isAnyFilterSelected = false;

        this.filterMessageOpened = false;
        this.groupsOpened = false;
        this.filtersOpened = false;
    }


    ngOnInit() {


        this.activatedRouteSub = this.activatedRoute.params.subscribe(params => {

            if (this.menuService.lastTwoRoutes) {
                this.showUnacceptableDiscounts = this.menuService.lastTwoRoutes[0].url === this.menuService.routePaths.promotions;
            }

            this.groupId = Number(params.id);

            if (this.productsList.groupId !== this.groupId
                || this.groupId === 0
                || (this.productsList.warehousesService.lastSelectedForProducts !== undefined
                    && this.productsList.warehousesService.lastSelectedForProducts.id !== this.productsList.filters.currentFilter.warehouse.id)) {


                if (this.groupId === 0 && !this.productsList.filters.currentFilter.filter) {
                    this.router.navigate([this.menuService.routePaths.home]);
                    this.groupId = NaN;
                    return;
                }

                if (Number.isNaN(this.groupId)) {
                    this.router.navigate([this.menuService.routePaths.home]);
                    return;
                }

                this.configService.loaderSubj.next(true);

                if (!this.breadcrumbs && this.groups.history) {
                    this.setBreadcrumbs(this.groups.history);
                }

                this.productsList.pagination.goToStart();
                this.loadProducts(this.groupId);

            } else {


                this.isAnyFilterSelected = !this.productsList.areNoFilters();
                this.visibleCurrentFilter = this.isAnyFilterSelected ? Object.assign({}, this.productsList.filters.currentFilter) : null;

                this.changeDetector.markForCheck();
                this.configService.loaderSubj.next(false);


            }



        });

        if (Number.isNaN(this.groupId)) {
            return;
        }

        this.productsList.loadClassesParameters();

        this.productsList.loadFilters();


        this.searchFormEventSubscription = this.configService.searchEvent.subscribe((res) => {

            //reseting filters calls new list itself
            if (res.searchPhrase !== '') {
                this.loadProducts(this.groupId);
            }
        });

        this.groupsLoaded = this.groups.groupsLoaded.subscribe(res => {
            this.setBreadcrumbs(res.history);
            this.handleVisibility('groups', false);
            this.changeDetector.markForCheck();
            this.groupsLoaded.unsubscribe();
        });

        this.newListSub = this.groups.productsChanged.subscribe(res => {
            this.groupId = res.id;
            this.handleVisibility('groups', false);
            this.productsList.pagination.goToStart();
            this.showUnacceptableDiscounts = false;

            this.setBreadcrumbs(res.history);

            if (this.productsList.filters.currentFilter.filter === '') {
                this.loadProducts(res.id);

            } else {
                this.updateCurrentFilter({ filter: '' });
            }
        });

        if (!this.cartsToAdd) {
            this.loadCartsToAdd();
        }

        this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForArticlesChanged.subscribe((res) => {
            this.cartsToAdd = res;
            this.changeDetector.markForCheck();
        });
    }


    loadProducts(groupId: number, cartId?: number): void {

        this.productsList.products = undefined;
        this.changeDetector.markForCheck();
        this.configService.loaderSubj.next(true);
        this.message = null;

        let productsError = false;

        const productsPromise = this.productsList.loadProducts(groupId, cartId).then(() => {

            this.isAnyFilterSelected = !this.productsList.areNoFilters();

            this.visibleCurrentFilter = this.isAnyFilterSelected ? Object.assign({}, this.productsList.filters.currentFilter) : null;

            if (this.productsList.config.displayType === DisplayType.grid && this.configService.isMobile) {
                this.productsList.config.displayType = DisplayType.list;
            }

            if (this.productsList.products.length === 0) {
                this.message = this.r.translations.resultsNotFound;
            }
            // JD
            this.commonModalService.showModalCommercial(true);

            this.changeDetector.markForCheck();


        }).catch((err: HttpErrorResponse) => {

            productsError = true;

            this.isAnyFilterSelected = !this.productsList.areNoFilters();

            this.visibleCurrentFilter = this.isAnyFilterSelected ? Object.assign({}, this.productsList.filters.currentFilter) : null;

            if (err.status === 403) {
                this.forbiddenGroup = true;
                this.productsList.products = undefined;
                this.message = this.r.translations.forbiddenGroup;
                this.configService.loaderSubj.next(false);
                this.changeDetector.markForCheck();
                return;
            }

            if (!this.configService.isOnline) {
                productsError = false;
            }

            if (!this.configService.isOnline && this.groupId !== this.productsList.groupId) {
                //offline and old data (from previously selected group)
                this.groupId = this.productsList.groupId;
                this.productsList.products = undefined;
            }


            if (this.productsList.products && this.productsList.products.length === 0) {
                this.message = this.r.translations ? this.r.translations.resultsNotFound : '';
            }

            if (!this.configService.isOnline && this.productsList.products === undefined) {
                this.message = this.r.translations ? this.r.translations.noDataInOfflineMode : '';
            }

            this.configService.loaderSubj.next(false);

            this.changeDetector.markForCheck();

            return Promise.resolve(err);
        });



        productsPromise.then(() => {

            if (!productsError) {
                const ids = [];

                this.productsList.products.forEach(product => {
                    if (!product.unitLockChange) {
                        ids.push(product.id);
                    }
                });

                window.setTimeout(() => {
                    //put to end of event loop, so that the dom elements and bindings are ready for a response
                    this.productsList.loadUnitsForMany(ids).then(() => {

                        this.changeDetector.markForCheck();
                        this.configService.loaderSubj.next(false);

                    }).catch(err => {
                        return Promise.reject(err);
                    });
                }, 0);

            }

        }).catch((err) => {

            this.changeDetector.markForCheck();
            return Promise.reject(err);
        });


    }

    pricesAsync(i: number) {

        window.setTimeout(() => {
            //put to end of event loop, so that the dom elements and bindings are ready for a response

            if (this.configService.permissions.hasAccessToPriceList
                && (this.productsList.products[i].netPrice === undefined)
                && (this.productsList.products[i].grossPrice === undefined)) {


                this.productsList.pricesAsync(i).then(() => {

                    this.productsList.products[i].pricesLoaded = true;

                    this.changeDetector.markForCheck();

                }).catch((err: HttpErrorResponse) => {

                    if (!this.configService.isOnline) {

                        if (!this.productsList.products[i].grossPrice || !this.productsList.products[i].netPrice) {
                            this.message = this.r.translations ? this.r.translations.missingSomeDataInOfflineMode : '';
                        }

                        if (!this.productsList.products[i].grossPrice) {
                            this.productsList.products[i].grossPrice = this.r.translations ? this.r.translations.noData : '';
                        }

                        if (!this.productsList.products[i].netPrice) {
                            this.productsList.products[i].netPrice = this.r.translations ? this.r.translations.noData : '';
                        }

                        if (!this.productsList.products[i].currency) {
                            this.productsList.products[i].currency = '';
                        }

                    }

                    this.productsList.products[i].pricesLoaded = true;

                    this.changeDetector.markForCheck();

                    return Promise.reject(err);
                });

            } else {
                this.productsList.products[i].pricesLoaded = true;
            }


        }, 0);
    }

    imageLoaded(i: number) {
        this.productsList.products[i].imageLoaded = true;
        this.changeDetector.markForCheck();
    }


    updateCurrentFilter(filter: b2b.CurrentFilter) {

        this.productsList.setCurrentFilter(filter);
        this.isAnyFilterSelected = !this.productsList.areNoFilters();
        this.changeDetector.markForCheck();

        if (filter.filter !== undefined) {
            this.configService.searchEvent.next({ searchPhrase: filter.filter });

            if (this.groupId === 0) {
                this.router.navigate([this.menuService.routePaths.home]);
                return;
            } else {
                this.loadProducts(this.groupId);
            }

        }

    }


    updateParameterValue(key, valueKey, value) {

        this.productsList.updateParameterValue(key, valueKey, value);

    }

    filter() {
        this.productsList.pagination.goToStart();
        this.visibleCurrentFilter = Object.assign({}, this.productsList.filters.currentFilter); //new refference
        this.filtersForm.form.markAsPristine();
        this.loadProducts(this.groupId);
    }

    resetAllFilters() {

        if (this.productsList.filters.currentFilter.filter) {

            this.configService.searchEvent.next({ searchPhrase: '' });
            this.productsList.resetAllFilters();

            if (this.groupId === 0) {
                this.router.navigate([this.menuService.routePaths.home]);
                return;
            }

            this.visibleCurrentFilter = Object.assign({}, this.productsList.filters.currentFilter); //new refference

            this.loadProducts(this.groupId);

        } else {

            this.productsList.resetAllFilters();
            this.loadProducts(this.groupId);

        }

    }

    selectFilterProfile(id) {

        this.productsList.selectFilterProfile(id).then((res) => {

            this.loadProducts(this.groupId);

        });

    }

    changePage(currentPage) {

        this.productsList.pagination.changePage(currentPage);
        this.loadProducts(this.groupId);
    }

    addToCart(item: b2b.ProductListElement) {
        if (!item.cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }

        if (item.quantity && item.quantity > 0) {


            const requestObject: b2b.AddToCartRequest = {
                cartId: item.cartId,
                warehouseId: this.productsList.filters.currentFilter.warehouse.id,
                items: [{
                    articleId: item.id,
                    quantity: item.quantity,
                    unitDefault: item.unitId
                }]
            };

            this.cartsService.addToCart(requestObject).then(() => {
                item.quantity = 1;
                this.changeDetector.markForCheck();
            });

        }
    }


    trackByFn(index, item: b2b.ProductListElementResponse) {

        return item.id || index;
    }

    addManyToCart(cartId) {
        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }

        const products = this.productsList.products.filter(item => {

            return item.quantity > 0;

        });

        if (products.length > 0) {

            const requestArray: b2b.AddToCartRequest = {
                cartId: cartId,
                warehouseId: this.productsList.filters.currentFilter.warehouse.id,
                items: products.map(item => {
                    return <b2b.AddToCartRequestItem>{
                        articleId: item.id,
                        quantity: item.quantity,
                        unitDefault: item.unitId
                    };
                })
            };


            this.cartsService.addToCart(requestArray).then(res => {

                this.productsList.products.forEach((item, i) => {

                    if (item.quantityChanged) {
                        item.quantity = 0;
                        item.quantityChanged = false;
                    }
                });

                this.changeDetector.markForCheck();
            });
        }
    }

    setBreadcrumbs(breadcrumbs: b2b.Group[]) {
        this.breadcrumbs = breadcrumbs;
    }

    handleVisibility(section: 'groups' | 'filters' | 'filterMessage', visibility?: boolean) {

        switch (section) {
            case 'groups':
                this.groupsOpened = (visibility === undefined ? !this.groupsOpened : visibility);
                break;
            case 'filterMessage':
                this.filterMessageOpened = (visibility === undefined ? !this.filterMessageOpened : visibility);
                break;
            default:
                this.filtersOpened = (visibility === undefined ? !this.filtersOpened : visibility);
                break;
        }
    }


    addFilterProfile(form: FormGroup) {
        this.productsList.addFilterProfile().then(() => {

            if (this.productsList.filters.currentFilter.filterId !== 0) {
                this.handleVisibility('filterMessage', true);
                form.controls.profileName.reset();
            }

            this.changeDetector.markForCheck();
        });
    }

    loadParameterValues(id, type) {

        this.productsList.loadParameterValues(id, type).then(() => {
            this.changeDetector.markForCheck();
        });
    }

    loadWarehouses() {
        this.productsList.warehousesService.loadWarehouses().then(() => {
            this.changeDetector.markForCheck();
        });
    }

    unitConverter(i) {
        this.productsList.unitConverter(i).then(() => {
            this.changeDetector.markForCheck();
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    private loadCartsToAdd() {
        this.commonAvailableCartsService.getCartsForArticles().then((res) => {
            this.cartsToAdd = res;
            this.changeDetector.markForCheck();
        });
    }

    onOpenAddToCartSelect(cartId: number) {
        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }
    }

    private showNoAvailableCartsMessageInModal() {
        this.commonModalService.showModalMessageType(ModalMessageType.noAvailableCartsToAddArticle);
    }

    removeFilterProfile(id: number) {
        return this.productsList.removeFilterProfile(id).then(() => {
            this.changeDetector.markForCheck();
        });
    }


    ngOnDestroy() {

        this.activatedRouteSub.unsubscribe();

        if (!Number.isNaN(this.groupId)) {
            this.searchFormEventSubscription.unsubscribe();
            this.newListSub.unsubscribe();
        }

        if (this.cartsForArticlesChanged) {
            this.cartsForArticlesChanged.unsubscribe();
        }
    }
}
