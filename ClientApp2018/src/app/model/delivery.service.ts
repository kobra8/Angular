import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';

@Injectable()
export class DeliveryService extends DocumentsList {

    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {
        super(httpClient);

        this.columns = new Map()
            .set('number', 'number')
            .set('state', 'state')
            .set('createdDate', 'createdDate')
            .set('articlesCount', 'packageArticlesCount')
            .set('deliveryAddress', 'shippingAddress')
            .set('waybill', 'waybill');
    }


    getDefaultFilter(): b2b.DeliveryListFilter {

        return Object.assign(

            super.getDefaultFilter(),
            {
                filter: '',
                statusId: 0
            }
        );

    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.DeliveryListResponse> {

        const params = Object.assign(
            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { statusId: this.filters.currentFilter.statusId.toString() }
        );

        return this.httpClient.get<b2b.DeliveryListResponse>('api/delivery/', { params: params }).toPromise();

    }


    protected requestStates(getDescription = true): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('api/delivery/states?getDescription=' + getDescription).toPromise();
    }


}
