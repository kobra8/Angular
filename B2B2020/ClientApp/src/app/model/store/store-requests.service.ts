import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2bStore } from 'src/integration/store/b2b-store';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StoreRequestsService {

    constructor(private httpClient: HttpClient) { }

    getStoresRequest(): Observable<b2bStore.GetStoresResponse> {
        return this.httpClient.get<b2bStore.GetStoresResponse>('/api/store');
    }

    getStoreContentRequest(request: b2bStore.GetStoreContentRequest): Observable<b2bStore.GetStoreContentResponse> {
        return this.httpClient.get<b2bStore.GetStoreContentResponse>('/api/store/storeContent', { params: <any>request });
    }

    updateItemQuantityRequest(request: b2bStore.UpdateItemQuantityRequest): Observable<void> {
        return this.httpClient.put<void>('/api/store/updateItemQuantity', request);
    }

    removeStoreItemRequest(request: b2bStore.RemoveStoreItemRequest): Observable<b2bStore.RemoveStoreItemResponse> {
        return this.httpClient.delete<b2bStore.RemoveStoreItemResponse>('/api/store/removeStoreItem', { params: <any>request });
    }

    copyAllArticlesToCartRequest(request: b2bStore.CopyAllArticlesToCartRequest): Observable<b2bStore.CopyAllArticlesToCartResponse> {
        return this.httpClient.post<b2bStore.CopyAllArticlesToCartResponse>('/api/store/copyToCart', request);
    }

    removeStore(request: b2bStore.RemoveStoreRequest): Observable<void> {
        return this.httpClient.delete<void>(`/api/store/${request.storeId}`);
    }

    updateStoreName(request: b2bStore.UpdateStoreNameRequest): Observable<void> {
        return this.httpClient.put<void>('/api/store/updateStoreName', request);
    }

    addToStore(request: b2bStore.AddToStoreRequest): Observable<b2bStore.AddToStoreResponse> {
        return this.httpClient.post<b2bStore.AddToStoreResponse>('/api/store/addToStore', request);
    }

    createStore(request: b2bStore.CreateStoreRequest): Observable<b2bStore.CreateStoreResponse> {
        return this.httpClient.post<b2bStore.CreateStoreResponse>('/api/store/createStore', request);
    }
}
