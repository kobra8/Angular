import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, Injector, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { CartsService } from '../../model/carts.service';
import { ArrayUtils } from '../../helpers/array-utils';
import { PermissionHelper } from '../../helpers/permission-helper';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';



/**
 * Table of products used on cart and customer list item details
 */
@Component({
    selector: 'app-products-table',
    templateUrl: './products-table.component.html',
    styleUrls: ['./products-table.component.scss'],
    host: { class: 'app-products-table' },
    encapsulation: ViewEncapsulation.None,
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsTableComponent implements OnInit {

    @Input()
    disabled: boolean;

    private _config: b2b.CustomerConfig & b2b.Permissions;

    @Input()
    set config(obj: b2b.CustomerConfig & b2b.Permissions) {

        if (obj && JSON.stringify(obj) !== JSON.stringify(this._config)) {

            if (this.configService.permissions && Object.keys(this.configService.permissions).length !== 0) {

                this._config = Object.assign(obj, this.configService.permissions);

                if (this._columns) {
                    this._columns = PermissionHelper.removeForbiddenColumns(this._columns, this._config);
                }

            } else {
                this._config = obj;
            }

        }
    }

    get config() {
        return this._config;
    }

    private _columns: b2b.ColumnConfig[];

    @Input()
    set columns(newColumns: b2b.ColumnConfig[]) {

        if (newColumns && JSON.stringify(newColumns) !== JSON.stringify(this._columns)) {

            if (this._config && this.configService.permissions && (Object.keys(this.configService.permissions).length !== 0 || Object.keys(this.configService.config).length !== 0)) {
                this._columns = PermissionHelper.removeForbiddenColumns(newColumns, this._config);
            } else {
                this._columns = newColumns;
            }

            if (this._columns.find(el => el.type === 'addToCart') && !this.addManyToCart) {
                this.handleAddToCartColumn();
            }

        }
    }

    get columns() {
        return this._columns;
    }

    @Input()
    products: any[];

    @Input()
    summaries: any[];

    @Input()
    pagination: b2b.PaginationConfig;

    @Input()
    isStepper: boolean;

    @Input()
    cartCount: number | number[];

    @Input()
    weight: b2b.CartWeight;

    r: ResourcesService;

    @Output()
    changePage: EventEmitter<number>;

    @Output()
    changeQuantity: EventEmitter<{ index: number, quantity: number }>;

    @Output()
    removeItem: EventEmitter<{id: number, no: number}>;


    //only promotions, quotes and cart, lazy injected
    private cartsService?: CartsService;
    addManyToCart?: Function;
    globalCartId: number;

    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private injector: Injector,

    ) {

        this.r = resourcesService;
        this.changePage = new EventEmitter<number>();
        this.changeQuantity = new EventEmitter<{ index: number, quantity: number }>();
        this.removeItem = new EventEmitter<{ id: number, no: number }>();
    }

    ngOnInit() {

        this.configService.allConfigsPromise.then(() => {
            //set via setter to clear forbidden columns

            const newConfig = Object.assign({}, this.config, this.configService.permissions); //avoid reference to this.config before check

            if (JSON.stringify(this.config) !== JSON.stringify(newConfig)) {
                this.config = newConfig;
                //this.changeDetector.markForCheck();
            }
        });

        if (this._columns.find(el => el.type === 'addToCart') && !this.addManyToCart) {
            this.handleAddToCartColumn();
        }

        if (this.cartCount && !(this.cartCount instanceof Array)) {
            this.cartCount = ArrayUtils.toRangeArray<number>(this.cartCount);
        }

    }

    handleAddToCartColumn() {

        this.cartsService = this.injector.get(CartsService);
        this.globalCartId = 1;

        this.addManyToCart = (cartId = 1) => {


            const products = this.products.filter(item => {

                return item.quantity > 0;
            });

            if (products.length > 0) {

                const requestArray = products.map(item => {

                    return <b2b.AddToCartRequest>{
                        id: cartId,
                        articleId: item.id,
                        quantity: item.quantity,
                        warehouseId: '0', 
                        features: '',
                        fromQuote: item.fromQuote || null,
                        unitDefault: item.basicUnit,
                        calculateDiscount: this.config.calculateDiscount || this.configService.config.calculateDiscount,
                        itemId: item.no
                    };
                });


                this.cartsService.addManyToCart(requestArray).then(res => {

                    this.products.forEach((item, i) => {
                        item.quantity = 0;
                    });
                });
            }


        };
    }

    trackByFn(i, el) {
        return el.id || el.itemId || el.no || i;
    }

    changeQuantityMiddleware(i: number, quantity: number) {
        this.products[i].quantity = quantity;
        this.changeQuantity.emit({ index: i, quantity: quantity });
    }


    changePageMiddleware(value) {
        this.changePage.emit(value);
    }

    removeItemMiddleware(id, no) {
        this.removeItem.emit({ id: id, no: no });
    }


    genedareDocumentRouteLink(href, properties, document) {
        if (properties instanceof Array) {
            return [href].concat(properties.map(prop => document[prop]));
        }

        return [href, document[properties]];

    }
}
