import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
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

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    host: { 'class': 'app-product-details' },
    providers: [ProductDetailsService],
    encapsulation: ViewEncapsulation.None
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

    isMobile: boolean;

    detailsLoading: boolean;

    breadcrumbs: b2b.Breadcrumb[];
    groupsLoadedSub: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        public groupsService: GroupsService,
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private cartsService: CartsService,
        productDetailsService: ProductDetailsService,
        public warehousesService: WarehousesService
    ) {

        this.r = resourcesService;
        this.product = productDetailsService;
        this.isMobile = this.configService.isMobile;
    }

    ngOnInit() {
        //this.configService.loaderSubj.next(true);
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

            this.product.loadProduct(res.id).then(() => {
                if (this.warehousesService.lastSelectedForProducts !== undefined) {
                    this.selectWarehouse(this.warehousesService.lastSelectedForProducts.id, this.warehousesService.lastSelectedForProducts.text);
                }

                if (!this.product.details.unitsLoaded) {
                    this.detailsLoading = true;
                    this.product.loadUnits(-1).then(() => {
                        this.product.details.unitsLoaded = true;
                        this.detailsLoading = false;
                    });
                }

                if (this.product.replacements && this.product.replacements.length > 0) {

                    this.product.replacements.forEach((item, i) => {
                        if (!item.unitsLoaded) {
                            this.product.loadUnits(i).then(() => {
                                this.product.replacements[i].unitsLoaded = true;
                            });
                        }
                    });
                }

                this.tabsVisible = this.ifTabsVisible();
                this.configService.loaderSubj.next(false);

            }).catch((err: HttpErrorResponse) => {

                this.configService.loaderSubj.next(false);

                if (err.status === 403) {
                    this.message = this.r.translations.forbiddenProduct;
                    return err;
                }

                if (!this.configService.isOnline && this.product.details === undefined) {
                    this.message = this.r.translations.noDataInOfflineMode;
                }

                return err;

            });

        });

        this.scrollToLabel = UiUtils.scrollToLabel;

        if (window.screen.width <= 1024) {
            this.isMobile = true;
        }



    }


    onUnitChange(unitId: number, index = -1) {
        if (index < 0) {
            this.detailsLoading = true;
        }
        this.product.unitConverter(unitId, index).then(() => {

            if (index < 0) {
                this.detailsLoading = false;
            }
        });
    }

    selectWarehouse(warehouseId, warehouseName?) {
        this.detailsLoading = true;
        this.product.selectWarehouse(warehouseId, undefined, warehouseName).then(() => {
            setTimeout(() => {
                this.detailsLoading = false;
           }, 1500);
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
            console.log('Add to cart warehouseId: ', this.product.config.warehouseId);
            reqObj = {
                id: this.product.details.cartId || this.product.details.cartId,
                articleId: this.product.details.id || this.product.details.id,
                quantity: this.product.details.quantity || this.product.details.quantity || 1,
                warehouseId: this.product.config.warehouseId || '0',
                features: '',
                fromQuote: null,
                unitDefault: this.product.details.unitId || this.product.details.unitId || 0,
                calculateDiscount: this.configService.config.calculateDiscount && this.product.details.discountAllowed
            };

        } else {

            reqObj = {
                id: this.product.replacements[index].cartId || this.product.replacements[index].cartId,
                articleId: this.product.replacements[index].id || this.product.replacements[index].id,
                quantity: this.product.replacements[index].quantity || this.product.replacements[index].quantity,
                warehouseId: this.product.config.warehouseId || '0',
                features: '',
                fromQuote: null,
                unitDefault: this.product.replacements[index].unitId || this.product.replacements[index].unitId,
                calculateDiscount: this.configService.config.calculateDiscount && this.product.replacements[index].discountAllowed
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


    ngOnDestroy() {
        this.routeParamsSubscription.unsubscribe();
        this.product.images = null;
        this.product.replacements = null;

        if (!this.groupsLoadedSub.closed) {
            this.groupsLoadedSub.unsubscribe();
        }
    }
}
