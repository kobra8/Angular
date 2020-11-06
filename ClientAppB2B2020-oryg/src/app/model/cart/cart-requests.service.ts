import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2bCartCheck } from 'src/integration/b2b-cart-check';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { b2b } from 'src/b2b';
import { b2bQuotes } from 'src/integration/b2b-quotes';

@Injectable()
export class CartRequestsService {

    constructor(private httpClient: HttpClient) { }

    getCartDetailsXlRequest(request: b2bCart.GetCartDetailsXlRequest): Promise<b2bCart.IGetCartDetailsXlResponse> {
        return this.httpClient.get<b2bCart.IGetCartDetailsXlResponse>('/api/carts/getCartDetailsXl', { params: <any>request }).toPromise();
    }

    getCartDetailsAltumRequest(request: b2bCart.GetCartDetailsAltumRequest): Promise<b2bCart.IGetCartDetailsAltumResponse> {
        return this.httpClient.get<b2bCart.IGetCartDetailsAltumResponse>('/api/carts/getCartDetailsAltum', { params: <any>request }).toPromise();
    }


    updateItemQuantityXlRequest(request: b2bCart.UpdateItemQuantityXlRequest): Promise<b2bCart.UpdateItemQuantityXlResponse> {
        return this.httpClient.put<b2bCart.UpdateItemQuantityXlResponse>('/api/carts/updateitemquantityxl', request).toPromise();
    }

    updateItemQuantityAltumRequest(request: b2bCart.UpdateItemQuantityAltumRequest): Promise<b2bCart.UpdateItemQuantityAltumResponse> {
        return this.httpClient.put<b2bCart.UpdateItemQuantityAltumResponse>('/api/carts/updateitemquantityaltum', request).toPromise();
    }


    removeCartItemXlRequest(request: b2bCart.RemoveCartItemXlRequest): Promise<b2bCart.RemoveCartItemXlResponse> {
        return this.httpClient.delete<b2bCart.RemoveCartItemXlResponse>('/api/carts/removeCartItemXl', { params: <any>request }).toPromise();
    }

    removeCartItemAltumRequest(request: b2bCart.RemoveCartItemAltumRequest): Promise<b2bCart.RemoveCartItemAltumResponse> {
        return this.httpClient.delete<b2bCart.RemoveCartItemAltumResponse>('/api/carts/removeCartItemAltum', { params: <any>request }).toPromise();
    }


    private prepareRemoveCartItemsHttpOptions(request: b2bCart.RemoveCartItemsBaseRequest) {
        return { headers: new HttpHeaders({ 'Content-Type': 'application/json' }), body: request };
    }

    removeCartItemsXlRequest(request: b2bCart.RemoveCartItemsXlRequest): Promise<b2bCart.RemoveCartItemsXlResponse> {
        const httpOptions = this.prepareRemoveCartItemsHttpOptions(request);
        return this.httpClient.delete<b2bCart.RemoveCartItemsXlResponse>('/api/carts/removeCartItemsXl', httpOptions).toPromise();
    }

    removeCartItemsAltumRequest(request: b2bCart.RemoveCartItemsAltumRequest): Promise<b2bCart.RemoveCartItemsAltumResponse> {
        const httpOptions = this.prepareRemoveCartItemsHttpOptions(request);
        return this.httpClient.delete<b2bCart.RemoveCartItemsAltumResponse>('/api/carts/removeCartItemsAltum', httpOptions).toPromise();
    }


    getCreditLimitBehavoiurRequest(request: b2bCart.GetCreditLimitBehavoiurRequest): Promise<b2bCart.GetCreditLimitBehavoiurResponse> {
        return this.httpClient.get<b2bCart.GetCreditLimitBehavoiurResponse>('/api/Carts/checkCartWillExceedCustomerCreditLimit', { params: <any>request }).toPromise();
    }


    addOrderRequest(cartId: number): Promise<b2b.AddOrderResponse> {
        return this.httpClient.post<b2b.AddOrderResponse>('/api/orders/addorder', cartId).toPromise();
    }

    addInquireRequest(cartId: number): Promise<b2b.AddOrderResponse> {
        return this.httpClient.post<b2b.AddOrderResponse>('/api/inquiries/addinquiry', cartId).toPromise();
    }


    requestPaymetForms(cartId: number): Promise<b2bCartHeader.PaymentFormOption[]> {
        return this.httpClient.get<b2bCartHeader.PaymentFormOption[]>(`api/carts/paymentforms/${cartId}`).toPromise();
    }

    getShippingAddressesAltumRequest(cartId: number): Promise<b2bCartHeader.ShippingAddressOption[]> {
        return this.httpClient.get<b2bCartHeader.PaymentFormOption[]>(`api/carts/shippingaddresses/${cartId}`).toPromise();
    }

    getShippingAddressesXlRequest(cartId: number): Promise<b2bCartHeader.GetShippingAddressXlResponse> {
        return this.httpClient.get<b2bCartHeader.GetShippingAddressXlResponse>(`api/Carts/shippingAddressesXl/${cartId}`).toPromise();
    }

    addShippingAddressesXlRequest(request: b2bCartHeader.AddShippingAddressXlRequest): Promise<b2bCartHeader.AddShippingAddressXlResponse> {
        return this.httpClient.post<b2bCartHeader.AddShippingAddressXlResponse>(`api/Carts/shippingAddressXl`, request).toPromise();
    }

    updateShippingAddressesXlRequest(addressId: number, request: b2bCartHeader.UpdateShippingAddressXlRequest): Promise<void> {
        return this.httpClient.put<void>(`api/Carts/shippingAddressXl/${addressId}`, request).toPromise();
    }

    requestDeliveryMethods(cartId: number): Promise<b2bCartHeader.DeliveryMethodOption[]> {
        return this.httpClient.get<b2bCartHeader.DeliveryMethodOption[]>(`api/carts/deliverymethods/${cartId}`).toPromise();
    }

    requestWarehouses(cartId: number): Promise<b2bCartHeader.WarehouseOption[]> {
        return this.httpClient.get<b2bCartHeader.WarehouseOption[]>(`/api/Carts/warehouses/${cartId}`).toPromise();
    }


    updateHeaderAttributeRequest(attr: b2b.CartHeaderAttributeRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/attributechanged', attr).toPromise();
    }


    updateSourceNumberXlRequest(request: b2bCartHeader.UpdateSourceNumberRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartSourceNumberXl', request).toPromise();
    }

    updateSourceNumberAltumRequest(request: b2bCartHeader.UpdateSourceNumberRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartSourceNumberAltum', request).toPromise();
    }


    updateDescriptionXlRequest(request: b2bCartHeader.UpdateDescriptionRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartDescriptionXl', request).toPromise();
    }

    updateDescriptionAltumRequest(request: b2bCartHeader.UpdateDescriptionRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartDescriptionAltum', request).toPromise();
    }


    updateAddressXlRequest(request: b2bCartHeader.UpdateAddressRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartAddressXl', request).toPromise();
    }

    updateAddressAltumRequest(request: b2bCartHeader.UpdateAddressRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartAddressAltum', request).toPromise();
    }


    updateRealizationDateXlRequest(request: b2bCartHeader.UpdateRealizationDateRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationDateXl', request).toPromise();
    }


    updateRealizationDateAltumRequest(request: b2bCartHeader.UpdateRealizationDateRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationDateAltum', request).toPromise();
    }

    updateRealizationXlRequest(request: b2bCartHeader.UpdateRealizationRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationXl', request).toPromise();
    }


    updateDeliveryMethodXlRequest(request: b2bCartHeader.UpdateDeliveryMethodXlRequest): Promise<b2bCartHeader.IUpdateDeliveryMethodXlResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdateDeliveryMethodXlResponse>('/api/carts/UpdateCartDeliveryMethodXl', request).toPromise();
    }

    updateDeliveryMethodAltumRequest(request: b2bCartHeader.UpdateDeliveryMethodAltumRequest): Promise<b2bCartHeader.IUpdateDeliveryMethodAltumResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdateDeliveryMethodAltumResponse>('/api/carts/UpdateCartDeliveryMethodAltum', request).toPromise();
    }


    updatePaymentFormXlRequest(request: b2bCartHeader.UpdatePaymentFormRequest): Promise<b2bCartHeader.IUpdatePaymentFormXlResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdatePaymentFormXlResponse>('/api/carts/UpdateCartPaymentFormXl', request).toPromise();
    }

    updatePaymentFormAltumRequest(request: b2bCartHeader.UpdatePaymentFormRequest): Promise<b2bCartHeader.IUpdatePaymentFormAltumResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdatePaymentFormAltumResponse>('/api/carts/UpdateCartPaymentFormAltum', request).toPromise();
    }


    updatePaymentDateXlRequest(request: b2bCartHeader.UpdatePaymentDateXlRequest): Promise<b2bCartHeader.IUpdatePaymentDateXlResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdatePaymentDateXlResponse>('/api/carts/UpdateCartPaymentDateXl', request).toPromise();
    }

    updatePaymentDateAltumRequest(request: b2bCartHeader.UpdatePaymentDateAltumRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartPaymentDateAltum', request).toPromise();
    }


    updateWarehouseXlRequest(request: b2bCartHeader.UpdateWarehouseRequest): Promise<b2bCartHeader.IUpdateWarehouseXlResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdateWarehouseXlResponse>('/api/carts/UpdateCartWarehouseXl', request).toPromise();
    }

    updateWarehouseAltumRequest(request: b2bCartHeader.UpdateWarehouseRequest): Promise<b2bCartHeader.IUpdateWarehouseXAltumResponse> {
        return this.httpClient.put<b2bCartHeader.IUpdateWarehouseXAltumResponse>('/api/carts/UpdateCartWarehouseAltum', request).toPromise();
    }


    checkCartXlRequest(request: b2bCartCheck.CheckCartXlRequest): Promise<b2bCartCheck.CheckCartXlResponse> {
        return this.httpClient.get<b2bCartCheck.CheckCartXlResponse>('/api/carts/CheckXl', { params: <any>request }).toPromise();
    }

    checkCartAltumRequest(request: b2bCartCheck.CheckCartAltumRequest): Promise<b2bCartCheck.CheckCartAltumResponse> {
        return this.httpClient.get<b2bCartCheck.CheckCartAltumResponse>('/api/carts/CheckAltum', { params: <any>request }).toPromise();
    }


    repairCartHeaderXlRequest(request: b2bCartHeader.RepairCartHeaderXlRequest): Promise<b2bCartHeader.RepairCartHeaderXlResponse> {
        return this.httpClient.put<b2bCartHeader.RepairCartHeaderXlResponse>('/api/carts/RepairCartHeaderXl', request).toPromise();
    }

    repairCartHeaderAltumRequest(request: b2bCartHeader.RepairCartHeaderAltumRequest): Promise<b2bCartHeader.RepairCartHeaderAltumResponse> {
        return this.httpClient.put<b2bCartHeader.RepairCartHeaderAltumResponse>('/api/carts/RepairCartHeaderAltum', request).toPromise();
    }


    recalculatePricesXlRequest(request: b2bCartCheck.RecalculatePricesXlRequest): Promise<b2bCartCheck.RecalculatePricesXlResponse> {
        return this.httpClient.put<b2bCartCheck.RecalculatePricesXlResponse>('/api/carts/RecalculatePricesFromCartCheckXl', request).toPromise();
    }

    recalculatePricesAltumRequest(request: b2bCartCheck.RecalculatePricesAltumRequest): Promise<b2bCartCheck.RecalculatePricesAltumResponse> {
        return this.httpClient.put<b2bCartCheck.RecalculatePricesAltumResponse>('/api/carts/RecalculatePricesFromCartCheckAltum', request).toPromise();
    }


    repairQuantitiesXlRequest(request: b2bCartCheck.RepairQuantitiesXlRequest): Promise<b2bCartCheck.RepairQuantitiesXlResponse> {
        return this.httpClient.put<b2bCartCheck.RepairQuantitiesXlResponse>(`/api/carts/repairCartItemsQuantityXl`, request).toPromise();
    }

    repairQuantitiesAltumRequest(request: b2bCartCheck.RepairQuantitiesAltumRequest): Promise<b2bCartCheck.RepairQuantitiesAltumResponse> {
        return this.httpClient.put<b2bCartCheck.RepairQuantitiesXlResponse>(`/api/carts/repairCartItemsQuantityAltum`, request).toPromise();
    }



    updateSourceNumberInCartFromQuoteRequest(request: b2bQuotes.UpdateSourceNumberInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateSourceNumberInCart', request).toPromise();
    }

    updateDescriptionInCartFromQuoteRequest(request: b2bQuotes.UpdateDescriptionInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateDescriptionInCart', request).toPromise();
    }

    updateAddressInCartFromQuoteRequest(request: b2bQuotes.UpdateAddressInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateShippingAddressInCart', request).toPromise();
    }

    updateRealizationDateInCartFromQuoteRequest(request: b2bQuotes.UpdateRealizationDateInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateReceiptDateInCart', request).toPromise();
    }

    updateRealizationInCartFromQuoteXlRequest(request: b2bQuotes.UpdateRealizationInCartXlRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateCompletionEntirelyInCart', request).toPromise();
    }

    updateDeliveryMethodInCartFromQuoteRequest(request: b2bQuotes.UpdateDeliveryMethodInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateDeliveryMethodInCart', request).toPromise();
    }

    updatePaymentFormInCartFromQuoteRequest(request: b2bQuotes.UpdatePaymentFormInCartRequest): Promise<b2bQuotes.UpdatePaymentFormInCartResponse> {
        return this.httpClient.put<b2bQuotes.UpdatePaymentFormInCartResponse>('/api/Quotes/updatePaymentFormInCart', request).toPromise();
    }

    updatePaymentDateInCartFromQuoteRequest(request: b2bQuotes.UpdatePaymentDateInCartRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updatePaymentDateInCart', request).toPromise();
    }

    updateWarehouseInCartFromQuoteRequest(request: b2bQuotes.UpdateWarehouseInCartRequest): Promise<b2bQuotes.UpdateWarehouseInCartResponse> {
        return this.httpClient.put<b2bQuotes.UpdateWarehouseInCartResponse>('/api/Quotes/updateWarehouseInCartFromQuote', request).toPromise();
    }

    updateItemQuantityInCartFromQuoteXlRequest(request: b2bQuotes.UpdateItemQuantityInCartXlRequest): Promise<b2bQuotes.UpdateItemQuantityInCartXlResponse> {
        return this.httpClient.put<b2bQuotes.UpdateItemQuantityInCartXlResponse>('/api/Quotes/updateItemQuantityInCartXl', request).toPromise();
    }

    updateItemQuantityInCartFromQuoteAltumRequest(request: b2bQuotes.UpdateItemQuantityInCartAltumRequest): Promise<b2bQuotes.UpdateItemQuantityInCartAltumResponse> {
        return this.httpClient.put<b2bQuotes.UpdateItemQuantityInCartAltumResponse>('/api/Quotes/updateItemQuantityInCartAltum', request).toPromise();
    }

    removeCartFromQuoteRequest(request: b2bQuotes.RemoveCartFromQuoteRequest): Promise<void> {
        return this.httpClient.delete<void>('/api/Quotes/removeCartFromQuote', { params: <any>request }).toPromise();
    }

    updateItemDescriptionXlRequest(request: b2bCart.UpdateItemDescriptionXlRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Carts/updateCartItemDescriptionXl', request).toPromise();
    }

    updateItemDescriptionAltumRequest(request: b2bCart.UpdateItemDescriptionAltumRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Carts/updateCartItemDescriptionAltum', request).toPromise();
    }

    updateItemDescriptionInCartFromQuoteXlRequest(request: b2bQuotes.UpdateItemDescriptionInCartXlRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateCartItemDescriptionInCartFromQuoteXl', request).toPromise();
    }

    updateItemDescriptionInCartFromQuoteAltumRequest(request: b2bQuotes.UpdateItemDescriptionInCartAltumRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Quotes/updateCartItemDescriptionInCartFromQuoteAltum', request).toPromise();
    }
}
