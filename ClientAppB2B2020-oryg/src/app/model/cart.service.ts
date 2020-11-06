import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2bCartCheck } from 'src/integration/b2b-cart-check';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { CartDocumentType } from './enums/cart-document-type.enum';
import { ConfigService } from './config.service';
import { WarehousesService } from './warehouses.service';
import { CacheService } from './cache.service';
import { CartHeaderService } from './cart/cart-header.service';
import { CartDetailRealizationType } from './cart/enums/cart-detail-realization-type.enum';
import { ApplicationType } from './enums/application-type.enum';
import { CommonAvailableCartsService } from './shared/common-available-carts.service';
import { CartRequestsService } from './cart/cart-requests.service';
import { CustomerService } from './customer.service';
import { CreditLimitBehaviourEnum } from './shared/enums/credit-limit-behaviour.enum';
import { CartCheckService } from './cart/cart-check.service';
import { CartCheckResponseEnum } from './cart/enums/cart-check-response.enum';
import { StockLevelBehavoiurEnum } from './cart/enums/stock-level-behavoiur.enum';
import { CartCommonService } from './cart/cart-common.service';
import { CartQuoteService } from './cart/cart-quote.service';
import { Subject } from 'rxjs';
import { Config } from '../helpers/config';
import { b2bShared } from 'src/integration/b2b-shared';

@Injectable()
export class CartService {

    get cartId(): number { return this.cartCommonService.cartId; }
    get cartName(): string { return this.cartCommonService.cartName; }
    get isValid() { return this.cartCommonService.isValid; }

    get isCartFromQuote(): boolean { return this.cartCommonService.isCartFromQuote; }
    set isCartFromQuote(isCartFromQuote) { this.cartCommonService.isCartFromQuote = isCartFromQuote; }

    get productsConfig(): b2bShared.ProductTableConfig { return this.cartCommonService.productsConfig; }
    get columns(): b2b.ColumnConfig[] { return this.cartCommonService.columns; }
    get pagination() { return this.cartCommonService.pagination; }


    get products(): b2b.CartProduct[] { return this.cartCommonService.products; }
    set products(products) { this.cartCommonService.products = products; }

    get outdatedProductsSummary(): b2bCartCheck.CheckCartSummaryDetailsBase { return this.cartCommonService.outdatedProductsSummary; }
    get outdatedProductsDetails(): b2bCartCheck.CheckCartSummaryObjectBase[] { return this.cartCommonService.outdatedProductsDetails; }
    get outdatedDetailsChanged(): Subject<b2bCartCheck.OutdatedDetails> { return this.cartCommonService.outdatedDetailsChanged; }


    get cartProductsSummaries(): b2b.CartSummary[] { return this.cartCommonService.cartProductsSummaries; }
    get summaries(): b2b.CartSummary[] { return this.cartCommonService.summaries; }
    get delivery(): b2b.CartSummary { return this.cartCommonService.delivery; }
    set delivery(delivery) { this.cartCommonService.delivery = delivery; }
    get weight(): b2b.CartWeight { return this.cartCommonService.weight; }


    get headerData(): b2b.CartHeader { return this.cartCommonService.headerData; }
    set headerData(header: b2b.CartHeader) { this.cartCommonService.headerData = header; }
    get attributes(): b2b.CartHeaderAttribute[] { return this.cartCommonService.attributes; }
    get wasOrderAttributesChecked() { return this.cartCommonService.wasOrderAttributesChecked; }
    get wasInquiryAttributesChecked() { return this.cartCommonService.wasInquiryAttributesChecked; }

    get headerPermissions(): b2bCartHeader.CartHeaderPermisions { return this.cartCommonService.headerPermissions; }
    get headerValidationSummary(): b2bCartHeader.CartHeaderSimpleValidationXlObject { return this.cartCommonService.headerValidationSummary; }
    get isCartHeaderCorrect(): boolean { return this.cartCommonService.isCartHeaderCorrect; }
    get areCartAttributesValid() { return this.cartCommonService.areCartAttributesValid; }

    get deliveryMethods(): b2bCartHeader.DeliveryMethodOption[] { return this.cartHeaderService.deliveryMethods; }
    get paymentForms(): b2bCartHeader.PaymentFormOption[] { return this.cartHeaderService.paymentForms; }
    get shippingAddresses(): b2bCartHeader.ShippingAddressOption[] { return this.cartHeaderService.shippingAddresses; }
    get shippingAddressesXl(): b2bCartHeader.ShippingAddressXl[] { return this.cartHeaderService.shippingAddressesXl; }
    get warehouses(): b2bCartHeader.WarehouseOption[] { return this.cartHeaderService.warehouses; }
    get paymentsLoaded(): boolean { return this.cartHeaderService.paymentsLoaded; }
    get deliveryLoaded(): boolean { return this.cartHeaderService.deliveryLoaded; }
    get adressesLoaded(): boolean { return this.cartHeaderService.adressesLoaded; }
    get warehousesLoaded(): boolean { return this.cartHeaderService.warehousesLoaded; }
    get headerSavingSummary(): b2bCartHeader.CartHeaderSavingSummary { return this.cartCommonService.headerSavingSummary; }


    get selectedDocumentId(): CartDocumentType { return this.cartCommonService.selectedDocumentId; }
    set selectedDocumentId(selectedDocumentId) { this.cartCommonService.selectedDocumentId = selectedDocumentId; }

    get forbiddenOrder(): boolean { return this.cartCommonService.forbiddenOrder; }
    set forbiddenOrder(isForbidden) { this.cartCommonService.forbiddenOrder = isForbidden; }

    get orderNumber(): string { return this.cartCommonService.orderNumber; }
    set orderNumber(orderNumber) { this.cartCommonService.orderNumber = orderNumber; }

    get creditLimitBehaviour(): CreditLimitBehaviourEnum { return this.cartCommonService.creditLimitBehaviour; }
    set creditLimitBehaviour(creditLimitBehaviour) { this.cartCommonService.creditLimitBehaviour = creditLimitBehaviour; }
    get stockLevelBehaviour(): StockLevelBehavoiurEnum { return this.cartCommonService.stockLevelBehaviour; }
    set stockLevelBehaviour(stockLevelBehaviour) { this.cartCommonService.stockLevelBehaviour = stockLevelBehaviour; }

    constructor(
        private configService: ConfigService,
        public warehousesService: WarehousesService,
        private cacheService: CacheService,
        private cartHeaderService: CartHeaderService,
        private cartQuoteService: CartQuoteService,
        private commonAvailableCartsService: CommonAvailableCartsService,
        private cartRequestsService: CartRequestsService,
        private customerService: CustomerService,
        private cartCheckService: CartCheckService,
        private cartCommonService: CartCommonService) {
    }

    getCartDetails(): Promise<void> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.getCartDetailsXl();

            case ApplicationType.ForAltum:
                return this.getCartDetailsAltum();

            default:
                console.error(`getCartDetails(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    getCartDetailsXl(): Promise<void> {
        const request = this.prepareGetCartDetailsBaseRequest();
        return this.cartRequestsService.getCartDetailsXlRequest(request).then(res => this.inCaseSuccessGetCartDetailsXl(res));
    }

    getCartDetailsAltum(): Promise<void> {
        const request = this.prepareGetCartDetailsBaseRequest();
        return this.cartRequestsService.getCartDetailsAltumRequest(request).then(res => this.inCaseSuccessGetCartDetailsAltum(res));
    }

    private inCaseSuccessGetCartDetailsXl(response: b2bCart.IGetCartDetailsXlResponse) {
        const success = this.initGetCartDetailsBase(response);
        if (!success) {
            return;
        }

        this.cartHeaderService.initCartHeaderXl(response.cart.header, response.cart.cartAttributes);
        this.refreshOrderButtonValidity();
    }

    private inCaseSuccessGetCartDetailsAltum(response: b2bCart.IGetCartDetailsAltumResponse) {
        const success = this.initGetCartDetailsBase(response);
        if (!success) {
            return;
        }

        this.cartHeaderService.initCartHeaderAltum(response.cart.header, response.cart.cartAttributes);
        this.refreshOrderButtonValidity();
    }

    private initGetCartDetailsBase(response: b2bCart.IGetCartDetailsBaseResponse) {
        this.forbiddenOrder = false;
        if (response.cart.items.length === 0) {
            this.products = [];
            return false;
        }

        this.isCartFromQuote = this.checkIfIsCartFromQuote(response.cart.header.fromQuote);
        this.updateCartName(response.cart.header.cartName);
        this.cartCommonService.initCartValidation();

        this.pagination.changeParams(response.pagingResponse);
        this.stockLevelBehaviour = response.exceededStatesBehaviour;
        this.creditLimitBehaviour = response.creditLimitBehaviour;

        this.cartCommonService.initCartProductsWithPriceAndStockStateBase(response.cart.items);
        this.delivery = null;
        this.cartCommonService.updateCartSummaryBase(response.cart.summary);

        this.cartCommonService.setCorrectProductsStatusIfPossible();
        if (this.configService.config.generateConfirmedOrders) {
            this.customerService.refreshCreditInfo();
        }
        return true;
    }

    private prepareGetCartDetailsBaseRequest(): b2bCart.GetCartDetailsXlRequest {
        return {
            cartId: this.cartId,
            cartDocumentType: this.selectedDocumentId,
            pageNumber: this.pagination.currentPage
        };
    }

    private checkIfIsCartFromQuote(fromQuoteValue?: number): boolean {
        return fromQuoteValue ? true : false;
    }

    updateItemQuantity(itemId: number, quantity: number): Promise<void> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateItemQuantityXl(itemId, quantity);

            case ApplicationType.ForAltum:
                return this.updateItemQuantityAltum(itemId, quantity);

            default:
                console.error(`updateItemQuantity(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private updateItemQuantityXl(itemId: number, quantity: number): Promise<void> {
        const request: b2bCart.UpdateItemQuantityXlRequest = { cartId: this.cartId, itemId, quantity };

        return this.cartRequestsService.updateItemQuantityXlRequest(request).then(res => {
            this.updateCartProductsAfterUpdateItemQuantity(res);
        });
    }

    private updateItemQuantityAltum(itemId: number, quantity: number): Promise<void> {
        const request: b2bCart.UpdateItemQuantityAltumRequest = { cartId: this.cartId, itemId, quantity };

        return this.cartRequestsService.updateItemQuantityAltumRequest(request).then(res => {
            this.updateCartProductsAfterUpdateItemQuantity(res);
        });
    }

    private updateCartProductsAfterUpdateItemQuantity(response: b2bCart.UpdateItemQuantityBaseResponse) {
        this.cartCommonService.updateCartProductsAfterUpdateItemQuantity(response);
        this.cartCheckService.refreshOutdatedProductsWithPriceAndStockLevelBase([response.cartItem], false);
        this.refreshOrderButtonValidity();
    }


    removeCartItem(itemId: number): Promise<boolean> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.removeCartItemXl(itemId);

            case ApplicationType.ForAltum:
                return this.removeCartItemAltum(itemId);

            default:
                console.error(`removeCartItem(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private removeCartItemXl(itemId: number): Promise<boolean> {
        const request = this.prepareRemoveCartItemBaseRequest(itemId);

        return this.cartRequestsService.removeCartItemXlRequest(request).then(res => {
            return this.inCaseSuccessRemoveCartItemBase(itemId, res);
        });
    }

    private removeCartItemAltum(itemId: number): Promise<boolean> {
        const request = this.prepareRemoveCartItemBaseRequest(itemId);

        return this.cartRequestsService.removeCartItemAltumRequest(request).then(res => {
            return this.inCaseSuccessRemoveCartItemBase(itemId, res);
        });
    }

    private inCaseSuccessRemoveCartItemBase(itemId: number, baseResponse: b2bCart.RemoveCartItemBaseResponse): boolean {
        if (!baseResponse.cartStillExists) {
            return false;
        }

        this.refreshCreditLimitIfRequired();

        const productId = this.products.find(product => product.itemId === itemId).id;
        this.cartCheckService.refreshOutdatedProductsAfterRemoveCartItem(itemId, productId, baseResponse.hasExceededStatesOnDeletedArticle);

        this.pagination.changePageIfDifferent(baseResponse.pageNumberToGet);
        return true;
    }

    private prepareRemoveCartItemBaseRequest(itemId: number): b2bCart.RemoveCartItemBaseRequest {
        return {
            itemId: itemId,
            cartId: this.cartId,
            pageNumber: this.pagination.currentPage
        };
    }

    removeAllUnavailableCartItems(itemIds: number[]): Promise<boolean> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.removeAllUnavailableCartItemsXl(itemIds);

            case ApplicationType.ForAltum:
                return this.removeAllUnavailableCartItemsAltum(itemIds);

            default:
                console.error(`removeAllUnavailableCartItems(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private removeAllUnavailableCartItemsXl(itemIds: number[]): Promise<boolean> {
        const request = this.prepareRemoveAllUnavailableCartItemsBaseRequest(itemIds);

        return this.cartRequestsService.removeCartItemsXlRequest(request).then(res => {
            return this.inCaseSuccessRemoveAllUnavailableCartItemsBase(itemIds, res);
        });
    }

    private removeAllUnavailableCartItemsAltum(itemIds: number[]): Promise<boolean> {
        const request = this.prepareRemoveAllUnavailableCartItemsBaseRequest(itemIds);

        return this.cartRequestsService.removeCartItemsAltumRequest(request).then(res => {
            return this.inCaseSuccessRemoveAllUnavailableCartItemsBase(itemIds, res);
        });
    }

    private inCaseSuccessRemoveAllUnavailableCartItemsBase(itemIds: number[], baseResponse: b2bCart.RemoveCartItemsBaseResponse): boolean {
        if (!baseResponse.cartStillExists) {
            return false;
        }

        this.refreshCreditLimitIfRequired();
        this.cartCheckService.refreshOutdatedProductsAfterRemoveAllUnavailableCartItems(itemIds);

        this.pagination.changePage(Config.pageNumberToGetAfterRemoveAllUnavailableCartItems);
        return true;
    }

    private prepareRemoveAllUnavailableCartItemsBaseRequest(itemIds: number[]): b2bCart.RemoveCartItemsBaseRequest {
        return {
            cartId: this.cartId,
            checkExceededStatesAfterDeletion: false,
            itemIds
        };
    }

    updateItemDescription(itemId: number, newDescription: string): Promise<void> {
        const request: b2bCart.UpdateItemDescriptionBaseRequest = { cartId: this.cartId, itemId, newDescription };
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateItemDescriptionXl(request);

            case ApplicationType.ForAltum:
                return this.updateItemDescriptionAltum(request);

            default:
                console.error(`updateItemDescription(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private updateItemDescriptionXl(request: b2bCart.UpdateItemDescriptionBaseRequest): Promise<void> {
        return this.cartRequestsService.updateItemDescriptionXlRequest(request).then(() => {
            this.updateCartProductDescription(request);
        });
    }

    private updateItemDescriptionAltum(request: b2bCart.UpdateItemDescriptionBaseRequest): Promise<void> {
        return this.cartRequestsService.updateItemDescriptionAltumRequest(request).then(() => {
            this.updateCartProductDescription(request);
        });
    }

    private updateCartProductDescription(request: b2bCart.UpdateItemDescriptionBaseRequest) {
        const currentProduct = this.products.find(item => item.itemId === request.itemId);
        if (!currentProduct) {
            return;
        }
        this.cartCommonService.updateCartProductDescription(currentProduct, request.newDescription);
    }

    updateItemDescriptionInCartFromQuote(itemId: number, newDescription: string): Promise<void> {
        return this.cartQuoteService.updateItemDescription(itemId, newDescription);
    }

    loadDeliveryMethodsIfRequired(): void {
        this.cartHeaderService.loadDeliveryMethodsIfRequired(this.cartId);
    }

    loadPaymentFormsIfRequired(): void {
        this.cartHeaderService.loadPaymentFormsIfRequired(this.cartId);
    }

    loadShippingAddressesIfRequired(): void {
        this.cartHeaderService.loadShippingAddressesIfRequired(this.cartId);
    }

    addShippingAddresses(shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {
        return this.cartHeaderService.addShippingAddresses(shippingAddressModel, isAddressTemp).then(() => {
            if (this.isCartFromQuote) {
                return this.updateAddressInCartFromQuote(this.cartId, this.headerData.addressId);
            }

            return this.updateAddressXl(this.cartId, this.headerData.addressId);
        });
    }

    updateShippingAddresses(addressId: number, shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {
        return this.cartHeaderService.updateShippingAddresses(addressId, shippingAddressModel, isAddressTemp);
    }


    loadWarehousesIfRequired(): void {
        this.cartHeaderService.loadWarehousesIfRequired(this.cartId);
    }


    updateHeaderAttribute(index: number, value: any): Promise<void> {
        return this.cartHeaderService.updateHeaderAttribute(index, value);
    }

    addDocument(cartId: number = this.cartId, documentType: CartDocumentType = this.selectedDocumentId): Promise<b2b.AddDocumentSuccess> {

        this.cartHeaderService.initHeaderValidationSummary();
        this.cartCommonService.checkAttributesValidity();
        this.cartCommonService.refreshOrderButtonValidity();
        if (!this.isValid) {
            return Promise.reject({ error: undefined });
        }

        cartId = Number(cartId);
        const promise = (documentType === 0) ? this.cartRequestsService.addOrderRequest(cartId) : this.cartRequestsService.addInquireRequest(cartId);

        return promise.then((res: b2b.AddOrderResponse) => {

            if (res.error || res.message) {

                return Promise.reject({
                    error: res.message || res.error && !res.error.message || res.error.message
                });
            }

            const ids = res.set1 ? { id: res.set1[0].id, number: res.set1[0].number } : { id: res[1], number: res[0] };

            this.orderNumber = ids.number;

            this.commonAvailableCartsService.refreshAvailableCarts();
            if (documentType === 0 && this.configService.config.generateConfirmedOrders) {
                this.customerService.refreshCreditInfo();
            }

            const cacheName = documentType === 0 ? '/api/orders' : '/api/inquiries';
            return this.cacheService.clearCache(cacheName).then(() => {
                return {
                    result: 0,
                    ids: ids
                } as b2b.AddDocumentSuccess;
            });

        }).catch((err) => {

            if (err.status === 403) {

                if (!(err.error && err.error.length && err.error.length > 0)) {
                    this.forbiddenOrder = true;
                    this.refreshOrderButtonValidity();
                }
            }

            if (err.status === 409) {
                switch (this.configService.applicationId) {
                    case ApplicationType.ForXL:
                        const responseXl = this.cartCheckService.inCaseSuccessCheckCartXl(err.error);
                        this.inCaseCheckCartXl(responseXl);
                        break;

                    case ApplicationType.ForAltum:
                        const responseAltum = this.cartCheckService.inCaseSuccessCheckCartAltum(err.error);
                        this.inCaseCheckCartAltum(responseAltum);
                        break;

                    default:
                        console.error('addDocument(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
                        break;
                }

                this.refreshOrderButtonValidity();
            }
            return Promise.reject(err);
        });
    }

    selectDocument(documentId: CartDocumentType) {
        this.cartCommonService.selectDocument(documentId);
    }

    changePage(currentPage) {
        this.pagination.changePage(currentPage);
        return this.getCartDetails();
    }


    updateSourceNumberXl(cartId: number, newSourceNumber: string): Promise<void> {
        return this.cartHeaderService.updateSourceNumberXl(cartId, newSourceNumber);
    }

    updateSourceNumberAltum(cartId: number, newSourceNumber: string): Promise<void> {
        return this.cartHeaderService.updateSourceNumberAltum(cartId, newSourceNumber);
    }


    updateDescriptionXl(cartId: number, description: string): Promise<void> {
        return this.cartHeaderService.updateDescriptionXl(cartId, description);
    }

    updateDescriptionAltum(cartId: number, description: string): Promise<void> {
        return this.cartHeaderService.updateDescriptionAltum(cartId, description);
    }


    updateAddressXl(cartId: number, addressId: number): Promise<void> {
        return this.cartHeaderService.updateAddressXl(cartId, addressId);
    }

    updateAddressAltum(cartId: number, addressId: number): Promise<void> {
        return this.cartHeaderService.updateAddressAltum(cartId, addressId);
    }


    updateRealizationDateXl(cartId: number, realizationDate: Date): Promise<void> {
        return this.cartHeaderService.updateRealizationDateXl(cartId, realizationDate);
    }

    updateRealizationDateAltum(cartId: number, realizationDate: Date): Promise<void> {
        return this.cartHeaderService.updateRealizationDateAltum(cartId, realizationDate);
    }


    updateRealizationXl(cartId: number, realizationType: CartDetailRealizationType): Promise<void> {
        return this.cartHeaderService.updateRealizationXl(cartId, realizationType);
    }


    updateDeliveryMethodXl(cartId: number, deliveryMethod: string): Promise<void> {
        return this.cartHeaderService.updateDeliveryMethodXl(cartId, deliveryMethod, this.pagination.currentPage);
    }

    updateDeliveryMethodAltum(cartId: number, deliveryMethod: number): Promise<void> {
        return this.cartHeaderService.updateDeliveryMethodAltum(cartId, deliveryMethod);
    }


    updatePaymentFormXl(cartId: number, paymentFormId: number): Promise<void> {
        return this.cartHeaderService.updatePaymentFormXl(cartId, paymentFormId, this.pagination.currentPage);
    }

    updatePaymentFormAltum(cartId: number, paymentFormId: number): Promise<void> {
        return this.cartHeaderService.updatePaymentFormAltum(cartId, paymentFormId, this.pagination.currentPage);
    }

    updatePaymentDateXl(cartId: number, paymentDate: Date): Promise<void> {
        return this.cartHeaderService.updatePaymentDateXl(cartId, paymentDate, this.pagination.currentPage);
    }

    updatePaymentDateAltum(cartId: number, paymentDate: Date): Promise<void> {
        return this.cartHeaderService.updatePaymentDateAltum(cartId, paymentDate);
    }

    updateWarehouseXl(cartId: number, warehouseId: number): Promise<void> {
        return this.cartHeaderService.updateWarehouseXl(cartId, warehouseId, this.pagination.currentPage);
    }

    updateWarehouseAltum(cartId: number, warehouseId: number): Promise<void> {
        return this.cartHeaderService.updateWarehouseAltum(cartId, warehouseId, this.pagination.currentPage);
    }

    updateSourceNumberInCartFromQuote(cartId: number, sourceNumber: string): Promise<void> {
        return this.cartQuoteService.updateSourceNumber(cartId, sourceNumber);
    }

    updateDescriptionInCartFromQuote(cartId: number, description: string): Promise<void> {
        return this.cartQuoteService.updateDescription(cartId, description);
    }

    updateAddressInCartFromQuote(cartId: number, addressId: number): Promise<void> {
        return this.cartQuoteService.updateAddress(cartId, addressId);
    }

    updateRealizationDateInCartFromQuote(cartId: number, realizationDate: Date): Promise<void> {
        return this.cartQuoteService.updateRealizationDate(cartId, realizationDate);
    }

    updateRealizationXlInCartFromQuote(cartId: number, realizationType: number): Promise<void> {
        return this.cartQuoteService.updateRealizationXl(cartId, realizationType);
    }

    updateDeliveryMethodInCartFromQuote(cartId: number, deliveryMethod: string): Promise<void> {
        return this.cartQuoteService.updateDeliveryMethod(cartId, deliveryMethod);
    }

    updatePaymentFormXlInCartFromQuote(cartId: number, paymentFormId: number): Promise<void> {
        return this.cartQuoteService.updatePaymentFormXl(cartId, paymentFormId);
    }

    updatePaymentFormAltumInCartFromQuote(cartId: number, paymentFormId: number): Promise<void> {
        return this.cartQuoteService.updatePaymentFormAltum(cartId, paymentFormId);
    }

    updatePaymentDateInCartFromQuote(cartId: number, paymentDate: Date): Promise<void> {
        return this.cartQuoteService.updatePaymentDate(cartId, paymentDate);
    }

    updateWarehouseInCartFromQuote(cartId: number, warehouseId: number): Promise<void> {
        return this.cartQuoteService.updateWarehouse(cartId, warehouseId);
    }

    updateItemQuantityInCartFromQuote(itemId: number, quantity: number): Promise<void> {
        return this.cartQuoteService.updateItemQuantity(itemId, quantity);
    }

    checkCartXl(): Promise<void> {
        return this.cartCheckService.checkCartXl(this.cartId).then(res => {
            this.inCaseCheckCartXl(res);
            this.refreshOrderButtonValidity();
        });
    }

    checkCartAltum(): Promise<void> {
        return this.cartCheckService.checkCartAltum(this.cartId).then(res => {
            this.inCaseCheckCartAltum(res);
            this.refreshOrderButtonValidity();
        });
    }

    private inCaseCheckCartXl(response: b2bCartCheck.CheckCartXlResponse) {
        if (response.cartCheckResponse === CartCheckResponseEnum.IncorrectHeader) {
            this.cartHeaderService.setHeaderValidationSummaryXl(response.cartHeaderValidationResult);
        }
    }

    private inCaseCheckCartAltum(response: b2bCartCheck.CheckCartAltumResponse) {
        if (response.cartCheckResponse === CartCheckResponseEnum.IncorrectHeader) {
            this.cartHeaderService.setHeaderValidationSummaryAltum(response.cartHeaderValidationResult);
        }
    }


    repairCartHeaderXl(): Promise<void> {
        return this.cartHeaderService.repairCartHeaderXl(this.cartId);
    }

    repairCartHeaderAltum(): Promise<void> {
        return this.cartHeaderService.repairCartHeaderAltum(this.cartId);
    }


    recalculatePricesXl(): Promise<void> {
        return this.cartCheckService.recalculatePricesXl(this.cartId);
    }

    recalculatePricesAltum(): Promise<void> {
        return this.cartCheckService.recalculatePricesAltum(this.cartId);
    }


    repairQuantitiesXl(): Promise<void> {
        return this.cartCheckService.repairQuantitiesXl(this.cartId);
    }

    repairQuantitiesAltum(): Promise<void> {
        return this.cartCheckService.repairQuantitiesAltum(this.cartId);
    }

    private refreshOrderButtonValidity() {
        this.cartCommonService.refreshOrderButtonValidity();
    }

    clearCartDetails() {
        this.cartCheckService.clearOutdatedProductDetails();
    }

    initCartId(cartId: number) {
        this.cartCommonService.cartId = Number(cartId);
    }

    refreshCreditLimitIfRequired(): Promise<void> {
        return this.cartCommonService.refreshCreditLimitIfRequired();
    }

    updateCartName(cartName: string) {
        this.cartCommonService.updateCartName(cartName);
    }
}
