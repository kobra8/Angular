import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourcesService } from '../../model/resources.service';
import { ProductDetailsService } from '../../model/product-details.service';
import { Subscription, combineLatest } from 'rxjs';
import { b2b } from '../../../b2b';
import { CartsService } from '../../model/carts.service';
import { UiUtils } from '../../helpers/ui-utils';
import { ConfigService } from '../../model/config.service';
import { GroupsService } from '../../model/groups.service';
import { WarehousesService } from '../../model/warehouses.service';
import { HttpErrorResponse } from '@angular/common/http';
import { first, map } from 'rxjs/operators';
import { MenuService } from 'src/app/model/menu.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { Config } from '../../helpers/config';
import { StoresService } from '../../model/store/stores.service';
import { b2bStore } from 'src/integration/store/b2b-store';
import { b2bProductDetails } from 'src/integration/b2b-product-details';

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    host: { 'class': 'app-product-details' },
    providers: [ProductDetailsService],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsComponent implements OnInit, OnDestroy {

    private routeParamsSubscription: Subscription;
    private storesChangedSub: Subscription;

    r: ResourcesService;

    id: number;

    product: ProductDetailsService;

    keys: Function;

    tabsVisible: boolean;

    scrollToLabel: Function;

    message: string;

    detailsLoading: boolean;

    breadcrumbs: b2b.Breadcrumb[];
    groupsLoadedSub: Subscription;

    groupId?: number;

    stores: b2bStore.StoreIdentifier[];

    thresholdPriceLists: b2bProductDetails.ThresholdPriceLists;
    private thresholdPriceListsChangedSub: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        public groupsService: GroupsService,
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private cartsService: CartsService,
        productDetailsService: ProductDetailsService,
        public warehousesService: WarehousesService,
        private changeDetector: ChangeDetectorRef,
        public menuService: MenuService,
        private commonModalService: CommonModalService,
        private storesService: StoresService
    ) {

        this.r = resourcesService;
        this.product = productDetailsService;
    }

    ngOnInit() {

        this.keys = Object.keys;

        this.thresholdPriceListsChangedSub = this.product.thresholdPriceListsChanged.subscribe(res => {
            this.thresholdPriceLists = res;
        });

        this.routeParamsSubscription = combineLatest([this.activatedRoute.params, this.activatedRoute.queryParams])
            .pipe(map(results => ({ params: results[0], query: results[1] })))
            .subscribe(results => {
                this.configService.loaderSubj.next(true);

                this.breadcrumbs = this.groupsService.history;

                this.groupsLoadedSub = this.groupsService.groupsLoaded
                    .pipe(first())
                    .subscribe(() => {
                        this.breadcrumbs = this.groupsService.history;
                    });

                if (this.id !== results.params.id) {
                    this.product.images = [];
                    this.product.replacements = [];
                }

                this.message = null;

                window.scrollTo(0, 0);

                this.id = results.params.id;

                if (!results.query.group) {
                    this.groupId = null;
                } else {
                    this.groupId = results.query.group;
                }

                this.loadProduct(this.id, this.groupId);
            });

        this.scrollToLabel = UiUtils.scrollToLabel;

        this.storesChangedSub = this.storesService.storesChanged.subscribe(res => {
            this.stores = res;
        });
    }


    loadProduct(id = this.id, groupId) {
        this.product.images = undefined;
        this.product.replacements = undefined;
        this.product.attachments = undefined;
        this.product.attributesPromise = undefined;
        this.product.details = undefined;
        this.product.replacementsPromises = undefined;
        this.detailsLoading = true;

        this.product.loadProduct(id, groupId).then(() => {
            this.detailsLoading = false;

            this.tabsVisible = this.ifTabsVisible();
            this.configService.loaderSubj.next(false);
            this.changeDetector.markForCheck();

        }).catch((err: HttpErrorResponse) => {

            this.configService.loaderSubj.next(false);

            if (err.status === 403) {
                this.message = this.r.translations.forbiddenProduct;
                return err;
            }

            if (!this.configService.isOnline && this.product.details === undefined) {
                this.message = this.r.translations.noDataInOfflineMode;
            }

            this.changeDetector.markForCheck();

            return err;
        });


        this.loadAttributes(id);
    }

    onReplacementUnitChange(unitId: number, index: number) {
        this.product.changeReplacementUnit(unitId, index).then(() => {
            this.changeDetector.markForCheck();
        });
    }

    onProductUnitChange(unitId: number) {
        this.detailsLoading = true;
        this.product.changeProductUnit(unitId).then(() => {

            this.detailsLoading = false;
            this.changeDetector.markForCheck();
        });
    }

    changeWarehouse(warehouseId) {
        this.detailsLoading = true;
        this.product.changeWarehouse(warehouseId).then(() => {
            this.detailsLoading = false;
            this.changeDetector.markForCheck();
        });
    }

    addToCart() {
        if (!this.product.details.cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        if (this.product.details.quantity === 0) {
            return;
        }
        this.configService.loaderSubj.next(true);

        const request: b2b.AddToCartRequest = {
            cartId: this.product.details.cartId,
            warehouseId: this.product.config.warehouseId || 0,
            createNewCart: this.product.details.cartId === Config.createNewCartId,
            items: [{
                articleId: this.product.details.id,
                quantity: this.product.details.quantity,
                unitDefault: this.product.details.unitId
            }]
        };

        this.cartsService.addToCart(request).then(() => {
            this.product.details.quantity = 1;
            this.configService.loaderSubj.next(false);
        }).catch((err) => {
            this.configService.loaderSubj.next(false);
        });
    }

    addReplacementToCart(index) {
        if (!this.product.replacements[index].cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        if (this.product.replacements[index].quantity === 0) {
            return;
        }
        this.configService.loaderSubj.next(true);
        const request: b2b.AddToCartRequest = {
            cartId: this.product.replacements[index].cartId,
            warehouseId: this.product.config.warehouseId || 0,
            createNewCart: this.product.replacements[index].cartId === Config.createNewCartId,
            items: [{
                articleId: this.product.replacements[index].id,
                quantity: this.product.replacements[index].quantity,
                unitDefault: this.product.replacements[index].unitId
            }]
        };

        this.cartsService.addToCart(request)
            .then(() => {
                this.configService.loaderSubj.next(false);
            })
            .catch(() => {
                this.configService.loaderSubj.next(false);
            });
    }


    changeQuantity(index, quantity) {

        if (index !== undefined && index !== null && index > -1) {
            this.product.replacements[index].quantity = quantity;
        } else {
            this.product.details.quantity = quantity;
        }
    }


    ifTabsVisible(): boolean {

        const visibilityConditions = [
            !!this.product.details.description,
            this.product.attributes && this.product.attributes.length > 0,
            this.product.attachments && this.product.attachments.length > 0,
            this.product.replacements && this.product.replacements.length > 0
        ];

        return visibilityConditions.filter(item => item === true).length > 1;

    }

    loadWarehouses() {

        this.warehousesService.loadWarehouses().then(() => {
            this.changeDetector.markForCheck();
        });

    }

    loadAttributes(id) {
        this.product.loadAttributes(id).then(() => {
            this.changeDetector.markForCheck();
        });
    }

    loadVisibleReplacementsAndAllUnits() {

        this.product.loadVisibleReplacementsAndAllUnits().then(() => {
            window.setTimeout(() => {
                this.changeDetector.markForCheck();
            }, 0);
        });
    }

    loadUnvisibleReplacement(index) {
        this.product.loadUnvisibleReplacement(index).then(() => {
            window.setTimeout(() => {
                this.changeDetector.markForCheck();
            }, 0);
        });
    }

    replacementTrackByFn(i, el) {
        return el.id || i;
    }

    private prepareItemsToAddToStore() {
        return [
            {
                articleId: this.id,
                quantity: this.product.details.quantity,
                unitId: this.product.details.unitId
            }
        ] as b2bStore.AddItemToStore[];
    }

    addToStore() {
        const items = this.prepareItemsToAddToStore();
        const storeId = this.product.details.storeId;

        if (storeId === Config.createNewStoreId) {
            this.storesService.createStore(items);
        } else {
            this.storesService.addToStore(storeId, items);
        }
    }

    ngOnDestroy() {
        this.routeParamsSubscription.unsubscribe();
        this.storesChangedSub.unsubscribe();
        this.thresholdPriceListsChangedSub.unsubscribe();
        this.product.images = undefined;
        this.product.replacements = undefined;
        this.product.attachments = undefined;
        this.product.attributesPromise = undefined;
        this.product.replacementsPromises = undefined;

        if (!this.groupsLoadedSub.closed) {
            this.groupsLoadedSub.unsubscribe();
        }
    }
}
