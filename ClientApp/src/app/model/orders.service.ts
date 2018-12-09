import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';

@Injectable()
export class OrdersService extends DocumentsList {

    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {

        super(httpClient);

        this.columns = new Map()
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('state', 'state')
            .set('issueDate', 'issueDate')
            .set('expectedDate', 'expectedDate')
            .set('customer', 'targetEmployee')
            .set('deliveryMethod', 'shippingMethod')
            .set('completionEntirely', 'completion')
            .set('quotes', 'quotes');

    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.OrdersListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { stateId: this.filters.currentFilter.stateId.toString() }
        );


        return this.httpClient.get<b2b.OrdersListResponse>('api/orders/', { params: params }).toPromise();

    }



    /**
     * Returns default filtering options.
     * Useful for initializing list and reseting filters.
     */
    getDefaultFilter(): b2b.OrderFilter {

        return Object.assign(

            super.getDefaultFilter(),
            {
                document: '',
                stateId: -1,
                state: null
            }
        );
    }

    protected requestStates(getDescription = true): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('api/orders/states?getDescription=' + getDescription).toPromise();
    }


}
