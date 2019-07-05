import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { CartDocumentType } from './enums/cart-document-type.enum';
import { CartOptionType } from './enums/cart-option-type.enum';
import { PaginationRepo } from './shared/pagination-repo';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ProductBase } from './shared/products-repo';
import { StockLevelMode } from './enums/stock-level-mode.enum';
import { CreditLimitMode } from './enums/credit-limit-mode.enum';
import { ConfigService } from './config.service';
import { ResourcesService } from './resources.service';
import { DateHelper } from '../helpers/date-helper';
import { ArrayUtils } from '../helpers/array-utils';
import { WarehousesService } from './warehouses.service';
import { CartsService } from './carts.service';

@Injectable()
export class CartService extends ProductBase {


    cartId: number;

    private _isValid: boolean;

    get isValid() {
        return this._isValid;
    }

    products: b2b.CartProduct[];

    config: b2b.CartConfig;

    /**
    * Map of (column key => translation key) pairs for products table. Column map is required for product table template.
    */
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
    paginationRepo: PaginationRepo;


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


    constructor(
        httpClient: HttpClient,
        private configService: ConfigService,
        private resourcesService: ResourcesService,
        warehousesService: WarehousesService,
        private cartsService: CartsService
    ) {

        super(httpClient, warehousesService);

        this.exceededStates = false;

        this.selectedDocumentId = CartDocumentType.order;

        this.paginationRepo = new PaginationRepo();



        //default configuration
        this.config = <b2b.CartConfig>{};

        this.columns = [
            { property: 'remove', translation: ' ', type: 'remove' },
            { property: 'name', translation: 'article', type: 'productName' },
            { property: 'subtotalPrice', translation: 'netPrice', type: 'priceWithConverter', priceConverter: 'subtotalBasicPrice' },
            { property: 'totalPrice', translation: 'grossPrice', type: 'priceWithConverter', priceConverter: 'totalBasicPrice' },
            { property: 'quantity', type: 'quantityWithStepper' },
            { property: 'discount', type: 'percent' },
            { property: 'subtotalValue', translation: 'netValue', type: 'price', summaryProperty: 'netAmount' },
            { property: 'totalValue', translation: 'grossValue', type: 'price', summaryProperty: 'grossAmount' },
            { property: 'currency' }
        ];


    }


    /**
     * Updates model with given option.
     * Method is universal for all of options except header attributes.
     */
    setOptions(options: b2b.CartOptions): void {

        if (options.completionEntirely !== null && options.completionEntirely !== undefined) {

            this.headerData.completionEntirely = options.completionEntirely;
        }

        if (options.deliveryMethod !== null && options.deliveryMethod !== undefined) {
            this.headerData.deliveryMethod = options.deliveryMethod.name;
            this.headerData.translationDeliveryMethod = options.deliveryMethod.translationName;
        }

        if (options.paymentForm !== null && options.paymentForm !== undefined) {
            this.headerData.paymentFormId = options.paymentForm.id;
            this.headerData.paymentForm = options.paymentForm.name;
        }

        if (options.shippingAddress !== null && options.shippingAddress !== undefined) {
            this.headerData.addressId = options.shippingAddress.id;
            this.headerData.address = options.shippingAddress.text;
        }

        if (options.warehouse !== null && options.warehouse !== undefined) {
            this.headerData.warehouseId = options.warehouse.id;
            this.headerData.warehouseName = options.warehouse.text;
        }

        if (options.description !== null && options.description !== undefined && this.selectedDocumentId === CartDocumentType.order) {
            this.headerData.description = options.description;
        }

        if (options.descriptionSI !== null && options.descriptionSI !== undefined && this.selectedDocumentId !== CartDocumentType.order) {
            this.headerData.description = options.descriptionSI;
        }

        if (options.sourceNumber !== null && options.sourceNumber !== undefined && this.selectedDocumentId === CartDocumentType.order) {
            this.headerData.sourceNumber = options.sourceNumber;
        }

        if (options.sourceNumberSI !== null && options.sourceNumberSI !== undefined && this.selectedDocumentId !== CartDocumentType.order) {
            this.headerData.sourceNumber = options.sourceNumberSI;
        }

        if (options.receiptDate !== null && options.receiptDate !== undefined) {

            if (!(options.receiptDate instanceof Date)) {
                options.receiptDate = new Date(options.receiptDate);
            }

            if (DateHelper.isValid(options.receiptDate, new Date())) {
                this.headerData.receiptDate = options.receiptDate;
            }
        }

        if (options.dueDate !== null && options.dueDate !== undefined) {

            if (!(options.dueDate instanceof Date)) {
                options.dueDate = new Date(options.dueDate);
            }

            if (DateHelper.isValid(options.dueDate, new Date())) {
                this.headerData.dueDate = options.dueDate;
            }
        }

    }

    /**
     * Setter for header data.
     * Merges current header data with given header object.
     * Doesn't delete params missing in given object.
     */
    setHeaderData(header: b2b.CartHeader = {}): void {


        if (header.dueDate && !(header.dueDate instanceof Date)) {
            header.dueDate = new Date(header.dueDate);
        }

        if (header.receiptDate && !(header.receiptDate instanceof Date)) {
            header.receiptDate = new Date(header.receiptDate);
        }

        if (header.receiptDate && DateHelper.difference(header.receiptDate, DateHelper.endOfDay(new Date())) < 0) {
            header.receiptDate = new Date();
        }


        if (header.completionEntirely && this.configService.applicationId === 0) {
            header.completionEntirely = header.completionEntirely;
        }


        if (header.warehouseId !== undefined) {
            header.warehouseId = header.warehouseId + '' || '0';
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
    setListData(listData: b2b.CartProductsResponse | b2b.CartProductRemoveResponse) {

        this.paginationRepo.pagination.isNextPage = listData.hasMore;

        Object.assign(this.config, listData.items.set2[0]);

        if ((<b2b.CartProductsResponse>listData).items.set3[0] && (<b2b.CartProductsResponse>listData).items.set3[0].headerId !== undefined) {
            this.setHeaderData((<b2b.CartProductsResponse>listData).items.set3[0]);
        }

        if ((<b2b.CartProductsResponse>listData).items.set6[0] && (<b2b.CartProductsResponse>listData).items.set6[0].weightGross !== undefined) {
            this.weight = (<b2b.CartProductsResponse>listData).items.set6[0];
        } else {
            this.weight = (<b2b.CartProductRemoveResponse>listData).items.set5[0];
        }


        this.products = listData.items.set1.map(item => {
            return this.calculateValues(item, this.headerData.vatDirection);
        });

    }

    /**
     * Updates model with data received from loading cart response.
     */
    setListDataAfterLoad(listData: b2b.CartProductsResponse) {

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

        this.attributes = listData.items.set4;
        this.summaries = listData.items.set5;

        if (this.configService.applicationId === 1) {
            this.headerData.warehouseChangeEnabled = listData.items.set7[0].changeWarehouseEnabled;
        }


    }

    /**
     * Updates model with data received from removing product response
     */
    setListDataAfterRemove(listData: b2b.CartProductRemoveResponse) {

        this.setListData(listData);

        this.summaries = listData.items.set3;

    }

    /**
     * Makes request for products, returns promise with server response
     */
    private requestProducts(): Promise<b2b.CartProductsResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        const query = {
            filter: '',
            id: this.cartId.toString(),
            selectedDocument: this.selectedDocumentId.toString(),
            skip: paginationParams.skip,
            top: paginationParams.top
        };

        return this.httpClient.get<b2b.CartProductsResponse>('/api/carts/', { params: query }).toPromise();
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

            this.exceededStates = productsRes.items.set1[0].exceededStates || productsRes.items.set1[0].exeededStates;


            if (DateHelper.difference(new Date(productsRes.items.set3[0].receiptDate), DateHelper.startOfDay(new Date())) < 0) {

                productsRes.items.set3[0].receiptDate = new Date();
                this.setListDataAfterLoad(productsRes);
                this.updateHeader(CartOptionType.receiptDate);

            } else {
                this.setListDataAfterLoad(productsRes);
            }




            this._isValid = this.validate();
            return this.products.length;

        });
    }


    calculateValues(item: b2b.CartProduct, vatDirection): b2b.CartProduct {

        if (item.name.length > 50) {
            item.name = item.name.substring(0, 50).trim() + '...';
        }

        item.quantity = ConvertingUtils.stringToNum(<any>item.quantity);

        item.unit = (item.defaultUnitNo > 0) ? item.auxiliaryUnit : item.basicUnit;
        item.converter = null;

        if (item.auxiliaryUnit) {

            item.converter = ConvertingUtils.unitConverterString(item.denominator, item.auxiliaryUnit, item.numerator, item.basicUnit, item.quantity);

            const subPrice = ConvertingUtils.stringToNum(item.subtotalPrice);
            const totPrice = ConvertingUtils.stringToNum(item.totalPrice);

            item.subtotalBasicPrice = ConvertingUtils.calculateBasicPrice(subPrice, item.denominator, item.numerator);
            item.totalBasicPrice = ConvertingUtils.calculateBasicPrice(totPrice, item.denominator, item.numerator);
        }


        item.price = (vatDirection === 'N') ? item.subtotalPrice : item.totalPrice;

        item.cartId = this.cartId;

        if (!item.fromBinary) {
            item.fromBinary = '';
        }


        if (typeof item.quantity === 'string') {
            item.quantity = ConvertingUtils.stringToNum(<any>item.quantity);
        }


        return this.calculateState(item);

    }


    /**
     * Calculates max value
     */
    calculateState(item: b2b.CartProduct): b2b.CartProduct {

        if ((this.headerData.stockLevelMode === StockLevelMode.control || this.headerData.stockLevelMode === StockLevelMode.warningOnly)
            && this.selectedDocumentId === CartDocumentType.order && item.type !== 3 && item.type !== 4
            && item.type !== 6) {

            item.max = ConvertingUtils.stringToNum(item.stockLevel);

        } else {
            //else types probably service?
            item.max = -1;
        }

        item.dontControl = this.headerData.stockLevelMode < StockLevelMode.control || this.selectedDocumentId === CartDocumentType.inquiry;
        item.disabled = (this.selectedDocumentId === CartDocumentType.order && this.headerData.stockLevelMode === StockLevelMode.control && item.max === 0)
            || item.fromQuote > 0 || (item.setDocumentsType < 2 && item.bundleId != null);

        return item;
    }


    /**
     * Makes request to save current quantity
     */
    private saveQuantityRequest(index: number, quantity?: number, cartId?: number): Promise<b2b.CartQuantityResponse> {

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

        return this.httpClient.put<b2b.CartQuantityResponse>('/api/carts/updateitemquantity', query).toPromise();
    }

    /**
     * Changes quantity: makes request to save quantity, updates model.
     */
    changeItemQuantity(index: number, quantity: number = this.products[index].quantity, cartId: number = this.cartId): Promise<{ index: number, quantity: number }> {


        return this.saveQuantityRequest(index, quantity, cartId).then((res: b2b.CartQuantityResponse) => {

            const product = res.set1[0];

            this.exceededStates = product.exceededStates;

            this.products[index].quantity = quantity;
            this.products[index].vatDirection = product.vatDirection === 0 ? 'N' : 'B'; //to check
            this.products[index].price = product.vatDirection === 0 ? product.subtotalPrice : product.totalPrice;
            this.products[index].subtotalPrice = product.subtotalPrice;
            this.products[index].totalPrice = product.totalPrice;
            this.products[index].discount = ConvertingUtils.stringToNum(product.discount) > 0 ? product.discount + ' %' : '';
            this.products[index].subtotalValue = product.subtotalValue;
            this.products[index].totalValue = product.totalValue;

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
    private updateHeaderAttributeRequest(attr: b2b.CartHeaderAttribute): Promise<void> {

        return this.httpClient.put<void>('/api/carts/attributechanged', attr).toPromise();
    }


    /**
     * Makes request for header attributes and updates model.
     */
    updateHeaderAttribute(index: number): Promise<void> {

        this._isValid = this.validate();

        const attributeReq: b2b.CartHeaderAttribute = {
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

    /**
     * Makes request for updating all selected options besides header attributes.
     */
    private updateHeaderRequest(headerRequest: b2b.UpdateHeaderRequest): Promise<b2b.CartHeaderUpdateResponse> {

        return this.httpClient.put<b2b.CartHeaderUpdateResponse>('/api/carts/updatecartheader', headerRequest).toPromise();
    }

    /**
     * Converts header request object to model and response structure.
     */
    headerRequestToHeader(headerRequest: b2b.UpdateHeaderRequest): b2b.CartHeader {

        const header: b2b.CartHeader = {
            addressId: Number(headerRequest.addressId),
            receiptDate: new Date(headerRequest.receiptDate),
            description: headerRequest.description || headerRequest.descriptionSI,
            sourceNumber: headerRequest.sourceNumber || headerRequest.sourceNumberSI,
            paymentFormId: Number(headerRequest.paymentFormId),
            dueDate: new Date(headerRequest.paymentDate),
            warehouseId: (headerRequest.warehouseId || '0').toString(),
        };

        if (this.configService.applicationId === 0 && this.configService.permissions.showCompletion) {
            header.completionEntirely = headerRequest.completionEntirely;
        }

        if (this.deliveryMethods !== undefined && this.configService.permissions.deliveryMethodChange) {

            const deliveryMethod = this.deliveryMethods.find(item => item.name === headerRequest.deliveryMethod);
            header.deliveryMethod = deliveryMethod.name;
            header.translationDeliveryMethod = deliveryMethod.translationName;
        }

        if (this.paymentForms !== undefined && this.configService.permissions.paymentFormChange) {
            header.paymentForm = this.paymentForms.find(item => item.id === Number(headerRequest.paymentFormId)).name;
        }

        if (this.warehousesService.warehouses !== undefined && this.configService.permissions.canChangeDefaultWarehouseCart) {

            const warehouse = this.warehousesService.warehouses.find(item => item.id === headerRequest.warehouseId);

            if (warehouse) {
                header.warehouseName = warehouse.text;
            }
        }

        if (this.shippingAddresses !== undefined) {
            header.address = this.shippingAddresses.find(item => item.id === Number(headerRequest.addressId)).name;
        }

        return header;

    }

    /**
     * Makes request for update all selected options besides header attributes. Updates model.
     * Returns promise with updated credit info.
     */
    updateHeader(optionType: CartOptionType, header: b2b.CartHeader = this.headerData, cartId: number = this.cartId): Promise<any> {

        let paymentDate = null;
        let receiptDate = null;

        if (header.dueDate instanceof Date) {
            paymentDate = header.dueDate.toISOString();
        } else {
            paymentDate = header.dueDate;
        }

        if (header.receiptDate instanceof Date) {
            receiptDate = header.receiptDate.toISOString();
        } else {
            receiptDate = header.receiptDate;
        }

        const paginationParams = this.paginationRepo.getRequestParams();

        const headerRequest: b2b.UpdateHeaderRequest = {
            cartId: cartId.toString(),
            changedField: optionType.toString(),
            addressId: header.addressId.toString(),
            completionEntirely: (this.configService.applicationId === 0 && this.configService.permissions.showCompletion) ? header.completionEntirely : null,
            receiptDate: (this.configService.permissions.receiptDateChange) ? receiptDate : null,
            description: (this.selectedDocumentId === CartDocumentType.order) ? header.description : null,
            descriptionSI: (this.selectedDocumentId !== CartDocumentType.order) ? header.description : null,
            deliveryMethod: (this.configService.permissions.deliveryMethodChange && this.configService.permissions.showDeliveryMethod) ? header.deliveryMethod : null,
            sourceNumber: (this.selectedDocumentId === CartDocumentType.order) ? header.sourceNumber : null,
            sourceNumberSI: (this.selectedDocumentId !== CartDocumentType.order) ? header.sourceNumber : null,
            paymentFormId: (this.configService.permissions.paymentFormChange) ? header.paymentFormId.toString() : null,
            paymentDate: (this.configService.permissions.paymentDateChange) ? paymentDate : null,
            warehouseId: (this.configService.permissions.canChangeDefaultWarehouseCart) ? header.warehouseId || '0' : null,
            skip: paginationParams.skip,
            take: paginationParams.top
        };

        return this.updateHeaderRequest(headerRequest).then((res: b2b.CartHeaderUpdateResponse) => {


            this.setHeaderData(this.headerRequestToHeader(headerRequest));

            if (res[1] && res[1].set3) {
                this.setHeaderData(res[1].set3[0]);
            }

            //possible places and names of exceeded states
            if (res[0] && res[0].set3 && res[0].set3[0] && res[0].set3[0].exceededStates !== undefined) {
                this.exceededStates = res[0].set3[0].exceededStates;
            }

            if (res[0] && res[0].set2 && res[0].set2[0] && res[0].set2[0].exceededStates !== undefined) {
                this.exceededStates = res[0].set2[0].exceededStates;
            }

            if (res[0] && res[0].set2 && res[0].set2[0] && res[0].set2[0].exeededStates !== undefined) {
                this.exceededStates = res[0].set2[0].exeededStates;
            }

            if (res[1] && res[1].set3 && res[1].set3[1] && res[1].set3[0].exceededStates !== undefined) {
                this.exceededStates = res[1].set3[0].exceededStates;
            }


            if (res[1] && res[1].set2 && res[1].set2[0] && res[1].set2[0].exeededStates !== undefined) {
                this.exceededStates = res[1].set2[0].exeededStates;
            }
            //------


            if (res[0] && res[0].set1 && res[0].set1[0] && res[0].set1[0].currency) {
                this.summaries = res[0].set1;
            }


            //possible places of product list
            //redundance - all cart products are returned, from all pages
            const paginationParams = this.paginationRepo.getRequestParams();

            if (res[0] && res[0].set1 && res[0].set1[0] && res[0].set1[0].itemId) {

                //this.products.forEach((item, i) => {
                //    item = Object.assign(item, res[0].set1[i + Number(paginationParams.skip) - 1]);
                //    this.calculateState(item);
                //});

                this.products = this.products.map((item, i) => {
                    const newItem = Object.assign({}, item, res[0].set1[i]);
                    return this.calculateState(newItem);
                });

                //this.products = this.products.slice();
            }

            if (res[1] && res[1].set1 && res[1].set1[0] && res[1].set1[0].itemId) {
                //this.products.forEach((item, i) => {
                //    item = Object.assign(item, res[1].set1[i + Number(paginationParams.skip) - 1]);
                //    this.calculateState(item);
                //});

                this.products = this.products.map((item, i) => {
                    const newItem = Object.assign({}, item, res[1].set1[i]);
                    return this.calculateState(newItem);
                });

                //this.products = this.products.slice();
            }




            //------


            if (res[0] && res[0].set3) {
                this.volume = res[0].set3;
            }

            if (optionType === CartOptionType.warehouse) {
                this._isValid = this.validate();
            }

            if (res[0] && res[0].set2) {
                return res[0].set2[0];
            } else {
                return null;
            }

        });

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
    private removeItemRequest(itemId: number, cartId = this.cartId): Promise<b2b.CartProductRemoveResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        const params: any = {
            cartId: cartId,
            itemId: itemId,
            skip: paginationParams.skip,
            top: paginationParams.top,
            filter: '' //search text
        };

        return this.httpClient.delete<b2b.CartProductRemoveResponse>('/api/carts/removecartitem', { params: params }).toPromise();
    }

    /**
     * Makes request for removing product from cart. Updates model with new product's list.
     * Returns promise with products amonut.
     * @param no product.no property, not index.
     */
    removeItem(itemId: number, no: number, cartId = this.cartId): Promise<number> {

        return this.removeItemRequest(itemId, cartId).then((res: b2b.CartProductRemoveResponse) => {

            if (res.items.set1.length === 0) {
                return 0;
            }

            this.setListDataAfterRemove(res);

            this.getItemsWithExceededStates(); // used also for validate credit limit

            this.exceededStates = res.items.set1[0].exceededStates;

            if (this.forbiddenProducts) {
                const skip = Number(this.paginationRepo.getRequestParams().skip);
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
    checkUnits(cartId: number = this.cartId): Promise<number[]> {

        return this.checkUnitsRequest(cartId).then((res) => {

            if (res.set1.length > 0) {

                const incorrectElements = [];

                res.set1.forEach((item) => {
                    incorrectElements.push(item.code);
                });

                return incorrectElements;
            } else {

                return [];
            }
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

        let promise = null;

        if (this.configService.applicationId === 1 && (this.headerData.stockLevelMode !== StockLevelMode.noControl || this.headerData.creditLimitMode !== CreditLimitMode.noControl)) {

            promise = this.checkUnits().then((res) => {

                if (res === null || res === undefined || res.length === 0) {

                    return (documentType === 0) ? this.addOrderRequest(cartId) : this.addInquireRequest(cartId);

                }

                return Promise.reject(new HttpErrorResponse({
                    error: this.exceededCreditLimit ? this.resourcesService.translations.creditLimitLock : this.resourcesService.translations.stockLockMessage
                }));


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

            if (documentType) {
                if (this.cartsService.updateInquiriesObserver) {
                    this.cartsService.updateInquiriesObserver.next(ids);
                }
            } else {
                if (this.cartsService.updateOrdersObserver) {
                    this.cartsService.updateOrdersObserver.next(ids);
                }
            }

            return {
                result: 0,
                ids: ids
            } as b2b.AddDocumentSuccess;


        }).catch((err: HttpErrorResponse) => {

            if (err.status === 403) {

                if (err.error && err.error.length && err.error.length > 0) {

                    this.forbiddenProducts = err.error;

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

            const paginationParams = this.paginationRepo.getRequestParams();
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

        this.paginationRepo.changePage(currentPage);
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

        return (<any>this.attributes).reduce((reduced: boolean & b2b.CartHeaderAttribute, current: b2b.CartHeaderAttribute, i) => {

            if (i === 1 && reduced.required && !reduced.value) {
                return false;
            }

            if (current.required) {
                return reduced && !!current.value;
            }

            return !!reduced;
        });

    }


    validateHeaderData(): boolean {

        const validCompletion = this.configService.applicationId === 1
            || !this.configService.permissions.showCompletion
            || (this.configService.applicationId === 0 && this.configService.permissions.showCompletion && Number.isInteger(this.headerData.completionEntirely));

        const validDeliveryMethod = !this.configService.permissions.showDeliveryMethod
            || (this.configService.permissions.showDeliveryMethod && this.headerData.deliveryMethod && this.headerData.translationDeliveryMethod);

        return validCompletion
            && validDeliveryMethod
            && !!this.headerData.address
            && Number.isInteger(this.headerData.addressId)
            && !!this.headerData.dueDate
            && !!this.headerData.paymentForm
            && Number.isInteger(this.headerData.paymentFormId)
            && !!this.headerData.receiptDate
            && this.headerData.warehouseId && this.headerData.warehouseId.length > 0
            && !!this.headerData.warehouseName;
    }

}
