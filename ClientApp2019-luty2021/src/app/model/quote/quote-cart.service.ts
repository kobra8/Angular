import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2bQuotes } from 'src/b2b-quotes';
import { DateHelper } from 'src/app/helpers/date-helper';
import { OldPagination } from '../shared/old-pagination';
import { b2bCart } from 'src/b2b-cart';

@Injectable()
export class QuoteCartService {

    pagination: OldPagination;

    constructor(private httpClient: HttpClient) {
        this.pagination = new OldPagination();
    }

    private updateSourceNumberRequest(request: b2bQuotes.UpdateSourceNumberInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateSourceNumberInCart', request).toPromise();
    }

    updateSourceNumber(cartId: number, sourceNumber: string): Promise<void> {
        const request: b2bQuotes.UpdateSourceNumberInCartRequest = { cartId: cartId, sourceNumber: sourceNumber };
        return this.updateSourceNumberRequest(request);
    }


    private updateDescriptionRequest(request: b2bQuotes.UpdateDescriptionInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateDescriptionInCart', request).toPromise();
    }

    updateDescription(cartId: number, description: string): Promise<void> {
        const request: b2bQuotes.UpdateDescriptionInCartRequest = { cartId: cartId, description: description };
        return this.updateDescriptionRequest(request);
    }


    private updateAddressRequest(request: b2bQuotes.UpdateAddressInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateShippingAddressInCart', request).toPromise();
    }

    updateAddress(cartId: number, addressId: number): Promise<void> {
        const request: b2bQuotes.UpdateAddressInCartRequest = { cartId: cartId, shippingAddressId: addressId };
        return this.updateAddressRequest(request);
    }


    private updateRealizationDateRequest(request: b2bQuotes.UpdateRealizationDateInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateReceiptDateInCart', request).toPromise();
    }

    updateRealizationDate(cartId: number, realizationDate: Date): Promise<void> {
        const request: b2bQuotes.UpdateRealizationDateInCartRequest = { cartId: cartId, receiptDate: DateHelper.dateToString(realizationDate) };
        return this.updateRealizationDateRequest(request);
    }


    private updateRealizationXlRequest(request: b2bQuotes.UpdateRealizationInCartXlRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateCompletionEntirelyInCart', request).toPromise();
    }

    updateRealizationXl(cartId: number, realizationType: number): Promise<void> {
        const request: b2bQuotes.UpdateRealizationInCartXlRequest = { cartId: cartId, completionEntirely: realizationType };
        return this.updateRealizationXlRequest(request);
    }


    private updateDeliveryMethodRequest(request: b2bQuotes.UpdateDeliveryMethodInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateDeliveryMethodInCart', request).toPromise();
    }

    updateDeliveryMethod(cartId: number, deliveryMethod: string): Promise<void> {
        const request: b2bQuotes.UpdateDeliveryMethodInCartRequest = { cartId: cartId, deliveryMethod: deliveryMethod };
        return this.updateDeliveryMethodRequest(request);
    }


    private updatePaymentFormRequest(request: b2bQuotes.UpdatePaymentFormInCartRequest): Promise<b2bQuotes.UpdatePaymentFormInCartResponse> {
        return this.httpClient.put<b2bQuotes.UpdatePaymentFormInCartResponse>('/api/Quotes/updatePaymentFormInCart', request).toPromise();
    }

    updatePaymentFormXl(cartId: number, paymentFormId: number): Promise<b2bQuotes.UpdatePaymentFormInCartResponse> {
        const request: b2bQuotes.UpdatePaymentFormInCartRequest = { cartId: cartId, paymentFormId: paymentFormId };
        return this.updatePaymentFormRequest(request).then(res => res);
    }

    updatePaymentFormAltum(cartId: number, paymentFormId: number): Promise<void> {
        const request: b2bQuotes.UpdatePaymentFormInCartRequest = { cartId: cartId, paymentFormId: paymentFormId };
        return this.updatePaymentFormRequest(request).then(() => Promise.resolve());
    }


    private updatePaymentDateRequest(request: b2bQuotes.UpdatePaymentDateInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updatePaymentDateInCart', request).toPromise();
    }

    updatePaymentDate(cartId: number, paymentDate: Date): Promise<void> {
        const request: b2bQuotes.UpdatePaymentDateInCartRequest = { cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate) };
        return this.updatePaymentDateRequest(request);
    }


    private updateWarehouseRequest(request: b2bQuotes.UpdateWarehouseInCartRequest): Promise<b2bCart.UpdateStockState> {
        return this.httpClient.put<b2bCart.UpdateStockState>('/api/Quotes/updateWarehouseInCartFromQuote', request).toPromise();
    }

    updateWarehouse(cartId: number, warehouseId: number): Promise<b2bCart.UpdateStockState> {
        const paginationParams = this.pagination.getRequestParams();
        const request: b2bQuotes.UpdateWarehouseInCartRequest = { cartId: cartId, warehouseId: warehouseId, skip: paginationParams.skip, take: paginationParams.top };
        return this.updateWarehouseRequest(request).then(res => res);
    }


    private updateItemQuantityRequest(request: b2bQuotes.UpdateItemQuantityInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateItemQuantityInCart', request).toPromise();
    }

    updateItemQuantity(cartId: number, itemId: number, quantity: number): Promise<void> {
        const request: b2bQuotes.UpdateItemQuantityInCartRequest = { cartId: cartId, itemId: itemId, quantity: quantity };
        return this.updateItemQuantityRequest(request);
    }

    private removeCartFromQuoteRequest(request: b2bQuotes.RemoveCartFromQuoteRequest): Promise<void> {
        const params: any = {
            cartId: request.cartId
        };
        return this.httpClient.delete<void>('/api/Quotes/removeCartFromQuote', { params: params }).toPromise();
    }

    removeCartFromQuote(cartId: number): Promise<void> {
        const request: b2bQuotes.RemoveCartFromQuoteRequest = { cartId: cartId };
        return this.removeCartFromQuoteRequest(request);
    }
}
