
import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { ProductsService } from '../../model/products.service';
import { b2b } from '../../../b2b';
import { DisplayType } from '../../model/enums/display-type.enum';
import { Subscription, combineLatest } from 'rxjs';
import { CartsService } from '../../model/carts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupsService } from '../../model/groups.service';
import { ConfigService } from '../../model/config.service';
import { FormGroup, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuService } from 'src/app/model/menu.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { Config } from '../../helpers/config';
import { map } from 'rxjs/operators';

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
    forbiddenGroupRedirect: b2b.TreeParameters;
    currentTreeParameters: b2b.TreeParameters;

    productsList: ProductsService;
    breadcrumbs: b2b.Group[];
    groups: GroupsService;

    message: string;

    filterMessageOpened: boolean;

    private searchFormEventSubscription: Subscription;

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
        private commonModalService: CommonModalService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
        this.productsList = productsService;

        this.isAnyFilterSelected = false;

        this.filterMessageOpened = false;
        this.groupsOpened = false;
        this.filtersOpened = false;

        this.forbiddenGroupRedirect = {
            groupId: 0,
            parentId: null
        };
    }


    ngOnInit() {
        this.activatedRouteSub = combineLatest([this.activatedRoute.params, this.activatedRoute.queryParams])
            .pipe(map(results => ({ params: results[0], query: results[1] })))
            .subscribe(results => {

                if (this.menuService.lastTwoRoutes) {
                    if (!this.menuService.lastTwoRoutes[0].url.includes(this.menuService.routePaths.itemDetails)) {
                        this.productsList.pagination.goToStart();
                    }
                    this.showUnacceptableDiscounts = this.menuService.lastTwoRoutes[0].url === this.menuService.routePaths.promotions;
                }

                this.groupId = Number(results.params.id);

                this.currentTreeParameters = {
                    groupId: this.groupId,
                    parentId: results.query.parent
                };

                if (this.productsList.groupId !== this.groupId
                    || this.groupId === 0
                    || (this.productsList.warehousesService.lastSelectedForProducts !== undefined
                        && this.productsList.warehousesService.lastSelectedForProducts.id !== this.productsList.filters.currentFilter.warehouse.id)) {


                    if (this.groupId === 0 && !this.productsList.filters.currentFilter.filter) {
                        this.router.navigate([this.menuService.routePaths.home]);
                        this.groupId = NaN;

                        this.currentTreeParameters = {
                            groupId: NaN,
                            parentId: this.currentTreeParameters.parentId
                        };

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

            this.currentTreeParameters = {
                groupId: res.id,
                parentId: this.currentTreeParameters.parentId
            };

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
    }


    loadProducts(groupId: number): void {

        this.productsList.products = undefined;
        this.changeDetector.markForCheck();
        this.configService.loaderSubj.next(true);
        this.message = null;

        let productsError = false;

        const productsPromise = this.productsList.loadProducts(groupId).then(() => {

            this.isAnyFilterSelected = !this.productsList.areNoFilters();

            this.visibleCurrentFilter = this.isAnyFilterSelected ? Object.assign({}, this.productsList.filters.currentFilter) : null;

            if (this.productsList.config.displayType === DisplayType.grid && this.configService.isMobile) {
                this.productsList.config.displayType = DisplayType.list;
            }

            if (this.productsList.productsLength === 0) {
                this.message = this.r.translations.resultsNotFound;
            }

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

                this.currentTreeParameters = {
                    groupId: this.productsList.groupId,
                    parentId: this.currentTreeParameters.parentId
                };

                this.productsList.products = undefined;
            }

            if (this.productsList.products && this.productsList.productsLength === 0) {
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

            if (!productsError && this.productsList.productsLength > 0) {
                const ids = [];

                Object.values(this.productsList.products).forEach(product => {
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
                },
                    0);
            } else {
                this.configService.loaderSubj.next(false);
            }


        }).catch((err) => {

            this.changeDetector.markForCheck();
            return Promise.reject(err);
        });


    }

    pricesAsync(productId: number) {
        window.setTimeout(() => {
            //put to end of event loop, so that the dom elements and bindings are ready for a response

            if (this.productsList.products[productId].netPrice === undefined
                && this.productsList.products[productId].grossPrice === undefined) {


                this.productsList.pricesAsync(productId).then(() => {

                    if (this.productsList.products[productId]) {
                        this.productsList.products[productId].pricesLoaded = true;
                        this.changeDetector.markForCheck();
                    }

                }).catch((err: HttpErrorResponse) => {

                    if (!this.configService.isOnline) {

                        if (!this.productsList.products[productId].grossPrice || !this.productsList.products[productId].netPrice) {
                            this.message = this.r.translations ? this.r.translations.missingSomeDataInOfflineMode : '';
                        }

                        if (!this.productsList.products[productId].grossPrice) {
                            this.productsList.products[productId].grossPrice = this.r.translations ? this.r.translations.noData : '';
                        }

                        if (!this.productsList.products[productId].netPrice) {
                            this.productsList.products[productId].netPrice = this.r.translations ? this.r.translations.noData : '';
                        }

                        if (!this.productsList.products[productId].currency) {
                            this.productsList.products[productId].currency = '';
                        }

                    }

                    if (this.productsList.products[productId]) {
                        this.productsList.products[productId].pricesLoaded = true;
                    }

                    this.changeDetector.markForCheck();

                    return Promise.reject(err);
                });

            } else {
                this.productsList.products[productId].pricesLoaded = true;
            }


        }, 0);
    }

    imageLoaded(productId: number) {
        this.productsList.products[productId].imageLoaded = true;
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

    private prepareRequestToAddToCart(item: b2b.ProductListElement): b2b.AddToCartRequest {
        return {
            cartId: item.cartId,
            warehouseId: this.productsList.filters.currentFilter.warehouse.id,
            createNewCart: item.cartId === Config.createNewCartId,
            items: [{
                articleId: item.id,
                quantity: item.quantity,
                unitDefault: item.unitId
            }]
        };
    }

    addToCart(item: b2b.ProductListElement) {
        if (!item.cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        if (!item.quantity || item.quantity === 0) {
            return;
        }
        this.configService.loaderSubj.next(true);
        const request = this.prepareRequestToAddToCart(item);

        this.cartsService.addToCart(request).then(() => {
            item.quantity = 1;
            this.changeDetector.markForCheck();
            this.configService.loaderSubj.next(false);
        }).catch(() => {
            this.configService.loaderSubj.next(false);
        });
    }

    trackByFn(index, itemKeyValuePair) {
        return itemKeyValuePair.value.id || index;
    }

    addManyToCart(cartId: number) {
        if (!cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        const products = Object.values(this.productsList.products).filter(product => {
            return product.quantity > 0;
        });

        if (products.length === 0) {
            return;
        }

        this.configService.loaderSubj.next(true);
        const requestArray: b2b.AddToCartRequest = {
            cartId: cartId,
            warehouseId: this.productsList.filters.currentFilter.warehouse.id,
            createNewCart: cartId === Config.createNewCartId,
            items: products.map(item => {
                return <b2b.AddToCartRequestItem>{
                    articleId: item.id,
                    quantity: item.quantity,
                    unitDefault: item.unitId
                };
            })
        };


        this.cartsService.addToCart(requestArray).then(() => {

            Object.values(this.productsList.products).forEach(item => {
                if (item.quantityChanged) {
                    item.quantity = 0;
                    item.quantityChanged = false;
                }
            });

            this.changeDetector.markForCheck();
            this.configService.loaderSubj.next(false);
        }).catch(() => {
            this.configService.loaderSubj.next(false);
        });
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

    unitConverter(productId) {
        this.productsList.unitConverter(productId).then(() => {
            this.changeDetector.markForCheck();
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    removeFilterProfile(id: number) {
        return this.productsList.removeFilterProfile(id).then(() => {
            this.changeDetector.markForCheck();
        });
    }

    sortArticleList(itemKeyValuePair, nextItemKeyValuePair) {
        if (itemKeyValuePair.value.rowNumber < nextItemKeyValuePair.value.rowNumber) {
            return -1;
        }
        return 1;
    }


    ngOnDestroy() {
        this.activatedRouteSub.unsubscribe();

        if (!Number.isNaN(this.groupId)) {
            this.searchFormEventSubscription.unsubscribe();
            this.newListSub.unsubscribe();
        }
    }
}
