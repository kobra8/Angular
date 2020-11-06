import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, Injector, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { CartsService } from '../../model/carts.service';
import { PermissionHelper } from '../../helpers/permission-helper';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { Pagination } from 'src/app/model/shared/pagination';
import { OldPagination } from 'src/app/model/shared/old-pagination';
import { MenuService } from 'src/app/model/menu.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { Config } from '../../helpers/config';
import { b2bShared } from 'src/integration/b2b-shared';


/**
 * Table of products used on cart and customer list item details.
 * Old table, for views before swagger and refactoring api.
 * Doesn't support nested tables and popups. Supports cart functions.
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

    private _config: b2b.CustomerConfig & b2b.Permissions & b2bShared.ProductTableConfig;

    @Input()
    set config(obj: b2b.CustomerConfig & b2b.Permissions & { fromQuote?: number }) {

        if (obj && JSON.stringify(obj) !== JSON.stringify(this._config)) {

            if (this.configService.permissions && Object.keys(this.configService.permissions).length !== 0) {

                this._config = Object.assign({}, obj, this.configService.permissions);

                if (this._columns) {
                    //removes forbidden values received from server
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
                //removes forbidden values received from server
                this._columns = PermissionHelper.removeForbiddenColumns(newColumns, this._config);
            } else {
                this._columns = newColumns;
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
    pagination: Pagination | OldPagination;

    @Input()
    oldPagination: boolean;

    @Input()
    isStepper: boolean;

    @Input()
    weight: b2b.CartWeight;

    r: ResourcesService;

    @Output()
    changePage: EventEmitter<number>;

    @Output()
    changeQuantity: EventEmitter<{ index: number, quantity: number }>;

    @Output()
    removeItem: EventEmitter<{ id: number, no: number }>;

    @Output()
    unitConverter: EventEmitter<number>;

    @Output()
    errorWhileAddToCart: EventEmitter<string>;

    @Output()
    updateItemDescription: EventEmitter<b2bShared.UpdateItemDescription>;

    //only promotions, quotes and cart, lazy injected
    private cartsService?: CartsService;
    addToCart?: Function;

    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private injector: Injector,
        private changeDetector: ChangeDetectorRef,
        public menuService: MenuService,
        private commonModalService: CommonModalService

    ) {

        this.r = resourcesService;
        this.changePage = new EventEmitter<number>();
        this.changeQuantity = new EventEmitter<{ index: number, quantity: number }>();
        this.removeItem = new EventEmitter<{ id: number, no: number }>();
        this.unitConverter = new EventEmitter<number>();
        this.errorWhileAddToCart = new EventEmitter<string>();
        this.updateItemDescription = new EventEmitter<b2bShared.UpdateItemDescription>();
    }

    ngOnInit() {
        const newConfig = Object.assign({}, this.config, this.configService.permissions); //avoid reference to this.config before check

        if (JSON.stringify(this.config) !== JSON.stringify(newConfig)) {
            this.config = newConfig;
        }

        if (this._columns.find(el => el.type === 'addToCart')) {
            this.cartsService = this.injector.get(CartsService);
            this.handleAddToCartColumn();
        }
    }


    handleAddToCartColumn() {

        this.addToCart = (cartId: number) => {
            if (!cartId) {
                this.commonModalService.showNoAvailableCartsModalMessage();
                return Promise.resolve();
            }

            const products = this.products.filter(item => {
                return item.quantity > 0;
            });

            if (products.length === 0) {
                return Promise.resolve();
            }

            this.configService.loaderSubj.next(true);
            const requestArray: b2b.AddToCartRequest = {
                cartId: cartId,
                warehouseId: this.config.addToWarehouseId || 0,
                createNewCart: cartId === Config.createNewCartId,
                items: products.map(item => {
                    return <b2b.AddToCartRequestItem>{
                        articleId: item.id,
                        quantity: item.quantity,
                        unitDefault: item.unitId || 0
                    };
                })
            };

            return this.cartsService.addToCart(requestArray).then(res => {
                this.products.forEach((item, i) => {
                    item.quantity = 0;
                });

                this.changeDetector.markForCheck();
                this.configService.loaderSubj.next(false);
            }).catch(() => {
                this.configService.loaderSubj.next(false);
            });
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

    prepareEditItemDescriptionView(product) {
        if (!product) {
            return;
        }

        product.newDescription = product.description;
        product.isDescriptionEdited = true;
    }

    cancelEditingItemDescription(product) {
        product.isDescriptionEdited = false;
    }

    saveItemDescription(product) {
        const data = {
            itemId: product.itemId,
            newDescription: product.newDescription
        } as b2bShared.UpdateItemDescription;
        this.updateItemDescription.emit(data);
    }
}
