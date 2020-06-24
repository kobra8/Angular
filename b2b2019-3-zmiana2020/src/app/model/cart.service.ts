import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { b2bCart } from '../../b2b-cart';
import { CartDocumentType } from './enums/cart-document-type.enum';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ProductBase } from './shared/products-repo';
import { StockLevelMode } from './enums/stock-level-mode.enum';
import { CreditLimitMode } from './enums/credit-limit-mode.enum';
import { ConfigService } from './config.service';
import { ResourcesService } from './resources.service';
import { DateHelper } from '../helpers/date-helper';
import { ArrayUtils } from '../helpers/array-utils';
import { WarehousesService } from './warehouses.service';
import { AttributeType } from './enums/attribute-type.enum';
import { OldPagination } from './shared/old-pagination';
import { CacheService } from './cache.service';
import { CartHeaderService } from './cart/cart-header.service';
import { CartDetailRealizationType } from './cart/enums/cart-detail-realization-type.enum';
import { b2bShared } from 'src/b2b-shared';
import { ProductType } from './enums/product-type.enum';
import { ApplicationType } from './enums/application-type.enum';
import { QuoteCartService } from './quote/quote-cart.service';

@Injectable()
export class CartService extends ProductBase {


    cartId: number;
    isCartFromQuote: boolean;

    private _isValid: boolean;

    get isValid() {
        return this._isValid;
    }

    products: b2b.CartProduct[];

    config: b2b.CartConfig;

    columns: b2b.ColumnConfig[];

    /**
    * Selected options and few settings.
    */
    private _headerData: b2b.CartHeader;

    set headerData(header: b2b.CartHeader) {
        this._headerData = header;
        this._isValid = this.validate();
    }

    get headerData() {
        return this._headerData;
    }

    /**
    * Header attributes.
    */
    attributes: b2b.CartHeaderAttribute[];

    /**
    * Summaries grouped by currency.
    * Calculations contains all of products. (All pages).
    */
    summaries: b2b.CartSummary[];

    /**
    * Weight and volume for all of products. (All pages).
    */
    weight: b2b.CartWeight;

    volume: any[]; //??

    private _selectedDocumentId: CartDocumentType;

    get selectedDocumentId() {
        return this._selectedDocumentId;
    }

    set selectedDocumentId(docId) {
        this._selectedDocumentId = docId;
        this._isValid = this.validate();
    }

    /**
    * Delivery methods are lazy loaded. Array may be empty.
    * Selected delivery method info is always available in headerData.
    */
    deliveryMethods: b2b.DeliveryMethod[];

    /**
    * Payment forms are lazy loaded. Array may be empty.
    * Selected payment form info is always available in headerData.
    */
    paymentForms: b2b.Option2[];

    /**
    * Shipping addresses are lazy loaded. Array may be empty.
    * Selected address info is always available in headerData.
    */
    shippingAddresses: b2b.Option2[];

    /**
     * Object for managing pagination
     */
    pagination: OldPagination;


    private _exceededStates?: boolean;

    get exceededStates() {
        return this._exceededStates;
    }

    set exceededStates(val: boolean) {
        this._exceededStates = val;
        this._isValid = this.validate();
    }


    private _exceededCreditLimit: boolean;

    get exceededCreditLimit() {
        return this._exceededCreditLimit;
    }

    set exceededCreditLimit(isExceeded) {
        this._exceededCreditLimit = isExceeded;
        this._isValid = this.validate();
    }

    private _forbiddenOrder: boolean;

    get forbiddenOrder() {
        return this._forbiddenOrder;
    }

    set forbiddenOrder(isForbidden) {
        this._forbiddenOrder = isForbidden;
        this._isValid = this.validate();
    }

    //forbiddenProductsWarn: boolean;

    private _forbiddenProducts: b2b.ForbiddenProductInfo[];

    get forbiddenProducts() {
        return this._forbiddenProducts;
    }

    set forbiddenProducts(products) {
        this._forbiddenProducts = products;
        this._isValid = this.validate();
    }


    paymentsLoaded: boolean;
    deliveryLoaded: boolean;
    adressesLoaded: boolean;


    orderNumber: string;

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        private resourcesService: ResourcesService,
        warehousesService: WarehousesService,
        private cacheService: CacheService,
        private cartHeaderService: CartHeaderService,
        private quoteCartService: QuoteCartService
    ) {

        super(httpClient, warehousesService, configService);

        this.exceededStates = false;

        this.selectedDocumentId = CartDocumentType.order;

        this.pagination = new OldPagination();



        //default configuration
        this.config = <b2b.CartConfig>{};

        this.columns = [
            { property: 'remove', translation: ' ', type: 'remove' },
            { property: 'name', translation: 'article', type: 'productName' },
            { property: 'subtotalPrice', translation: 'netPrice', type: 'priceWithConverter', priceConverter: 'basicUnitSubtotalPrice' },
            { property: 'totalPrice', translation: 'grossPrice', type: 'priceWithConverter', priceConverter: 'basicUnitTotalPrice' },
            { property: 'quantity', type: 'quantityWithStepper' },
            { property: 'discount', type: 'percent' },
            { property: 'subtotalValue', translation: 'netValue', type: 'price', summaryProperty: 'netAmount' },
            { property: 'totalValue', translation: 'grossValue', type: 'price', summaryProperty: 'grossAmount' },
            { property: 'currency' }
        ];

    }

    /**
     * Setter for header data.
     * Merges current header data with given header object.
     * Doesn't delete params missing in given object.
     */
    setHeaderData(header: b2b.CartHeader = {}): void {


        if (this.configService.permissions.hasAccessToChangeRealizationTime) {

            if (header.receiptDate && !(header.receiptDate instanceof Date)) {
                header.receiptDate = new Date(header.receiptDate);
            }

            if (header.receiptDate && DateHelper.difference(header.receiptDate, DateHelper.endOfDay(new Date())) < 0) {
                header.receiptDate = new Date();
            }
        }

        if (this.configService.permissions.hasAccessToChangePaymentDateTime) {

            if (header.dueDate && !(header.dueDate instanceof Date)) {
                header.dueDate = new Date(header.dueDate);
            }

            if (header.dueDate && DateHelper.difference(header.dueDate, DateHelper.endOfDay(new Date())) < 0) {
                header.dueDate = new Date();
            }
        }


        if (header.completionEntirely && this.configService.applicationId === 0) {
            header.completionEntirely = header.completionEntirely;
        }


        if (header.warehouseId !== undefined) {
            header.warehouseId = header.warehouseId || 0;
        }

        if (header.paymentFormId !== undefined) {
            header.paymentFormId = Number(header.paymentFormId);
        }

        this.headerData = Object.assign(this.headerData || {}, header);
    }

    /**
     * Setter for all cart data wchich can be received in responses.
     * It's used after loading cart and removing product.
     */
    setListData(listData: b2b.CartProductsConvertedResponse | b2b.CartProductRemoveResponseConverted) {

        this.pagination.changeParams({
            hasMore: listData.hasMore
        });


        Object.assign(this.config, listData.items.set2[0]);

        if ((<b2b.CartProductsConvertedResponse>listData).items.set3[0] && (<b2b.CartProductsConvertedResponse>listData).items.set3[0].headerId !== undefined) {
            this.setHeaderData((<b2b.CartProductsConvertedResponse>listData).items.set3[0]);
        }
// JD
        if ((<b2b.CartProductsConvertedResponse>listData).items.set7[0] && (<b2b.CartProductsConvertedResponse>listData).items.set7[0].weightGross !== undefined) {
            this.weight = (<b2b.CartProductsConvertedResponse>listData).items.set7[0];
        } else {
            this.weight = (<b2b.CartProductRemoveResponseConverted>listData).items.set5[0];
        }


        this.products = listData.items.set1.map(item => {
            return this.calculateValues(item, this.headerData.vatDirection);
        });

    }

    /**
     * Updates model with data received from loading cart response.
     */
    setListDataAfterLoad(listData: b2b.CartProductsConvertedResponse) {

        if (!this.deliveryMethods || this.headerData.deliveryMethod !== listData.items.set3[0].deliveryMethod) {
            this.deliveryLoaded = false;

            this.deliveryMethods = [{
                name: listData.items.set3[0].deliveryMethod,
                translationName: listData.items.set3[0].translationDeliveryMethod
            }];

        }

        if (!this.paymentForms || this.headerData.paymentFormId !== listData.items.set3[0].paymentFormId) {
            this.paymentsLoaded = false;

            this.paymentForms = [{
                id: Number(listData.items.set3[0].paymentFormId),
                name: listData.items.set3[0].paymentForm
            }];
        }

        if (!this.shippingAddresses || this.headerData.addressId !== listData.items.set3[0].addressId) {
            this.adressesLoaded = false;

            this.shippingAddresses = [{
                id: Number(listData.items.set3[0].addressId),
                name: listData.items.set3[0].address
            }];
        }

        if (this.configService.config.onlyEntirelyCompletion) {
            listData.items.set3[0].completionEntirely = 1;
        }

        this.setListData(listData);

        this.attributes = listData.items.set4.map(attr => {
            if (attr.type === AttributeType.num && (attr.value === undefined || attr.value === '')) {
                attr.value = 0;
            }
            return attr;
        });
        this.summaries = listData.items.set5;
    }

    /**
     * Updates model with data received from removing product response
     */
    setListDataAfterRemove(listData: b2b.CartProductRemoveResponseConverted) {

        this.setListData(listData);

        this.summaries = listData.items.set3;

    }

    /**
     * Makes request for products, returns promise with server response
     */
    private requestProducts(): Promise<b2b.CartProductsConvertedResponse> {

        const paginationParams = this.pagination.getRequestParams();

        const query = {
            filter: '',
            id: this.cartId.toString(),
            selectedDocument: this.selectedDocumentId.toString(),
            skip: paginationParams.skip,
            top: paginationParams.top
        };

        return this.httpClient.get<b2b.CartProductsResponse>('/api/carts/cartcontent', { params: <any>query }).toPromise().then(res => {

            res.items.set1 = res.items.set1.map(product => {

                return Object.assign(
                    product,
                    {
                        subtotalPrice: ConvertingUtils.stringToNum(product.subtotalPrice),
                        totalPrice: ConvertingUtils.stringToNum(product.totalPrice)
                    }
                );
            });

            res.items.set4 = res.items.set4.map(attribute => {
                return Object.assign(
                    attribute,
                    {
                        required: !!attribute.required
                    }
                );
            });

            return <any>res;
        });
    }

    /**
     * Loads products for given cart and given page params.
     * Updates model and returns promise with products amount.
     */
    loadProducts(id?: number): Promise<number> {

        if (!id) {
            id = this.cartId;
        } else {
            this.cartId = id;
        }


        return this.requestProducts().then(res => {

            this.forbiddenProducts = undefined;
            this.forbiddenOrder = false;

            const productsRes = res;

            if (productsRes.items.set1.length === 0) {
                this.products = [];

                return 0;
            }

            this.exceededStates = productsRes.items.set1[0].exceededStates;

            this.isCartFromQuote = this.checkIfIsCartFromQuote(productsRes.items.set5[0].fromQuote);

            if (DateHelper.difference(new Date(productsRes.items.set3[0].receiptDate), DateHelper.startOfDay(new Date())) < 0) {

                productsRes.items.set3[0].receiptDate = new Date();
                this.setListDataAfterLoad(productsRes);
                if (this.isCartFromQuote) {
                    this.quoteCartService.updateRealizationDate(this.cartId, this.headerData.receiptDate);
                    return;
                }
                switch (this.configService.applicationId) {
                    case ApplicationType.ForXL:
                        this.updateRealizationDateXl(this.cartId, this.headerData.receiptDate);
                        return;

                    case ApplicationType.ForAltum:
                        this.updateRealizationDateAltum(this.cartId, this.headerData.receiptDate);
                        return;

                    default:
                        console.error('loadProducts(updateRealizationDate)(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
                        return;
                }
            }


            if (DateHelper.difference(new Date(productsRes.items.set3[0].dueDate), DateHelper.startOfDay(new Date())) < 0) {

                productsRes.items.set3[0].dueDate = new Date();
                this.setListDataAfterLoad(productsRes);
                if (this.isCartFromQuote) {
                    this.quoteCartService.updatePaymentDate(this.cartId, this.headerData.dueDate);
                    return;
                }
                switch (this.configService.applicationId) {
                    case ApplicationType.ForXL:
                        this.updatePaymentDateXl(this.cartId, this.headerData.dueDate);
                        return;

                    case ApplicationType.ForAltum:
                        this.updatePaymentDateAltum(this.cartId, this.headerData.dueDate);
                        return;

                    default:
                        console.error('loadProducts(updatePaymentDate)(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
                        return;
                }
            }

            this.setListDataAfterLoad(productsRes);
            this._isValid = this.validate();
            return this.products.length;

        });
    }



    calculateValues(item: b2b.CartProductResponseConverted, vatDirection): b2b.CartProduct {

        const newItem: b2b.CartProduct = Object.assign({}, <any>item);

        if (newItem.name.length > 50) {
            newItem.name = newItem.name.substring(0, 50).trim() + '...';
        }

        newItem.quantity = ConvertingUtils.stringToNum(<any>newItem.quantity);

        newItem.unit = (newItem.defaultUnitNo > 0) ? newItem.auxiliaryUnit : newItem.basicUnit;
        newItem.converter = null;

        if (newItem.auxiliaryUnit) {

            newItem.converter = ConvertingUtils.unitConverterString(newItem.denominator, newItem.auxiliaryUnit, newItem.numerator, newItem.basicUnit, newItem.quantity);

            newItem.basicUnitSubtotalPrice = ConvertingUtils.calculateBasicUnitPrice(newItem.subtotalPrice, newItem.denominator, newItem.numerator);
            newItem.basicUnitTotalPrice = ConvertingUtils.calculateBasicUnitPrice(newItem.totalPrice, newItem.denominator, newItem.numerator);
        }


        newItem.cartId = this.cartId;

        if (!newItem.fromBinary) {
            newItem.fromBinary = '';
        }


        if (typeof newItem.quantity === 'string') {
            newItem.quantity = ConvertingUtils.stringToNum(<any>newItem.quantity);
        }


        return this.calculateState(newItem);

    }


    /**
     * Calculates max value
     */
    calculateState(item: b2b.CartProduct): b2b.CartProduct {
        item.stockLevelNumber = ConvertingUtils.stringToNum(item.stockLevel);
        item.max = null;
        if ((this.headerData.stockLevelMode === StockLevelMode.control)
            && this.selectedDocumentId === CartDocumentType.order && item.type !== 3 && item.type !== 4
            && item.type !== 6) {

            item.max = item.stockLevelNumber;
        }

        item.warn = (this.headerData.stockLevelMode === StockLevelMode.control || this.headerData.stockLevelMode === StockLevelMode.warningOnly)
            && this.selectedDocumentId === CartDocumentType.order && item.type !== 3 && item.type !== 4 && item.type !== 6;

        item.dontControl = this.headerData.stockLevelMode < StockLevelMode.control || this.selectedDocumentId === CartDocumentType.inquiry;
        item.disabled = (this.selectedDocumentId === CartDocumentType.order && this.headerData.stockLevelMode === StockLevelMode.control && item.stockLevelNumber === 0)
            || (this.isCartFromQuote && !this.configService.permissions.hasAccessToEditQuantityInQuotes)
            || (item.setDocumentsType < 2 && item.bundleId != null);

        return item;
    }


    /**
     * Makes request to save current quantity
     */
    private saveQuantityRequest(index: number, quantity?: number, cartId?: number): Promise<b2b.CartQuantityConvertedResponse> {

        if (!quantity) {
            quantity = this.products[index].quantity;
        }

        if (!cartId) {
            cartId = this.cartId;
        }

        const query = {
            itemId: this.products[index].itemId.toString(),
            cartId: cartId.toString(),
            quantity: quantity.toString()
        };

        return this.httpClient.put<b2b.CartQuantityResponse>('/api/carts/updateitemquantity', query)
            .toPromise()
            .then(res => {

                res.set1 = res.set1.map(product => {

                    return Object.assign(
                        product,
                        {
                            subtotalPrice: ConvertingUtils.stringToNum(res.set1[0].subtotalPrice),
                            totalPrice: ConvertingUtils.stringToNum(res.set1[0].totalPrice)
                        }
                    );
                });

                return <any>res;
            });
    }

    /**
     * Changes quantity: makes request to save quantity, updates model.
     */
    changeItemQuantity(index: number, quantity: number = this.products[index].quantity, cartId: number = this.cartId): Promise<{ index: number, quantity: number }> {

        return this.saveQuantityRequest(index, quantity, cartId).then(res => {

            const product = res.set1[0];

            this.exceededStates = product.exceededStates;

            Object.assign(this.products[index], product);

            this.products[index].quantity = quantity;
            this.products[index].vatDirection = product.vatDirection === 0 ? 'N' : 'B'; //to check

            this.products[index].discount = ConvertingUtils.stringToNum(product.discount) > 0 ? product.discount + ' %' : '';

            if (this.products[index].auxiliaryUnit) {
                this.products[index].converter = ConvertingUtils.unitConverterString(this.products[index].denominator, this.products[index].auxiliaryUnit, this.products[index].numerator, this.products[index].basicUnit, this.products[index].quantity);
            }

            if (product.bundleId) {
                const alertedproducts = res.set1[0].alertedItems;

                for (let i = 0; i < this.products.length; i++) {
                    for (let j = i; j < alertedproducts.length; j++) {

                        if (this.products[i].itemId === alertedproducts[j].itemId) {
                            this.products[i].bundleId = null;
                            this.products[i].bundleCode = null;
                            this.products[i].bundleQuantity = null;

                        }
                    }
                }
            }

            if (this.configService.applicationId === 0) {
                this.summaries = res.set3;
            } else {
                this.summaries = res.set2;
            }

            if (res.set5.length > 0) {
                this.weight = res.set5[0];
            }

            return { index: index, quantity: quantity };
        });


    }


    /**
     * Makes request for payment forms.
     */
    private requestPaymetForms(cartId: number = this.cartId): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>(`api/carts/paymentforms/${cartId}`).toPromise();
    }

    /**
     * Makes request for shipping addresses.
     */
    private requestShippingAddresses(cartId: number = this.cartId): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>(`api/carts/shippingaddresses/${cartId}`).toPromise();
    }

    /**
     * Makes request for delivery methods.
     */
    private requestDeliveryMethods(cartId: number = this.cartId): Promise<b2b.DeliveryMethod[]> {

        return this.httpClient.get<b2b.DeliveryMethod[]>(`api/carts/deliverymethods/${cartId}`).toPromise();
    }

    /**
     * Makes request for delivery methods and updates model.
     * Returns promise with delivery methods array.
     */
    loadDeliveryMethods(cartId: number = this.cartId): Promise<b2b.DeliveryMethod[]> {

        if (!this.deliveryLoaded) {

            return this.requestDeliveryMethods(cartId).then((res: b2b.DeliveryMethod[]) => {

                if (res && res.length > 0) {

                    this.deliveryMethods = res.map((item: b2b.DeliveryMethod, index) => {


                        return {
                            id: index,
                            name: item.name,
                            translationName: item.translationName
                        };
                    });
                }

                this.deliveryLoaded = true;

                return this.deliveryMethods;
            });

        } else {

            return Promise.resolve(this.deliveryMethods);
        }
    }

    /**
     * Makes request for payment forms and updates model.
     * Returns promise with payment forms array.
     */
    loadPaymentForms(cartId: number = this.cartId): Promise<b2b.Option2[]> {

        if (!this.paymentsLoaded) {


            return this.requestPaymetForms(cartId).then((res: b2b.Option2[]) => {

                this.paymentsLoaded = true;

                if (res && res.length > 0) {
                    this.paymentForms = res;
                }

                return res;
            });

        } else {

            Promise.resolve(this.paymentForms);
        }
    }

    /**
     * Makes request for shipping addresses and updates model.
     * Returns promise with shipping addresses array.
     */
    loadShippingAddresses(cartId: number = this.cartId): Promise<b2b.Option2[]> {


        if (!this.adressesLoaded) {

            return this.requestShippingAddresses(cartId).then((res: b2b.Option2[]) => {
                this.adressesLoaded = true;

                if (res && res.length > 0) {
                    this.shippingAddresses = res;
                }

                return res;
            });

        } else {

            Promise.resolve(this.shippingAddresses);
        }


    }

    /**
     * Makes request for header attributes.
     */
    private updateHeaderAttributeRequest(attr: b2b.CartHeaderAttributeRequest): Promise<void> {

        return this.httpClient.put<void>('/api/carts/attributechanged', attr).toPromise();
    }


    /**
     * Makes request for header attributes and updates model.
     */
    updateHeaderAttribute(index: number, value = this.attributes[index].value): Promise<void> {

        this.attributes[index].value = value;

        this._isValid = this.validate();

        const attributeReq: b2b.CartHeaderAttributeRequest = {
            applicationId: this.attributes[index].applicationId || this.configService.applicationId,
            attributeClassId: this.attributes[index].attributeClassId,
            documentId: this.attributes[index].documentId || this.selectedDocumentId,
            headerId: this.attributes[index].headerId || this.headerData.headerId,
            itemId: 0, //hardcoded
            type: this.attributes[index].type || this.attributes[index].type,
            value: this.attributes[index].value
        };


        return this.updateHeaderAttributeRequest(attributeReq);
    }

    ////????
    //private changeDocumentAttributesRequest(documentId: number, headerId: number, cartId: number): ng.IHttpPromise<any> {

    //  return this.$http.get(`api/carts/documentAttributes?headerId=${headerId}&cartId=${cartId}&documentId=${documentId}&itemId=0`);
    //}

    /////???
    //changeDocumentAttributes(documentId: CartDocumentType = this.selectedDocumentId, headerId: number = this.headerData.headerId, cartId: number = this.cartId): ng.IPromise<void> {

    //  return this.changeDocumentAttributes(documentId, headerId, cartId).then((res) => {

    //  });

    //}

    /**
     * Makes request for removing product from cart and updated model with corrected product's list.
     * Returns promise with updated product list infos.
     */
    private removeItemRequest(itemId: number, cartId = this.cartId): Promise<b2b.CartProductRemoveResponseConverted> {

        const paginationParams = this.pagination.getRequestParams();

        const params: any = {
            cartId: cartId,
            itemId: itemId,
            skip: paginationParams.skip,
            top: paginationParams.top,
            filter: '' //search text
        };

        return this.httpClient.delete<b2b.CartProductRemoveResponse>('/api/carts/removecartitem', { params: params })
            .toPromise()
            .then(res => {

                res.items.set1 = res.items.set1.map(product => {

                    return Object.assign(
                        product,
                        {
                            subtotalPrice: ConvertingUtils.stringToNum(product.subtotalPrice),
                            totalPrice: ConvertingUtils.stringToNum(product.totalPrice)
                        }
                    );

                });

                return <any>res;

            });
    }

    /**
     * Makes request for removing product from cart. Updates model with new product's list.
     * Returns promise with products amonut.
     * @param no product.no property, not index.
     */
    removeItem(itemId: number, no: number, cartId = this.cartId): Promise<number> {

        return this.removeItemRequest(itemId, cartId).then(res => {

            if (res.items.set1.length === 0) {
                return 0;
            }

            this.setListDataAfterRemove(res);

            this.getItemsWithExceededStates(); // used also for validate credit limit

            this.exceededStates = res.items.set1[0].exceededStates;

            if (this.forbiddenProducts) {
                const skip = Number(this.pagination.getRequestParams().skip);
                const removedProductIndex = this.forbiddenProducts.findIndex(product => no === product.cartPosition);
                const arrayIndex = no - skip;

                if (removedProductIndex !== -1) {
                    this.forbiddenProducts = ArrayUtils.remove(this.forbiddenProducts, removedProductIndex);
                }
                this.updateForbiddenProducts(arrayIndex);
            }

            this._isValid = this.validate();

            return this.products.length;
        });
    }


    /**
     * Makes request for check units.
     */
    private checkUnitsRequest(cartId: number = this.cartId): Promise<b2b.CheckUnitsResponse> {

        return this.httpClient.get<b2b.CheckUnitsResponse>(`api/carts/checkunits?cartid=${cartId}&documenttypeid=${13}`).toPromise();
    }

    /**
     * Makes request for check units, return promise with array of incorrect elements.
     */
    checkUnitsValidity(cartId: number = this.cartId): Promise<boolean> {

        return this.checkUnitsRequest(cartId).then((res) => {

            if (res.set1.length > 0) {

                const uniqueCodes = Array.from(new Set(res.set1.map(prod => prod.code)));
                let forbiddenProducts = [];

                uniqueCodes.forEach(code => {
                    const matchedProducts = this.products.filter(product => product.code === code);
                    const forbiddenProductsPerCode = matchedProducts.map(product => {
                        return {
                            articleId: product.id,
                            cartPosition: product.no
                        };
                    });

                    forbiddenProducts = forbiddenProducts.concat(forbiddenProductsPerCode);
                });

                this.forbiddenProducts = forbiddenProducts;

                this.updateForbiddenProducts();

                return false;
            }

            return true;

        });
    }


    /**
     * Makes request for adding new order
     */
    private addOrderRequest(cartId: number = this.cartId): Promise<b2b.AddOrderResponse & HttpErrorResponse> {

        return this.httpClient.post<b2b.AddOrderResponse & HttpErrorResponse>('/api/orders/addorder', Number(cartId)).toPromise();
    }

    /**
     * Makes request for adding new inquiry
     */
    private addInquireRequest(cartId: number = this.cartId): Promise<b2b.AddOrderResponse & HttpErrorResponse> {

        return this.httpClient.post<b2b.AddOrderResponse & HttpErrorResponse>('/api/inquiries/addinquiry', Number(cartId)).toPromise();
    }


    /**
     * Makes request for adding new document (order or inquiry). Returns promise with document ids or errors.
     */
    addDocument(cartId: number = this.cartId, documentType: CartDocumentType = this.selectedDocumentId): Promise<b2b.AddDocumentSuccess & HttpErrorResponse> {

        this.forbiddenProducts = undefined;

        let promise = null;

        if (this.configService.applicationId === 1 && (this.headerData.stockLevelMode !== StockLevelMode.noControl || this.headerData.creditLimitMode !== CreditLimitMode.noControl)) {


            promise = this.checkUnitsValidity().then((isValid) => {

                if (isValid) {

                    return (documentType === 0) ? this.addOrderRequest(cartId) : this.addInquireRequest(cartId);

                }

            }).catch(err => {
                return Promise.reject(err);
            });

        } else {

            promise = (documentType === 0) ? this.addOrderRequest(cartId) : this.addInquireRequest(cartId);
        }

        return promise.then((res: b2b.AddOrderResponse) => {

            if (res.error || res.message) {

                return Promise.reject(<b2b.AddOrderResponse>{
                    error: res.message || res.error && !res.error.message || res.error.message
                });

            }

            const ids = res.set1 ? { id: res.set1[0].id, number: res.set1[0].number } : { id: res[1], number: res[0] };

            this.orderNumber = ids.number;


            const cacheName = documentType === 0 ? '/api/orders' : '/api/inquiries';

            return this.cacheService.clearCache(cacheName).then(() => {

                return {
                    result: 0,
                    ids: ids
                } as b2b.AddDocumentSuccess;

            });



        }).catch((err: HttpErrorResponse) => {

            if (err.status === 403) {

                if (err.error && err.error.length && err.error.length > 0) {

                    if (this.forbiddenProducts) {
                        this.forbiddenProducts = this.forbiddenProducts.concat(err.error);
                    } else {
                        this.forbiddenProducts = err.error;
                    }


                    this.updateForbiddenProducts();

                } else {

                    this.forbiddenOrder = true;
                }
            }

            return Promise.reject(err);
        });
    }

    selectDocument(documentId: CartDocumentType) {

        this.selectedDocumentId = documentId;

        this.products.forEach((item) => {
            this.calculateState(item);
        });

        this.products = this.products.slice(); //change refference for onPush table detection
    }

    private requestItemsWithExceededStates(cartId = this.cartId): Promise<b2b.ExceetedStockLimitResponse> {

        return this.httpClient.get<b2b.ExceetedStockLimitResponse>('/api/carts/exceededstates/' + cartId).toPromise();
    }


    getItemsWithExceededStates(cartId = this.cartId): Promise<b2b.ExceetedStockLimitResponse> {

        return this.requestItemsWithExceededStates(cartId).then(res => {
            this.exceededCreditLimit = res && res.set1[0].exceededCreditLimit;

            return res;
        });
    }

    /**
     * Updates properties for forbidden products (this.forbiddenProductsWarn, product[i].forbidden).
     * Updates cart positions in array of forbidden porducts, when decreeseNoFromIndex given. Required for removing product.
     * @param decreeseNoFromIndex index of products array
     */
    updateForbiddenProducts(decreeseNoFromIndex?: number): void {

        if (this.forbiddenProducts && this.forbiddenProducts.length > 0) {

            //this.forbiddenProductsWarn = true;

            const paginationParams = this.pagination.getRequestParams();
            const from = Number(paginationParams.skip) - 1;
            let to = Number(paginationParams.skip) + Number(paginationParams.top) - 1;

            if (to >= (from + this.products.length)) {
                to = from + this.products.length - 1;
            }

            this.forbiddenProducts.forEach((item, i) => {


                if (decreeseNoFromIndex !== undefined && (item.cartPosition - 1) >= decreeseNoFromIndex) {
                    item.cartPosition -= 1;
                }

                const arrayPos = item.cartPosition - from - 1;

                if ((arrayPos + from) >= from && (arrayPos + from) <= to) {
                    //only current page
                    this.products[arrayPos].forbidden = true;
                }

            });

            this.products = this.products.slice(); //change refference for onPush table detection

            return;
        }

        this.forbiddenProducts = undefined;

    }

    changePage(currentPage) {

        this.pagination.changePage(currentPage);
        return this.loadProducts().then(() => {
            this.updateForbiddenProducts();
        });
    }


    validate(): boolean {

        if (this.configService.config === undefined || this.headerData === undefined) {
            return false;
        }

        const baseValidation = !this.forbiddenOrder
            && (!this.forbiddenProducts || this.forbiddenProducts.length === 0)
            && this.validateAttributes();

        if (this.selectedDocumentId === CartDocumentType.inquiry) {
            return baseValidation;
        }

        return baseValidation
            && !this.configService.config.orderBlock //changes only when log in or log out
            && !(this.headerData.creditLimitMode === CreditLimitMode.control && this.exceededCreditLimit && this.headerData.isConfirm === 1)
            && !(this.headerData.stockLevelMode === StockLevelMode.control && this.exceededStates)
            && this.validateHeaderData();
    }


    validateAttributes(): boolean {

        if (!this.attributes || this.attributes.length === 0) {
            return true;
        }

        if (this.attributes.length === 1) {

            const current = this.attributes[0];

            if (current.required) {

                if (current.type === 3) {
                    return Number.parseFloat(current.value) > 0;
                }

                return !!current.value;
            }

            return true;
        }

        return (<any>this.attributes).reduce((reduced: boolean & b2b.CartHeaderAttribute, current: b2b.CartHeaderAttribute, i) => {

            if (i === 1 && reduced.required && !reduced.value) {
                return false;
            }

            if (current.required) {

                if (current.type === 3) {
                    return reduced && Number.parseFloat(current.value) > 0;
                }

                return reduced && !!current.value;
            }

            return !!reduced;
        });

    }


    validateHeaderData(): boolean {

        const validCompletion = this.configService.applicationId === 1
            || !this.configService.permissions.hasAccessToMarkOrderToEntirelyRealization
            || (this.configService.applicationId === 0 && this.configService.permissions.hasAccessToMarkOrderToEntirelyRealization && Number.isInteger(this.headerData.completionEntirely));

        return validCompletion
            && !!this.headerData.address
            && Number.isInteger(this.headerData.addressId)
            && !!this.headerData.dueDate
            && !!this.headerData.paymentForm
            && Number.isInteger(this.headerData.paymentFormId)
            && !!this.headerData.receiptDate
            && Number.isInteger(this.headerData.warehouseId)
            && (!!this.headerData.warehouseName || this.headerData.warehouseId === 0);
    }


    setPaymentDateDate(newPaymentDate: Date) {
        this.headerData.dueDate = newPaymentDate;
    }

    updateSourceNumberXl(cartId: number, newSourceNumber: string): Promise<void> {
        return this.cartHeaderService.updateSourceNumberXl(<b2bCart.UpdateSourceNumberRequest>{ cartId: cartId, newSourceNumber: newSourceNumber }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updateSourceNumberAltum(cartId: number, newSourceNumber: string): Promise<void> {
        return this.cartHeaderService.updateSourceNumberAltum(<b2bCart.UpdateSourceNumberRequest>{ cartId: cartId, newSourceNumber: newSourceNumber }).then(this.setHeaderDataIfRequired.bind(this));
    }


    updateDescriptionXl(cartId: number, description: string): Promise<void> {
        return this.cartHeaderService.updateDescriptionXl(<b2bCart.UpdateDescriptionRequest>{ cartId: cartId, newDescription: description }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updateDescriptionAltum(cartId: number, description: string): Promise<void> {
        return this.cartHeaderService.updateDescriptionAltum(<b2bCart.UpdateDescriptionRequest>{ cartId: cartId, newDescription: description }).then(this.setHeaderDataIfRequired.bind(this));
    }


    updateAddressXl(cartId: number, addressId: number): Promise<void> {
        return this.cartHeaderService.updateAddressXl(<b2bCart.UpdateAddressRequest>{ cartId: cartId, addressId: addressId }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updateAddressAltum(cartId: number, addressId: number): Promise<void> {
        return this.cartHeaderService.updateAddressAltum(<b2bCart.UpdateAddressRequest>{ cartId: cartId, addressId: addressId }).then(this.setHeaderDataIfRequired.bind(this));
    }


    updateRealizationDateXl(cartId: number, realizationDate: Date): Promise<void> {
        return this.cartHeaderService.updateRealizationDateXl(<b2bCart.UpdateRealizationDateRequest>{ cartId: cartId, realisationDate: DateHelper.dateToString(realizationDate) }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updateRealizationDateAltum(cartId: number, realizationDate: Date): Promise<void> {
        return this.cartHeaderService.updateRealizationDateAltum(<b2bCart.UpdateRealizationDateRequest>{ cartId: cartId, realisationDate: DateHelper.dateToString(realizationDate) }).then(this.setHeaderDataIfRequired.bind(this));
    }


    updateRealizationXl(cartId: number, realizationType: CartDetailRealizationType): Promise<void> {
        return this.cartHeaderService.updateRealizationXl(<b2bCart.UpdateRealizationRequest>{ cartId: cartId, realisationType: realizationType.valueOf() }).then(this.setHeaderDataIfRequired.bind(this));
    }


    updateDeliveryMethodXl(cartId: number, deliveryMethod: string): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdateDeliveryMethodXlRequest = { cartId: cartId, deliveryMethod: deliveryMethod, skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updateDeliveryMethodXl(request).then((res: b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse) => {
            this.updateCartSummaryXl(res.cartSummary);
            this.updateCartProductsWithPriceXl(res.items);
            this.setHeaderDataIfRequired();
            return res;
        });
    }

    updateDeliveryMethodAltum(cartId: number, deliveryMethod: number): Promise<void> {
        const paginationParams = this.pagination.getRequestParams();
        return this.cartHeaderService.updateDeliveryMethodAltum(<b2bCart.UpdateDeliveryMethodAltumRequest>{ cartId: cartId, deliveryMethod: deliveryMethod, skip: paginationParams.skip, take: paginationParams.top }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updatePaymentFormXl(cartId: number, paymentFormId: number): Promise<b2bCart.UpdateCartHeaderPaymentFormResponseModelXl> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdatePaymentFormRequest = { cartId: cartId, paymentFormId: paymentFormId, skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updatePaymentFormXl(request).then((res: b2bCart.UpdateCartHeaderPaymentFormResponseModelXl) => {
            this.setPaymentDateDate(<Date>DateHelper.stringToDate(res.newPaymentDate));
            this.updateCartSummaryXl(res.cartSummary);
            this.updateCartProductsWithPriceXl(res.items);
            this.setHeaderDataIfRequired();
            return res;
        });
    }

    updatePaymentFormAltum(cartId: number, paymentFormId: number): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryAltumResponse> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdatePaymentFormRequest = { cartId: cartId, paymentFormId: paymentFormId, skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updatePaymentFormAltum(request).then((res: b2bCart.UpdateCartHeaderArticlesWithSummaryAltumResponse) => {
            this.updateCartSummaryAltum(res.cartSummary);
            this.updateCartProductsWithPriceAltum(res.items);
            this.setHeaderDataIfRequired();
            return res;
        });
    }



    updatePaymentDateXl(cartId: number, paymentDate: Date): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdatePaymentDateRequest = { cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate), skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updatePaymentDateXl(request).then((res: b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse) => {
            this.updateCartSummaryXl(res.cartSummary);
            this.updateCartProductsWithPriceXl(res.items);
            this.setHeaderDataIfRequired();
            return res;
        });
    }

    updatePaymentDateAltum(cartId: number, paymentDate: Date): Promise<void> {
        const paginationParams = this.pagination.getRequestParams();
        return this.cartHeaderService.updatePaymentDateAltum(<b2bCart.UpdatePaymentDateRequest>{ cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate), skip: paginationParams.skip, take: paginationParams.top }).then(this.setHeaderDataIfRequired.bind(this));
    }

    updateWarehouseXl(cartId: number, warehouseId: number): Promise<b2bCart.UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdateWarehouseRequest = { cartId: cartId, warehouseId: warehouseId, skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updateWarehouseXl(request).then((res: b2bCart.UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse) => {
            this.updateCartSummaryXl(res.cartSummary);
            this.exceededStates = res.exceededStatesOnEntireCart;
            this.updateCartProductsWithPriceAndStockStateXl(res.items);
            this._isValid = this.validate();
            this.setHeaderDataIfRequired();
            return res;
        });
    }

    updateWarehouseAltum(cartId: number, warehouseId: number): Promise<b2bCart.UpdateCartHeaderWarehouseResponseModelAltum> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bCart.UpdateWarehouseRequest = { cartId: cartId, warehouseId: warehouseId, skip: paginationParams.skip, take: paginationParams.top };
        return this.cartHeaderService.updateWarehouseAltum(request).then((res: b2bCart.UpdateCartHeaderWarehouseResponseModelAltum) => {
            this.exceededStates = res.exceededStatesOnEntireCart;
            this.updateCartProductsWithStockStateAltum(res.items);
            this._isValid = this.validate();
            this.setHeaderDataIfRequired();
            return res;
        });
    }


    private updateCartSummaryXl(cartSummaryXl: b2bCart.CartSummaryXl) {
        this.updateCartSummaryPricesListBase(cartSummaryXl.cartSummaryPricesList);
        this.updateCartSummaryBase(cartSummaryXl);
    }

    private updateCartSummaryAltum(cartSummaryAltum: b2bCart.CartSummaryAltum) {
        this.updateCartSummaryPricesListBase(cartSummaryAltum.cartSummaryPricesList);
        this.updateCartSummaryBase(cartSummaryAltum);
    }

    private updateCartSummaryPricesListBase(cartSummaryPricesListBase: b2bCart.CartSummaryPricesBase[]) {
        this.summaries = this.summaries.map((item, i) => {
            item.count = cartSummaryPricesListBase[i].count;
            item.currency = cartSummaryPricesListBase[i].currency;
            item.grossAmount = cartSummaryPricesListBase[i].grossAmount;
            item.id = cartSummaryPricesListBase[i].id;
            item.netAmount = cartSummaryPricesListBase[i].netAmount;
            item.vatValue = cartSummaryPricesListBase[i].vatValue;
            return item;
        });
    }

    private updateCartSummaryBase(cartSummary: b2bCart.CartSummaryBase) {
        this.weight = {
            volume: cartSummary.weightAndVolume.volume,
            weightGross: cartSummary.weightAndVolume.weightGross
        };
    }

    private updateCartProductsWithPriceXl(refreshedProductsXl: b2bCart.CartArticleListItemXl[]) {
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedProductsXl.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProductBase(currentProduct, refreshedProduct);
            return this.updateCartProductWithPriceXl(currentProduct, refreshedProduct);
        });
    }


    private updateCartProductsWithPriceAltum(refreshedProductsAltum: b2bCart.CartArticleListItemAltum[]) {
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedProductsAltum.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProductBase(currentProduct, refreshedProduct);
            return this.updateCartProductWithPriceAltum(currentProduct, refreshedProduct);
        });
    }

    private updateCartProductBase(currentProduct: b2b.CartProduct, refreshedProductBase: b2bCart.CartArticleListItemBase) {
        currentProduct.denominator = refreshedProductBase.unit.denominator.representsExistingValue ? refreshedProductBase.unit.denominator.value : 1;
        currentProduct.numerator = refreshedProductBase.unit.numerator.representsExistingValue ? refreshedProductBase.unit.numerator.value : 1;
        currentProduct.unit = refreshedProductBase.unit.auxiliaryUnit.representsExistingValue ? refreshedProductBase.unit.auxiliaryUnit.unit : refreshedProductBase.unit.basicUnit;
        currentProduct.converter = null;

        if (refreshedProductBase.unit.auxiliaryUnit.representsExistingValue) {
            currentProduct.converter = ConvertingUtils.unitConverterString(currentProduct.denominator, refreshedProductBase.unit.auxiliaryUnit.unit, currentProduct.numerator, currentProduct.basicUnit, currentProduct.quantity);
        }

        currentProduct.cartId = this.cartId;
        if (!currentProduct.fromBinary) {
            currentProduct.fromBinary = '';
        }
        if (typeof currentProduct.quantity === 'string') {
            currentProduct.quantity = ConvertingUtils.stringToNum(<any>currentProduct.quantity);
        }
    }

    private updateCartProductWithPriceXl(currentProduct: b2b.CartProduct, refreshedProductXl: b2bCart.CartArticleListItemXl) {
        this.updateCartProductPriceBase(currentProduct, refreshedProductXl.price);
        const currency = refreshedProductXl.price.currency;
        const discountPermission = refreshedProductXl.article.discountPermission;
        return Object.assign({}, currentProduct, currency, discountPermission);
    }

    private updateCartProductWithPriceAltum(currentProduct: b2b.CartProduct, refreshedProductAltum: b2bCart.CartArticleListItemAltum) {
        this.updateCartProductPriceBase(currentProduct, refreshedProductAltum.price);
        const currency = refreshedProductAltum.price.currency;
        const discountPermission = refreshedProductAltum.article.discountPermission;
        return Object.assign({}, currentProduct, currency, discountPermission);
    }

    private updateCartProductPriceBase(currentProduct: b2b.CartProduct, refreshedPriceBase: b2bShared.ArticlePriceBase) {
        currentProduct.discount = refreshedPriceBase.discount;
        currentProduct.subtotalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.subtotalPrice);
        currentProduct.subtotalValue = refreshedPriceBase.subtotalValue;
        currentProduct.totalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.totalPrice);
        currentProduct.totalValue = refreshedPriceBase.totalValue;
        currentProduct.basicUnitSubtotalPrice = refreshedPriceBase.subtotalUnitPrice.representsExistingValue ? ConvertingUtils.stringToNum(refreshedPriceBase.subtotalUnitPrice.value) : null;
        currentProduct.basicUnitTotalPrice = refreshedPriceBase.totalUnitPrice.representsExistingValue ? ConvertingUtils.stringToNum(refreshedPriceBase.totalUnitPrice.value) : null;
    }


    private updateCartProductsWithPriceAndStockStateXl(refreshedProductsXl: b2bCart.CartArticleListItemWithStockLevelXl[]) {
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedProductsXl.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProductBase(currentProduct, refreshedProduct);
            this.updateCartProductStockStateXl(currentProduct, refreshedProduct);
            return this.updateCartProductWithPriceXl(currentProduct, refreshedProduct);
        });
    }

    private updateCartProductsWithStockStateAltum(refreshedProductsAltum: b2bCart.CartArticleWithStockLevelAltum[]) {
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedProductsAltum.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProductStockStateAltum(currentProduct, refreshedProduct);
            return currentProduct;
        });
    }


    private updateCartProductStockStateXl(currentProduct: b2b.CartProduct, refreshedProductXl: b2bCart.CartArticleListItemWithStockLevelXl) {
        currentProduct.type = refreshedProductXl.article.type;
        currentProduct.isUnitTotal = refreshedProductXl.unit.isUnitTotal ? 1 : 0;
        this.updateCartProductStockStateBase(currentProduct, refreshedProductXl);
    }

    private updateCartProductStockStateAltum(currentProduct: b2b.CartProduct, refreshedProductAltum: b2bCart.CartArticleWithStockLevelAltum) {
        currentProduct.type = refreshedProductAltum.article.type;
        currentProduct.isUnitTotal = refreshedProductAltum.isUnitTotal ? 1 : 0;
        this.updateCartProductStockStateBase(currentProduct, refreshedProductAltum);
    }

    private updateCartProductStockStateBase(currentProduct: b2b.CartProduct, refreshedProductBase: b2bCart.CartArticleListItemWithStockLevelBase) {
        currentProduct.stockLevel = refreshedProductBase.stockLevel.representsExistingValue ? refreshedProductBase.stockLevel.value : null;
        currentProduct.stockLevelNumber = ConvertingUtils.stringToNum(currentProduct.stockLevel);

        if ((this.headerData.stockLevelMode === StockLevelMode.control)
            && this.selectedDocumentId === CartDocumentType.order && currentProduct.type !== ProductType.cost && currentProduct.type !== ProductType.service
            && currentProduct.type !== 6) {

            currentProduct.max = currentProduct.stockLevelNumber;
        }

        currentProduct.warn = (this.headerData.stockLevelMode === StockLevelMode.control || this.headerData.stockLevelMode === StockLevelMode.warningOnly)
            && this.selectedDocumentId === CartDocumentType.order && currentProduct.type !== 3 && currentProduct.type !== 4 && currentProduct.type !== 6;

        currentProduct.dontControl = this.headerData.stockLevelMode < StockLevelMode.control || this.selectedDocumentId === CartDocumentType.inquiry;
        currentProduct.disabled = (this.selectedDocumentId === CartDocumentType.order && this.headerData.stockLevelMode === StockLevelMode.control && currentProduct.stockLevelNumber === 0)
            || (this.isCartFromQuote && !this.configService.permissions.hasAccessToEditQuantityInQuotes)
            || (currentProduct.setDocumentsType < 2 && currentProduct.bundleId != null);
    }


    private setHeaderDataIfRequired(): void {
        if (this.configService.permissions.hasAccessToChangeRealizationTime) {

            if (this.headerData.receiptDate && !(this.headerData.receiptDate instanceof Date)) {
                this.headerData.receiptDate = new Date(this.headerData.receiptDate);
            }

            if (this.headerData.receiptDate && DateHelper.difference(this.headerData.receiptDate, DateHelper.endOfDay(new Date())) < 0) {
                this.headerData.receiptDate = new Date();
            }
        }

        if (this.configService.permissions.hasAccessToChangePaymentDateTime) {

            if (this.headerData.dueDate && !(this.headerData.dueDate instanceof Date)) {
                this.headerData.dueDate = new Date(this.headerData.dueDate);
            }

            if (this.headerData.dueDate && DateHelper.difference(this.headerData.dueDate, DateHelper.endOfDay(new Date())) < 0) {
                this.headerData.dueDate = new Date();
            }
        }
    }

    private checkIfIsCartFromQuote(fromQuoteValue?: number): boolean {
        return fromQuoteValue ? true : false;
    }

    updateSourceNumberInCartFromQuote(cartId: number, sourceNumber: string): Promise<void> {
        return this.quoteCartService.updateSourceNumber(cartId, sourceNumber);
    }

    updateDescriptionInCartFromQuote(cartId: number, description: string): Promise<void> {
        return this.quoteCartService.updateDescription(cartId, description);
    }

    updateAddressInCartFromQuote(cartId: number, addressId: number): Promise<void> {
        return this.quoteCartService.updateAddress(cartId, addressId);
    }

    updateRealizationDateInCartFromQuote(cartId: number, realizationDate: Date): Promise<void> {
        return this.quoteCartService.updateRealizationDate(cartId, realizationDate);
    }

    updateRealizationXlInCartFromQuote(cartId: number, realizationType: number): Promise<void> {
        return this.quoteCartService.updateRealizationXl(cartId, realizationType);
    }

    updateDeliveryMethodInCartFromQuote(cartId: number, deliveryMethod: string): Promise<void> {
        return this.quoteCartService.updateDeliveryMethod(cartId, deliveryMethod);
    }

    updatePaymentFormXlInCartFromQuote(cartId: number, paymentFormId: number): Promise<void> {
        return this.quoteCartService.updatePaymentFormXl(cartId, paymentFormId).then((res) => {
            this.setPaymentDateDate(<Date>DateHelper.stringToDate(res.paymentDate));
        });
    }

    updatePaymentFormAltumInCartFromQuote(cartId: number, paymentFormId: number): Promise<void> {
        return this.quoteCartService.updatePaymentFormAltum(cartId, paymentFormId);
    }

    updatePaymentDateInCartFromQuote(cartId: number, paymentDate: Date): Promise<void> {
        return this.quoteCartService.updatePaymentDate(cartId, paymentDate);
    }

    updateWarehouseInCartFromQuote(cartId: number, warehouseId: number): Promise<void> {
        return this.quoteCartService.updateWarehouse(cartId, warehouseId).then((res) => {
            this.updateStockStateInCart(res);
        });
    }

    private updateStockStateInCart(stockStateModel: b2bCart.UpdateStockState) {
        this.exceededStates = stockStateModel.exceededStatesOnEntireCart;

        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = stockStateModel.itemsStockLevel.find(item => item.itemId === currentProduct.itemId);
            this.updateCartProductStockState(currentProduct, refreshedProduct);
            return currentProduct;
        });

        this._isValid = this.validate();
        this.setHeaderDataIfRequired();
    }

    private updateCartProductStockState(currentProduct: b2b.CartProduct, refreshedItemStockState: b2bCart.UpdateStockStateItem) {
        currentProduct.type = refreshedItemStockState.type;
        currentProduct.isUnitTotal = refreshedItemStockState.isUnitTotal ? 1 : 0;
        this.updateCartItemStockStateBase(currentProduct, refreshedItemStockState);
    }

    private updateCartItemStockStateBase(currentProduct: b2b.CartProduct, refreshedItemStockState: b2bCart.UpdateStockStateItem) {
        currentProduct.stockLevel = refreshedItemStockState.stockLevel.representsExistingValue ? refreshedItemStockState.stockLevel.value : null;
        currentProduct.stockLevelNumber = ConvertingUtils.stringToNum(currentProduct.stockLevel);

        if ((this.headerData.stockLevelMode === StockLevelMode.control)
            && this.selectedDocumentId === CartDocumentType.order && currentProduct.type !== ProductType.cost && currentProduct.type !== ProductType.service
            && currentProduct.type !== 6) {

            currentProduct.max = currentProduct.stockLevelNumber;
        }

        currentProduct.warn = (this.headerData.stockLevelMode === StockLevelMode.control || this.headerData.stockLevelMode === StockLevelMode.warningOnly)
            && this.selectedDocumentId === CartDocumentType.order && currentProduct.type !== 3 && currentProduct.type !== 4 && currentProduct.type !== 6;

        currentProduct.dontControl = this.headerData.stockLevelMode < StockLevelMode.control || this.selectedDocumentId === CartDocumentType.inquiry;
        currentProduct.disabled = (this.selectedDocumentId === CartDocumentType.order && this.headerData.stockLevelMode === StockLevelMode.control && currentProduct.stockLevelNumber === 0)
            || (this.isCartFromQuote && !this.configService.permissions.hasAccessToEditQuantityInQuotes)
            || (currentProduct.setDocumentsType < 2 && currentProduct.bundleId != null);
    }

    updateItemQuantityInCartFromQuote(cartId: number, itemId: number, quantity: number): Promise<void> {
        return this.quoteCartService.updateItemQuantity(cartId, itemId, quantity);
    }


}
