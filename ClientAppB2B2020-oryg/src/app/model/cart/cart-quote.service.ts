import { Injectable } from '@angular/core';
import { b2bQuotes } from 'src/integration/b2b-quotes';
import { DateHelper } from 'src/app/helpers/date-helper';
import { CartRequestsService } from './cart-requests.service';
import { CartCommonService } from './cart-common.service';
import { CartHeaderService } from './cart-header.service';
import { CartCheckService } from './cart-check.service';
import { b2b } from 'src/b2b';
import { CartDetailType } from './enums/cart-detail-type.enum';
import { ApplicationType } from '../enums/application-type.enum';
import { ConfigService } from '../config.service';
import { b2bCart } from 'src/integration/b2b-cart';

@Injectable()
export class CartQuoteService {

    get pagination() { return this.cartCommonService.pagination; }
    get products(): b2b.CartProduct[] { return this.cartCommonService.products; }
    get cartId(): number { return this.cartCommonService.cartId; }

    constructor(
        private cartRequestsService: CartRequestsService,
        private cartCommonService: CartCommonService,
        private cartHeaderService: CartHeaderService,
        private cartCheckService: CartCheckService,
        private configService: ConfigService) { }

    updateSourceNumber(cartId: number, sourceNumber: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.sourceNumber);
        const request: b2bQuotes.UpdateSourceNumberInCartRequest = { cartId: cartId, sourceNumber: sourceNumber };
        return this.cartRequestsService.updateSourceNumberInCartFromQuoteRequest(request).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.sourceNumber);
        });
    }

    updateDescription(cartId: number, description: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.description);
        const request: b2bQuotes.UpdateDescriptionInCartRequest = { cartId: cartId, description: description };
        return this.cartRequestsService.updateDescriptionInCartFromQuoteRequest(request).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.description);
        });
    }

    updateAddress(cartId: number, addressId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.shippingAddress);
        const request: b2bQuotes.UpdateAddressInCartRequest = { cartId: cartId, shippingAddressId: addressId };
        return this.cartRequestsService.updateAddressInCartFromQuoteRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredBoth(CartDetailType.shippingAddress);
            this.setHeaderFieldStatusToSaved(CartDetailType.shippingAddress);
            this.refreshOrderButtonValidity();
        });
    }

    updateRealizationDate(cartId: number, realizationDate: Date): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.realizationDate);
        const request: b2bQuotes.UpdateRealizationDateInCartRequest = { cartId: cartId, receiptDate: DateHelper.dateToString(realizationDate) };
        return this.cartRequestsService.updateRealizationDateInCartFromQuoteRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredBoth(CartDetailType.realizationDate);
            this.setHeaderFieldStatusToSaved(CartDetailType.realizationDate);
            this.refreshOrderButtonValidity();
        });
    }

    updateRealizationXl(cartId: number, realizationType: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.realization);
        const request: b2bQuotes.UpdateRealizationInCartXlRequest = { cartId: cartId, completionEntirely: realizationType };
        return this.cartRequestsService.updateRealizationInCartFromQuoteXlRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.realization);
            this.setHeaderFieldStatusToSaved(CartDetailType.realization);
            this.refreshOrderButtonValidity();
        });
    }

    updateDeliveryMethod(cartId: number, deliveryMethod: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.deliveryMethod);
        const request: b2bQuotes.UpdateDeliveryMethodInCartRequest = { cartId: cartId, deliveryMethod: deliveryMethod };
        return this.cartRequestsService.updateDeliveryMethodInCartFromQuoteRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredBoth(CartDetailType.deliveryMethod);
            this.setHeaderFieldStatusToSaved(CartDetailType.deliveryMethod);
            this.refreshOrderButtonValidity();
        });
    }

    updatePaymentFormXl(cartId: number, paymentFormId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentForm);
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bQuotes.UpdatePaymentFormInCartRequest = { cartId: cartId, paymentFormId: paymentFormId };
        return this.cartRequestsService.updatePaymentFormInCartFromQuoteRequest(request).then((res) => {
            this.cartHeaderService.setPaymentDate(res.paymentDate);
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updatePaymentFormAltum(cartId: number, paymentFormId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentForm);
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bQuotes.UpdatePaymentFormInCartRequest = { cartId: cartId, paymentFormId: paymentFormId };
        return this.cartRequestsService.updatePaymentFormInCartFromQuoteRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updatePaymentDate(cartId: number, paymentDate: Date): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bQuotes.UpdatePaymentDateInCartRequest = { cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate) };
        return this.cartRequestsService.updatePaymentDateInCartFromQuoteRequest(request).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredBoth(CartDetailType.paymentDate);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updateWarehouse(cartId: number, warehouseId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.warehouse);
        const request: b2bQuotes.UpdateWarehouseInCartRequest = { cartId: cartId, warehouseId: warehouseId, pageNumber: this.pagination.currentPage };
        return this.cartRequestsService.updateWarehouseInCartFromQuoteRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredBoth(CartDetailType.warehouse);
            this.cartCommonService.updateCartProductsStockStateBase(res.items, res.stockLevelModeBehaviour);
            this.cartCheckService.refreshOutdatedProductsStockLevelBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.warehouse);
            this.refreshOrderButtonValidity();
        });
    }

    updateItemQuantity(itemId: number, quantity: number): Promise<void> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateItemQuantityXl(itemId, quantity);

            case ApplicationType.ForAltum:
                return this.updateItemQuantityAltum(itemId, quantity);

            default:
                console.error(`updateItemQuantityInCartFromQuote(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private updateItemQuantityXl(itemId: number, quantity: number): Promise<void> {
        const request: b2bQuotes.UpdateItemQuantityInCartXlRequest = { cartId: this.cartCommonService.cartId, itemId, quantity };

        return this.cartRequestsService.updateItemQuantityInCartFromQuoteXlRequest(request).then(res => {
            this.updateCartProductsAfterUpdateItemQuantity(res);
        });
    }

    private updateItemQuantityAltum(itemId: number, quantity: number): Promise<void> {
        const request: b2bQuotes.UpdateItemQuantityInCartAltumRequest = { cartId: this.cartCommonService.cartId, itemId, quantity };

        return this.cartRequestsService.updateItemQuantityInCartFromQuoteAltumRequest(request).then(res => {
            this.updateCartProductsAfterUpdateItemQuantity(res);
        });
    }

    private updateCartProductsAfterUpdateItemQuantity(response: b2bQuotes.UpdateItemQuantityInCartBaseResponse) {
        this.cartCommonService.updateCartProductsAfterUpdateItemQuantity(response);
        this.cartCheckService.refreshOutdatedProductsWithPriceAndStockLevelBase([response.cartItem], false);
        this.refreshOrderButtonValidity();
    }


    removeCartFromQuote(cartId: number): Promise<void> {
        const request: b2bQuotes.RemoveCartFromQuoteRequest = { cartId: cartId };
        return this.cartRequestsService.removeCartFromQuoteRequest(request);
    }

    private refreshOrderButtonValidity() {
        this.cartCommonService.refreshOrderButtonValidity();
    }

    private correctCartHeaderFieldValidationIfRequiredXl(fieldType: CartDetailType) {
        this.cartHeaderService.correctCartHeaderFieldValidationIfRequiredXl(fieldType);
    }

    private correctCartHeaderFieldValidationIfRequiredAltum(fieldType: CartDetailType) {
        this.cartHeaderService.correctCartHeaderFieldValidationIfRequiredAltum(fieldType);
    }

    private correctCartHeaderFieldValidationIfRequiredBoth(fieldType: CartDetailType) {
        this.cartHeaderService.correctCartHeaderFieldValidationIfRequiredBoth(fieldType);
    }

    private setHeaderFieldStatusToProcessing(fieldType: CartDetailType) {
        this.cartHeaderService.setHeaderFieldStatusToProcessing(fieldType);
    }

    private setHeaderFieldStatusToSaved(fieldType: CartDetailType) {
        this.cartHeaderService.setHeaderFieldStatusToSaved(fieldType);
    }

    updateItemDescription(itemId: number, newDescription: string): Promise<void> {
        const request: b2bCart.UpdateItemDescriptionBaseRequest = { cartId: this.cartId, itemId, newDescription };
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateItemDescriptionXl(request);

            case ApplicationType.ForAltum:
                return this.updateItemDescriptionAltum(request);

            default:
                console.error(`updateItemDescriptionInCartFromQuote(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private updateItemDescriptionXl(request: b2bCart.UpdateItemDescriptionBaseRequest): Promise<void> {
        return this.cartRequestsService.updateItemDescriptionInCartFromQuoteXlRequest(request).then(() => {
            this.updateCartProductDescription(request);
        });
    }

    private updateItemDescriptionAltum(request: b2bCart.UpdateItemDescriptionBaseRequest): Promise<void> {
        return this.cartRequestsService.updateItemDescriptionInCartFromQuoteAltumRequest(request).then(() => {
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
}
