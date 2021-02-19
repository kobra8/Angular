import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourcesService } from '../../model/resources.service';
import { ProductDetailsService } from '../../model/product-details.service';
import { Subscription } from 'rxjs';
import { b2b } from '../../../b2b';
import { CartsService } from '../../model/carts.service';
import { UiUtils } from '../../helpers/ui-utils';
import { ConfigService } from '../../model/config.service';
import { GroupsService } from '../../model/groups.service';
import { WarehousesService } from '../../model/warehouses.service';
import { HttpErrorResponse } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { MenuService } from 'src/app/model/menu.service';
import { b2bShared } from 'src/b2b-shared';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { ModalMessageType } from 'src/app/model/shared/enums/modal-message-type';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';

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

    r: ResourcesService;

    id: number;
    cartNumbers: string[];

    product: ProductDetailsService;

    keys: Function;

    tabsVisible: boolean;

    scrollToLabel: Function;

    message: string;

    detailsLoading: boolean;

    breadcrumbs: b2b.Breadcrumb[];
    groupsLoadedSub: Subscription;

    cartsToAdd: number[];
    private cartsForArticlesChanged: Subscription;

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
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {

        this.r = resourcesService;
        this.product = productDetailsService;
    }

    ngOnInit() {

        this.keys = Object.keys;

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((res: any) => {
            this.configService.loaderSubj.next(true);


            this.breadcrumbs = this.groupsService.history;

            this.groupsLoadedSub = this.groupsService.groupsLoaded
                .pipe(first())
                .subscribe(() => {
                    this.breadcrumbs = this.groupsService.history;
                });

            if (this.id !== res.id) {
                this.product.images = [];
                this.product.replacements = [];
            }

            this.message = null;

            window.scrollTo(0, 0);

            this.id = res.id;

            this.loadProduct(this.id);

        });

        this.scrollToLabel = UiUtils.scrollToLabel;
        if (!this.cartsToAdd) {
            this.loadCartsToAdd();
        }
        this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForArticlesChanged.subscribe((res) => {
            this.cartsToAdd = res;
            this.changeDetector.markForCheck();
        });
    }


    loadProduct(id = this.id) {
        this.product.images = undefined;
        this.product.replacements = undefined;
        this.product.attachments = undefined;
        this.product.attributesPromise = undefined;
        this.product.details = undefined;
        this.product.replacementsPromises = undefined;


        this.product.loadProduct(id).then(() => {

            if (this.warehousesService.lastSelectedForProducts.id !== undefined && this.warehousesService.lastSelectedForProducts.id !== this.product.config.warehouseId) {
                this.selectWarehouse(this.warehousesService.lastSelectedForProducts.id, this.warehousesService.lastSelectedForProducts.text);
            }

            if (!this.product.details.unitsLoaded) {
                this.detailsLoading = true;
                this.product.loadUnits(-1).then(() => {
                    this.product.details.unitsLoaded = true;
                    this.detailsLoading = false;
                    this.changeDetector.markForCheck();
                });
            }

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

    onUnitChange(unitId: number, index = -1) {
        if (index < 0) {
            this.detailsLoading = true;
        }
        this.product.unitConverterDetails(unitId, index).then(() => {

            if (index < 0) {
                this.detailsLoading = false;
            }

            this.changeDetector.markForCheck();
        });
    }

    selectWarehouse(warehouseId, warehouseName?) {
        this.detailsLoading = true;
        this.product.selectWarehouse(warehouseId, undefined, warehouseName).then(() => {
            this.detailsLoading = false;
            this.changeDetector.markForCheck();
        });
    }

    addToCart(index) {

        if (index !== undefined && index !== null && index > -1) {
            if (this.product.replacements[index].quantity === 0) {
                return;
            }
        } else {
            if (this.product.details.quantity === 0) {
                return;
            }
        }

        let reqObj: b2b.AddToCartRequest;

        if (index === undefined || index === null || index < 0) {
            if (!this.product.details.cartId) {
                this.showNoAvailableCartsMessageInModal();
                return;
            }
            reqObj = {
                cartId: this.product.details.cartId,
                warehouseId: this.product.config.warehouseId || 0,
                items: [{
                    articleId: this.product.details.id || this.product.details.id,
                    quantity: this.product.details.quantity || this.product.details.quantity || 1,
                    unitDefault: this.product.details.unitId || this.product.details.unitId || 0
                }]
            };

        } else {
            if (!this.product.replacements[index].cartId) {
                this.showNoAvailableCartsMessageInModal();
                return;
            }
            reqObj = {
                cartId: this.product.replacements[index].cartId,
                warehouseId: this.product.config.warehouseId || 0,
                items: [{
                    articleId: this.product.replacements[index].id || this.product.replacements[index].id,
                    quantity: this.product.replacements[index].quantity || this.product.replacements[index].quantity,
                    unitDefault: this.product.replacements[index].unitId || this.product.replacements[index].unitId
                }]
            };

        }


        this.cartsService.addToCart(reqObj).then(() => {
            this.product.details.quantity = 1;
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

        //if (index === this.product.replacements.length - 1 && !this.product.replacements[this.product.replacements.length - 2].name) {
        //    this.product.loadUnvisibleReplacement(index - 1).then(() => {
        //        window.setTimeout(() => {
        //            this.changeDetector.markForCheck();
        //        }, 0);
        //    });
        //}


    }

    replacementTrackByFn(i, el) {
        return el.id || i;
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



    ngOnDestroy() {
        this.routeParamsSubscription.unsubscribe();
        this.product.images = undefined;
        this.product.replacements = undefined;
        this.product.attachments = undefined;
        this.product.attributesPromise = undefined;
        this.product.replacementsPromises = undefined;

        if (!this.groupsLoadedSub.closed) {
            this.groupsLoadedSub.unsubscribe();
        }

        if (this.cartsForArticlesChanged) {
            this.cartsForArticlesChanged.unsubscribe();
        }
    }

}
