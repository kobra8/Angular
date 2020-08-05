import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2bProducts } from 'src/integration/products/b2b-products';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProductsRequestsService {

    constructor(private httpClient: HttpClient) { }

    getSuggestionsXlRequest(request: b2bProducts.GetSuggestionsXlRequest): Observable<b2bProducts.GetSuggestionsXlResponse> {
        return this.httpClient.get<b2bProducts.GetSuggestionsXlResponse>('/api/Items/suggestionsXl', { params: <any>request });
    }

    getSuggestionsAltumRequest(request: b2bProducts.GetSuggestionsAltumRequest): Observable<b2bProducts.GetSuggestionsAltumResponse> {
        return this.httpClient.get<b2bProducts.GetSuggestionsAltumResponse>('/api/Items/suggestionsAltum', { params: <any>request });
    }
}
