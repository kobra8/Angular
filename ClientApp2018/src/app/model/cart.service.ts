import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { CartDocumentType } from './enums/cart-document-type.enum';
import { AttributeType } from './enums/attribute-type.enum';
import { CartOptionType } from './enums/cart-option-type.enum';
import { WarehousesRepo } from './shared/warehouses-repo';
import { PaginationRepo } from './shared/pagination-repo';
import { FormattingUtils } from '../helpers/formatting-utils';
import { ProductsRepo } from './shared/products-repo';
import { PermissionHelper } from '../helpers/permission-helper';
import { StockLevelMode } from './enums/stock-level-mode.enum';
import { CreditLimitMode } from './enums/credit-limit-mode.enum';
import { ConfigService } from './config.service';
import { ResourcesService } from './resources.service';
import { DateHelper } from '../helpers/date-helper';

@Injectable()
export class CartService extends ProductsRepo {


    cartId: number;


    products: b2b.CartProduct[];
    config: b2b.CartConfig;

    /**
    * Map of (column key => translation key) pairs for products table. Column map is required for product table template.
    */
    columns: Map<string, string>;

    /**
    * Selected options and few settings.
    */
    headerData: b2b.CartHeader;

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

    selectedDocumentId: CartDocumentType;

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
    * Object for managing warehouses
    */
    warehousesRepo: WarehousesRepo;

    /**
     * Object for managing pagination
     */
    paginationRepo: PaginationRepo;

    exceededStates?: boolean;
    exceededCreditLimit?: boolean;


    warehousesLoaded: boolean;
    paymentsLoaded: boolean;
    deliveryLoaded: boolean;
    adressesLoaded: boolean;


    constructor(httpClient: HttpClient, private configService: ConfigService, private resourcesService: ResourcesService) {

        super(httpClient);

        this.exceededStates = false;

        this.selectedDocumentId = CartDocumentType.order;

        this.warehousesRepo = new WarehousesRepo(httpClient);
        this.paginationRepo = new PaginationRepo();



        //default configuration
        this.config = <b2b.CartConfig>{};


        this.columns = new Map<string, string>()
            .set('remove', '')
            .set('name', 'codeName')
            .set('subtotalPrice', 'netPrice')
            .set('totalPrice', 'grossPrice')
            .set('quantity', 'quantity')
            .set('discount', 'discount')
            .set('subtotalValue', 'netValue')
            .set('totalValue', 'grossValue')
            .set('currency', 'currency');


    }

    /**
     * Setter for config object.
     * Merges current config object with given config object.
     * Doesn't delete params missing in given object.
     */
    setConfig(config: b2b.CartConfig): void {

        this.config = Object.assign(this.config, config);


    }

    /**
     * Updates model with given option.
     * Method is universal for all of options except header attributes.
     */
    setOptions(options: b2b.CartOptions): void {

        if (options.completionEntirely !== null && options.completionEntirely !== undefined) {

            this.headerData.completionEntirely = options.completionEntirely.toString();
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
    setHeaderData(header: b2b.CartHeader): void {

        this.headerData = Object.assign(this.headerData || {}, header);

        if (this.configService.applicationId === 0) {
            this.headerData.completionEntirely = this.headerData.completionEntirely.toString();
        }

        this.headerData.warehouseId = this.headerData.warehouseId.toString();
        this.headerData.paymentFormId = Number(this.headerData.paymentFormId);

        if ((typeof this.headerData.dueDate).toLowerCase() !== 'date') {
            this.headerData.dueDate = new Date(this.headerData.dueDate);
        }

        if ((typeof this.headerData.receiptDate).toLowerCase() !== 'date') {
            this.headerData.receiptDate = new Date(this.headerData.receiptDate);
        }
    }

    /**
     * Setter for all cart data wchich can be received in responses.
     * It's used after loading cart and removing product.
     */
    setListData(listData: b2b.CartProductsResponse | b2b.CartProductRemoveResponse) {

        this.paginationRepo.pagination.isNextPage = listData.hasMore;

        this.setConfig(listData.items.set2[0]);

        if (this.config.pageSize !== null && this.config.pageSize !== undefined) {
            this.paginationRepo.pagination.pageSize = this.config.pageSize;
        }

        if ((<b2b.CartProductsResponse>listData).items.set3[0] && (<b2b.CartProductsResponse>listData).items.set3[0].headerId !== undefined) {
            this.setHeaderData((<b2b.CartProductsResponse>listData).items.set3[0]);
        }

        if ((<b2b.CartProductsResponse>listData).items.set6[0] && (<b2b.CartProductsResponse>listData).items.set6[0].weightGross !== undefined) {
            this.weight = (<b2b.CartProductsResponse>listData).items.set6[0];
        } else {
            this.weight = (<b2b.CartProductRemoveResponse>listData).items.set5[0];
        }


        this.products = listData.items.set1;

        this.products.forEach((item, i) => {
            this.calculateValues(i, this.headerData.vatDirection);
        });

    }

    /**
     * Updates model with data received from loading cart response.
     */
    setListDataAfterLoad(listData: b2b.CartProductsResponse) {

        this.setListData(listData);

        this.attributes = listData.items.set4;
        this.summaries = listData.items.set5;
        this.volume = listData.items.set7;

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

        return this.httpClient.get<b2b.CartProductsResponse>('api/carts/', { params: query }).toPromise();
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

        return this.requestProducts().then((productsRes) => {

            if (productsRes.items.set1.length === 0) {
                this.products = [];

                return 0;
            }


            this.setListDataAfterLoad(productsRes);


            this.deliveryMethods = [{
                name: this.headerData.deliveryMethod,
                translationName: this.headerData.translationDeliveryMethod
            }];



            this.paymentForms = [{
                id: Number(this.headerData.paymentFormId),
                name: this.headerData.paymentForm
            }];

            this.shippingAddresses = [{
                id: Number(this.headerData.addressId),
                name: this.headerData.address
            }];

            if (this.headerData.warehouseId !== '0') {
                this.loadWarehouses();
            }

            return this.products.length;

        });
    }


    calculateValues(index, vatDirection): void {

        this.products[index].unit = (this.products[index].defaultUnitNo > 0) ? this.products[index].auxiliaryUnit : this.products[index].basicUnit;
        this.products[index].converter = null;

        if (this.products[index].auxiliaryUnit) {
            this.products[index].converter = `${this.products[index].denominator} ${this.products[index].auxiliaryUnit} = ${this.products[index].numerator} ${this.products[index].basicUnit}`;
        }


        this.products[index].price = (vatDirection === 'N') ? this.products[index].subtotalPrice : this.products[index].totalPrice;

        let quantityPrecision;
        if (this.products[index].unitPrecision) {
            quantityPrecision = this.products[index].unitPrecision;
        } else {
            quantityPrecision = this.products[index].isUnitTotal ? 0 : 4;
        }


        this.products[index].cartId = this.cartId;

        if (!this.products[index].fromBinary) {
            this.products[index].fromBinary = '';
        }

        // ???
        //if (this.products[index].unitPrecision === 0) {

        //    this.products[index].quantity = Math.round(+this.products[index].quantity);
        //}

        //if (this.products[index].unitPrecision >= 0) {
            
        //    const prec = -this.products[index].unitPrecision;
        //    this.products[index].quantity = Number(this.products[index].quantity.toString().split('e'));
        //    this.products[index].quantity = Math.round(+(this.products[index].quantity[0] + 'e' + (this.products[index].quantity[1] ? (+this.products[index].quantity[1] - prec) : -prec)));
        //    this.products[index].quantity = Number(this.products[index].quantity.toString().split('e'));
        //    this.products[index].quantity = Number((+(this.products[index].quantity[0] + 'e' + (this.products[index].quantity[1] ? (+this.products[index].quantity[1] + prec) : prec))).toFixed(this.products[index].unitPrecision));
        //}

        const numDiscount = FormattingUtils.stringToNum(this.products[index].discount);

        this.products[index].discount = numDiscount > 0 ? this.products[index].discount + ' %' : '';

        if (typeof this.products[index].quantity === 'string') {
            this.products[index].quantity = FormattingUtils.stringToNum(<any>this.products[index].quantity);
        }


        this.calculateState(index);


    }


    /**
     * Calculates max value
     */
    calculateState(index: number): void {

        if ((this.headerData.stockLevelMode === StockLevelMode.control || this.headerData.stockLevelMode === StockLevelMode.warningOnly)
            && this.selectedDocumentId === CartDocumentType.order && this.products[index].type !== 3 && this.products[index].type !== 4
            && this.products[index].type !== 6) {

            this.products[index].max = FormattingUtils.stringToNum(this.products[index].stockLevel);

        } else {
            //else types probably service?
            this.products[index].max = -1;
        }

        this.products[index].dontControl = this.headerData.stockLevelMode < StockLevelMode.control || this.selectedDocumentId === CartDocumentType.inquiry;
        this.products[index].disabled = (this.selectedDocumentId === CartDocumentType.order && this.headerData.stockLevelMode === StockLevelMode.control && this.products[index].max === 0)
            || this.products[index].fromQuote > 0 || (this.products[index].setDocumentsType < 2 && this.products[index].bundleId != null);
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

        return this.httpClient.put<b2b.CartQuantityResponse>('api/carts/updateItemQuantity', query).toPromise();
    }

    /**
     * Changes quantity: makes request to save quantity, updates model.
     */
    changeItemQuantity(index: number, quantity: number = this.products[index].quantity, cartId: number = this.cartId): Promise<{ index: number, quantity: number }> {


        return this.saveQuantityRequest(index, quantity, cartId).then((res: b2b.CartQuantityResponse) => {

            const product = res.set1[0];

            this.products[index].quantity = quantity;
            this.products[index].vatDirection = product.vatDirection === 0 ? 'N' : 'B'; //to check
            this.products[index].price = product.vatDirection === 0 ? product.subtotalPrice : product.totalPrice;
            this.products[index].subtotalPrice = product.subtotalPrice;
            this.products[index].totalPrice = product.totalPrice;
            this.products[index].discount = FormattingUtils.stringToNum(product.discount) > 0 ? product.discount + ' %' : '';
            this.products[index].subtotalValue = product.subtotalValue;
            this.products[index].totalValue = product.totalValue;



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

            if (res.set3.length > 0) {
                this.summaries = res.set3;
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

        return this.httpClient.get<b2b.Option2[]>(`api/carts/paymentForms/${cartId}`).toPromise();
    }

    /**
     * Makes request for shipping addresses.
     */
    private requestShippingAddresses(cartId: number = this.cartId): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>(`api/carts/shippingAddresses/${cartId}`).toPromise();
    }

    /**
     * Makes request for delivery methods.
     */
    private requestDeliveryMethods(cartId: number = this.cartId): Promise<b2b.DeliveryMethod[]> {

        return this.httpClient.get<b2b.DeliveryMethod[]>(`api/carts/deliveryMethods/${cartId}`).toPromise();
    }

    /**
     * Makes request for delivery methods and updates model.
     * Returns promise with delivery methods array.
     */
    loadDeliveryMethods(cartId: number = this.cartId): Promise<b2b.DeliveryMethod[]> {

        if (!this.deliveryLoaded) {

            return this.requestDeliveryMethods(cartId).then((res: b2b.DeliveryMethod[]) => {

                this.deliveryMethods = res.map((item: b2b.DeliveryMethod, index) => {


                    return {
                        id: index,
                        name: item.name,
                        translationName: item.translationName
                    };
                });

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
                this.paymentForms = res;
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
                this.shippingAddresses = res;
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

        return this.httpClient.put<void>('api/Carts/attributeChanged', attr).toPromise();
    }


    /**
     * Makes request for header attributes and updates model.
     */
    updateHeaderAttribute(index: number): Promise<void> {

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

    ////????
    //private requestItemDetails(itemId: number, cartId: number = this.cartId): Promise<any/*b2b.CartItemDetails*/> {

    //  return this.httpClient.get(`api/carts/cartItemDetails?cartId=${cartId}&itemId=${itemId}`).toPromise();
    //}

    ////????
    //loadItemDetails(itemId: number, cartId: number = this.cartId): Promise<void> {

    //  return this.requestItemDetails(itemId, cartId).then((res) => {
    //    //????
    //  });
    //}

    /**
     * Makes request for updating all selected options besides header attributes.
     */
    private updateHeaderRequest(header: b2b.UpdateHeaderRequest): Promise<b2b.CartHeaderUpdateResponse> {

        return this.httpClient.put<b2b.CartHeaderUpdateResponse>('api/carts/updateCartHeader', header).toPromise();
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

        if (this.configService.applicationId === 0) {
            header.completionEntirely = headerRequest.completionEntirely;
        }

        if (this.deliveryMethods !== undefined) {

            const deliveryMethod = this.deliveryMethods.find(item => item.name === headerRequest.deliveryMethod);
            header.deliveryMethod = deliveryMethod.name;
            header.translationDeliveryMethod = deliveryMethod.translationName;
        }

        if (this.paymentForms !== undefined) {
            header.paymentForm = this.paymentForms.find(item => item.id === Number(headerRequest.paymentFormId)).name;
        }

        if (this.warehousesRepo.warehouses !== undefined) {

            const warehouse = this.warehousesRepo.warehouses.find(item => item.id === headerRequest.warehouseId);

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

        if (receiptDate instanceof Date) {
            receiptDate = header.receiptDate.toISOString();
        } else {
            receiptDate = header.receiptDate;
        }

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
            warehouseId: (this.configService.permissions.warehouseChange) ? header.warehouseId || '0' : null
        };

        return this.updateHeaderRequest(headerRequest).then((res: b2b.CartHeaderUpdateResponse) => {


            //redundance - all cart products are returned, from all pages

            this.setHeaderData(this.headerRequestToHeader(headerRequest));

            if (res[1] && res[1].set3) {
                this.setHeaderData(res[1].set3[0]);
            }

            if (res[0] && res[0].set1) {

                if (res[0].set1[0].currency) {
                    this.summaries = res[0].set1;
                }

                if (res[0].set1[0].stockLevel) {

                    const paginationParams = this.paginationRepo.getRequestParams();

                    this.products.forEach((item, i) => {
                        this.products[i].stockLevel = res[0].set1[i + Number(paginationParams.skip) - 1].stockLevel;
                        this.calculateState(i);
                    });

                    this.getItemsWithExceededStates();

                }

            }

            if (res[0] && res[0].set3) {
                this.volume = res[0].set3;
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

        return this.httpClient.delete<b2b.CartProductRemoveResponse>('api/carts/removeCartItem', { params: params }).toPromise();
    }

    /**
     * Makes request for removing product from cart. Updates model with new product's list.
     * Returns promise with products amonut.
     */
    removeItem(itemId: number, cartId = this.cartId): Promise<number> {

        return this.removeItemRequest(itemId).then((res: b2b.CartProductRemoveResponse) => {

            this.setListDataAfterRemove(res);

            this.getItemsWithExceededStates(cartId);

            return this.products.length;
        });
    }


    /**
     * Makes request for check units.
     */
    private checkUnitsRequest(cartId: number = this.cartId): Promise<b2b.CheckUnitsResponse> {

        return this.httpClient.get<b2b.CheckUnitsResponse>(`api/carts/checkUnits?cartId=${cartId}&documentTypeId=${13}`).toPromise();
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
    private addOrderRequest(cartId: number = this.cartId): Promise<b2b.AddOrderResponse> {

        return this.httpClient.post<b2b.AddOrderResponse>('api/orders/addOrder', Number(cartId)).toPromise();
    }

    /**
     * Makes request for adding new inquiry
     */
    private addInquireRequest(cartId: number = this.cartId): Promise<b2b.AddOrderResponse> {

        return this.httpClient.post<b2b.AddOrderResponse>('api/Inquiries/addInquiry', Number(cartId)).toPromise();
    }


    /**
     * Makes request for adding new document (order or inquiry). Returns promise with document ids or errors.
     */
    addDocument(cartId: number = this.cartId, documentType: CartDocumentType = this.selectedDocumentId): Promise<b2b.AddDocumentSuccess | b2b.AddDocumentFailture> {

        let promise: Promise<b2b.AddOrderResponse> = null;

        if (this.configService.applicationId === 1 && (this.headerData.stockLevelMode !== StockLevelMode.noControl || this.headerData.creditLimitMode !== CreditLimitMode.noControl)) {

            promise = this.checkUnits().then((res) => {

                if (res === null || res.length === 0) {

                    return (documentType === 0) ? this.addOrderRequest(cartId) : this.addInquireRequest(cartId);

                }

                return <b2b.AddOrderResponse>{
                    error: this.exceededCreditLimit ? this.resourcesService.translations.creditLimitLock : this.resourcesService.translations.stockLockMessage
                };


            });

        } else {

            promise = (documentType === 0) ? this.addOrderRequest(cartId) : this.addInquireRequest(cartId);
        }

        return promise.then((res: b2b.AddOrderResponse) => {

            if (res.error || res.message) {
                return {
                    result: -1,
                    error: res.error.message || res.error || res.message
                } as b2b.AddDocumentFailture;
            } else {

                return {
                    result: 0,
                    ids: res.set1 ? { id: res.set1[0].id, number: res.set1[0].number } : { id: res[1], number: res[0] }
                } as b2b.AddDocumentSuccess;
            }
        });
    }


    selectDocument(documentId: CartDocumentType) {

        this.selectedDocumentId = documentId;

        this.products.forEach((item, i) => {
            this.calculateState(i);
        });
    }

    private requestItemsWithExceededStates(cartId = this.cartId): Promise<b2b.ExceetedStockLimitResponse> {

        return this.httpClient.get<b2b.ExceetedStockLimitResponse>('/api/carts/exceededStates/' + cartId).toPromise();
    }


    getItemsWithExceededStates(cartId = this.cartId): Promise<b2b.ExceetedStockLimitResponse> {

        return this.requestItemsWithExceededStates().then(res => {
            this.exceededCreditLimit = res && res.set2[0].exceededCreditLimit;
            this.exceededStates = res && res.set1.length > 0;

            return res;
        });
    }

    loadWarehouses() {

        if (!this.warehousesLoaded) {

            this.warehousesRepo.loadWarehouses().then(() => {
                this.warehousesLoaded = true;
            });
        }
    }

}
