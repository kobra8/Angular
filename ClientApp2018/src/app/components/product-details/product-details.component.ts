import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourcesService } from '../../model/resources.service';
import { ProductDetailsService } from '../../model/product-details.service';
import { Subscription } from 'rxjs/Subscription';
import { b2b } from '../../../b2b';
import { CartsService } from '../../model/carts.service';
import { UiUtils } from '../../helpers/ui-utils';
import { ConfigService } from '../../model/config.service';
import { GroupsService } from '../../model/groups.service';

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

    private params: b2b.ProductRequestParams;

    product: ProductDetailsService;

    keys: Function;

    tabsVisible: boolean;

    scrollToLabel: Function;


    constructor(
        private activatedRoute: ActivatedRoute,
        public groupsService: GroupsService,
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private cartsService: CartsService,
        productDetailsService: ProductDetailsService
    ) {

        this.r = resourcesService;
        this.product = productDetailsService;
    }

    ngOnInit() {

        this.keys = Object.keys;

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((res: any) => {

            this.product.details = undefined;

            window.scrollTo(0, 0);

            this.id = res.id;

            this.params = {
                cartId: '1',
                unitNo: '0',
                warehouseId: '0',
                features: ''
            };

            this.product.loadProduct(res.id, this.params).then(() => {

                if (!this.product.details.unitsLoaded) {
                    this.product.loadUnits(-1).then(() => {
                        this.product.details.unitsLoaded = true;
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

                this.product.details.warehouseId = this.params.warehouseId || '0';
                this.tabsVisible = this.ifTabsVisible();
            });

        });

        this.scrollToLabel = UiUtils.scrollToLabel;
        
    }


    onUnitChange(unitId: number, index: number) {

        this.product.unitConverter(unitId, index);
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

            reqObj = {
                id: this.product.details.cartId || this.product.details.cartId,
                articleId: this.product.details.id || this.product.details.id,
                quantity: this.product.details.quantity || this.product.details.quantity || 1,
                warehouseId: this.params.warehouseId || this.product.details.warehouseId || '0',
                features: '',
                fromQuote: null,
                unitDefault: this.product.details.unitId || this.product.details.unitId || 0,
                calculateDiscount: null
            };

        } else {

            reqObj = {
                id: this.product.replacements[index].cartId || this.product.replacements[index].cartId,
                articleId: this.product.replacements[index].id || this.product.replacements[index].id,
                quantity: this.product.replacements[index].quantity || this.product.replacements[index].quantity,
                warehouseId: this.params.warehouseId || this.product.details.warehouseId || '0',
                features: '',
                fromQuote: null,
                unitDefault: this.product.replacements[index].unitId || this.product.replacements[index].unitId,
                calculateDiscount: null
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
    }
}
