import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2bCart } from 'src/b2b-cart';

@Injectable()
export class CartHeaderService {

    constructor(private httpClient: HttpClient) { }

    private updateSourceNumberXlRequest(request: b2bCart.UpdateSourceNumberRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartSourceNumberXl', request).toPromise();
    }

    updateSourceNumberXl(request: b2bCart.UpdateSourceNumberRequest): Promise<void> {
        return this.updateSourceNumberXlRequest(request);
    }

    private updateSourceNumberAltumRequest(request: b2bCart.UpdateSourceNumberRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartSourceNumberAltum', request).toPromise();
    }

    updateSourceNumberAltum(request: b2bCart.UpdateSourceNumberRequest): Promise<void> {
        return this.updateSourceNumberAltumRequest(request);
    }


    private updateDescriptionXlRequest(request: b2bCart.UpdateDescriptionRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartDescriptionXl', request).toPromise();
    }

    updateDescriptionXl(request: b2bCart.UpdateDescriptionRequest): Promise<void> {
        return this.updateDescriptionXlRequest(request);
    }

    private updateDescriptionAltumRequest(request: b2bCart.UpdateDescriptionRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartDescriptionAltum', request).toPromise();
    }

    updateDescriptionAltum(request: b2bCart.UpdateDescriptionRequest): Promise<void> {
        return this.updateDescriptionAltumRequest(request);
    }


    private updateAddressXlRequest(request: b2bCart.UpdateAddressRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartAddressXl', request).toPromise();
    }

    updateAddressXl(request: b2bCart.UpdateAddressRequest): Promise<void> {
        return this.updateAddressXlRequest(request);
    }

    private updateAddressAltumRequest(request: b2bCart.UpdateAddressRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartAddressAltum', request).toPromise();
    }

    updateAddressAltum(request: b2bCart.UpdateAddressRequest): Promise<void> {
        return this.updateAddressAltumRequest(request);
    }


    private updateRealizationDateXlRequest(request: b2bCart.UpdateRealizationDateRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationDateXl', request).toPromise();
    }

    updateRealizationDateXl(request: b2bCart.UpdateRealizationDateRequest): Promise<void> {
        return this.updateRealizationDateXlRequest(request);
    }

    private updateRealizationDateAltumRequest(request: b2bCart.UpdateRealizationDateRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationDateAltum', request).toPromise();
    }

    updateRealizationDateAltum(request: b2bCart.UpdateRealizationDateRequest): Promise<void> {
        return this.updateRealizationDateAltumRequest(request);
    }


    private updateRealizationXlRequest(request: b2bCart.UpdateRealizationRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartRealisationXl', request).toPromise();
    }

    updateRealizationXl(request: b2bCart.UpdateRealizationRequest): Promise<void> {
        return this.updateRealizationXlRequest(request);
    }


    private updateDeliveryMethodXlRequest(request: b2bCart.UpdateDeliveryMethodXlRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        return this.httpClient.put<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse>('/api/carts/UpdateCartDeliveryMethodXl', request).toPromise();
    }

    updateDeliveryMethodXl(request: b2bCart.UpdateDeliveryMethodXlRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        return this.updateDeliveryMethodXlRequest(request);
    }

    private updateDeliveryMethodAltumRequest(request: b2bCart.UpdateDeliveryMethodAltumRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartDeliveryMethodAltum', request).toPromise();
    }

    updateDeliveryMethodAltum(request: b2bCart.UpdateDeliveryMethodAltumRequest): Promise<void> {
        return this.updateDeliveryMethodAltumRequest(request);
    }


    private updatePaymentFormXlRequest(request: b2bCart.UpdatePaymentFormRequest): Promise<b2bCart.UpdateCartHeaderPaymentFormResponseModelXl> {
        return this.httpClient.put<b2bCart.UpdateCartHeaderPaymentFormResponseModelXl>('/api/carts/UpdateCartPaymentFormXl', request).toPromise();
    }

    updatePaymentFormXl(request: b2bCart.UpdatePaymentFormRequest): Promise<b2bCart.UpdateCartHeaderPaymentFormResponseModelXl> {
        return this.updatePaymentFormXlRequest(request);
    }

    private updatePaymentFormAltumRequest(request: b2bCart.UpdatePaymentFormRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryAltumResponse> {
        return this.httpClient.put <b2bCart.UpdateCartHeaderArticlesWithSummaryAltumResponse>('/api/carts/UpdateCartPaymentFormAltum', request).toPromise();
    }

    updatePaymentFormAltum(request: b2bCart.UpdatePaymentFormRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryAltumResponse> {
        return this.updatePaymentFormAltumRequest(request);
    }


    private updatePaymentDateXlRequest(request: b2bCart.UpdatePaymentDateRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        return this.httpClient.put<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse>('/api/carts/UpdateCartPaymentDateXl', request).toPromise();
    }

    updatePaymentDateXl(request: b2bCart.UpdatePaymentDateRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithSummaryXlResponse> {
        return this.updatePaymentDateXlRequest(request);
    }

    private updatePaymentDateAltumRequest(request: b2bCart.UpdatePaymentDateRequest): Promise<void> {
        return this.httpClient.put<void>('/api/carts/UpdateCartPaymentDateAltum', request).toPromise();
    }

    updatePaymentDateAltum(request: b2bCart.UpdatePaymentDateRequest): Promise<void> {
        return this.updatePaymentDateAltumRequest(request);
    }


    private updateWarehouseXlRequest(request: b2bCart.UpdateWarehouseRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse> {
        return this.httpClient.put<b2bCart.UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse>('/api/carts/UpdateCartWarehouseXl', request).toPromise();
    }

    updateWarehouseXl(request: b2bCart.UpdateWarehouseRequest): Promise<b2bCart.UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse> {
        return this.updateWarehouseXlRequest(request);
    }

    private updateWarehouseAltumRequest(request: b2bCart.UpdateWarehouseRequest): Promise<b2bCart.UpdateCartHeaderWarehouseResponseModelAltum> {
        return this.httpClient.put<b2bCart.UpdateCartHeaderWarehouseResponseModelAltum>('/api/carts/UpdateCartWarehouseAltum', request).toPromise();
    }

    updateWarehouseAltum(request: b2bCart.UpdateWarehouseRequest): Promise<b2bCart.UpdateCartHeaderWarehouseResponseModelAltum> {
        return this.updateWarehouseAltumRequest(request);
    }
}
