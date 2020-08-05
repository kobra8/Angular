import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2bProductDetails } from 'src/integration/b2b-product-details';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProductDetailsRequestsService {

    constructor(private httpClient: HttpClient) { }

    getLastOrderRequest(request: b2bProductDetails.GetLastOrderRequest): Promise<b2bProductDetails.GetLastOrderResponse> {
        return this.httpClient.get<b2bProductDetails.GetLastOrderResponse>(`/api/Items/priceFromLastOrder/${request.articleId}`).toPromise();
    }

    getPlannedDeliveriesRequest(request: b2bProductDetails.GetPlannedDeliveriesRequest): Promise<b2bProductDetails.GetPlannedDeliveriesResponse> {
        return this.httpClient.get<b2bProductDetails.GetPlannedDeliveriesResponse>(`/api/Items/plannedDeliveries/${request.articleId}`).toPromise();
    }

    getThresholdPriceListXlRequest(request: b2bProductDetails.GetThresholdPriceListXlRequest): Observable<b2bProductDetails.GetThresholdPriceListXlResponse> {
        const queryParams = { warehouseId: request.warehouseId, vatValue: request.vatValue, currency: request.currency };
        return this.httpClient.get<b2bProductDetails.GetThresholdPriceListXlResponse>(`/api/Items/${request.articleId}/thresholdPriceListXl`, { params: <any>queryParams });
    }

    getThresholdPriceListAltumRequest(request: b2bProductDetails.GetThresholdPriceListAltumRequest): Observable<b2bProductDetails.GetThresholdPriceListAltumResponse> {
        return this.httpClient.get<b2bProductDetails.GetThresholdPriceListAltumResponse>(`/api/Items/${request.articleId}/thresholdPriceListAltum`);
    }
}
