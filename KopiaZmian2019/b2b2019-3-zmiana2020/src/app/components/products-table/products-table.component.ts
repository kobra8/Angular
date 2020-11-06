import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, Injector, ChangeDetectionStrategy, ChangeDetectorRef, ReflectiveInjector, OnDestroy } from '@angular/core';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { CartsService } from '../../model/carts.service';
import { ArrayUtils } from '../../helpers/array-utils';
import { PermissionHelper } from '../../helpers/permission-helper';
import { ControlContainer, NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { Pagination } from 'src/app/model/shared/pagination';
import { OldPagination } from 'src/app/model/shared/old-pagination';
import { MenuService } from 'src/app/model/menu.service';
import { QuotesService } from 'src/app/model/quotes.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { ModalMessageType } from 'src/app/model/shared/enums/modal-message-type';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';
import { Subscription } from 'rxjs';



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
export class ProductsTableComponent implements OnInit, OnDestroy {

    @Input()
    disabled: boolean;

    private _config: b2b.CustomerConfig & b2b.Permissions;

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
    cartCount: number | number[];

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


    //only promotions, quotes and cart, lazy injected
    private cartsService?: CartsService;
    private quotesService?: QuotesService;

    @Input()
    addToCartFunction?: Function;

    globalCartId: number;

    cartsToAdd: number[];

    @Input()
    noAvailableCartsMessageType?: ModalMessageType;

    @Input()
    detailsContextId: number;

    private cartsForArticlesChanged: Subscription;
    private cartsForQuotesChanged: Subscription;

    constructor(
        resourcesService: ResourcesService,
        public configService: ConfigService,
        private injector: Injector,
        private changeDetector: ChangeDetectorRef,
        public menuService: MenuService,
        private commonModalService: CommonModalService,
        private commonAvailableCartsService: CommonAvailableCartsService

    ) {

        this.r = resourcesService;
        this.changePage = new EventEmitter<number>();
        this.changeQuantity = new EventEmitter<{ index: number, quantity: number }>();
        this.removeItem = new EventEmitter<{ id: number, no: number }>();
        this.unitConverter = new EventEmitter<number>();
        this.errorWhileAddToCart = new EventEmitter<string>();
    }

    ngOnInit() {
        const newConfig = Object.assign({}, this.config, this.configService.permissions); //avoid reference to this.config before check

        if (JSON.stringify(this.config) !== JSON.stringify(newConfig)) {
            this.config = newConfig;
        }

        if (this._columns.find(el => el.type === 'addToCart' || el.type === 'quoteRealizationWithEmptyContent')) {
            this.cartsService = this.injector.get(CartsService);
            this.quotesService = this.injector.get(QuotesService);
            if (!this.addToCartFunction) {
                this.handleAddToCartColumn();
            }

            if (!this.noAvailableCartsMessageType) {
                this.noAvailableCartsMessageType = ModalMessageType.noAvailableCartsToAddArticle;
            }

            this.loadCartsToAdd();
        }


        if (this.cartCount && !(this.cartCount instanceof Array)) {
            this.cartCount = ArrayUtils.toRangeArray<number>(this.cartCount);
        }
    }


    handleAddToCartColumn() {

        this.addToCartFunction = (cartId) => {

            const products = this.products.filter(item => {

                return item.quantity > 0;
            });

            if (products.length > 0) {

                const requestArray: b2b.AddToCartRequest = {
                    cartId: cartId,
                    warehouseId: 0,
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
                });
            }

            return Promise.resolve();
        };
    }

    private loadCartsToAdd() {
        switch (this.noAvailableCartsMessageType) {
            case ModalMessageType.noAvailableCartsToAddArticle:
                this.loadCartsToAddArticle();
                this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForArticlesChanged.subscribe((res) => {
                    this.setCartsToAddWithGlobalCartId(res);
                    this.changeDetector.markForCheck();
                });
                break;
            case ModalMessageType.noAvailableCartsToAddQuote:
                this.loadCartsToAddQuote();
                this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForQuotesChanged.subscribe((res) => {
                    this.setCartsToAddWithGlobalCartId(res);
                    this.changeDetector.markForCheck();
                });
                break;
            default:
        }
    }

    private loadCartsToAddArticle() {
        this.commonAvailableCartsService.getCartsForArticles().then((res) => {
            this.setCartsToAddWithGlobalCartId(res);
            this.changeDetector.markForCheck();
        });
    }

    private loadCartsToAddQuote() {
        this.commonAvailableCartsService.getCartsForQuotes().then((res) => {
            this.setCartsToAddWithGlobalCartId(res);
            this.changeDetector.markForCheck();
        });
    }

    private setCartsToAddWithGlobalCartId(carts: number[]) {
        this.cartsToAdd = carts;
        if (this.cartsToAdd === null || this.cartsToAdd.length < 1) {
            this.globalCartId = undefined;
            return;
        }

        if (!this.cartsToAdd.includes(this.globalCartId)) {
            this.globalCartId = this.cartsToAdd[0];
        }
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

    addToCart(cartId: number) {
        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }
        this.addToCartFunction(cartId, this.detailsContextId).catch((err: HttpErrorResponse) => {

            if (err.status === 409) {
                this.errorWhileAddToCart.next(this.r.translations.forbiddenProductsWhileCopying);
            }

        });
    }

    onOpenAddToCartSelect(cartId: number) {
        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }
    }

    private showNoAvailableCartsMessageInModal() {
        this.commonModalService.showModalMessageType(this.noAvailableCartsMessageType);
    }

    ngOnDestroy(): void {

        if (this.cartsForArticlesChanged) {
            this.cartsForArticlesChanged.unsubscribe();
        }

        if (this.cartsForQuotesChanged) {
            this.cartsForQuotesChanged.unsubscribe();
        }
    }

}
