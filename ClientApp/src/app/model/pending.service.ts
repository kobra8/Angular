import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';

@Injectable()
export class PendingService extends DocumentsList {

    details: b2b.PendingListDetails;
    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {
        super(httpClient);

        this.columns = new Map()
            .set('name', 'article')
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('issueDate', 'issueDate')
            .set('orderedQuantity', 'orderedQuantity')
            .set('completedQuantity', 'completedQuantity')
            .set('quantityToComplete', 'quantityToComplete')
            .set('basicUnit', '')
            .set('expectedDate', 'expectedDate');
    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PendingListResponse> {

        const params = this.prepareSharedParams(getFilter, updateFilter, controlDate);

        return this.httpClient.get<b2b.PendingListResponse>('api/orders/', { params: params }).toPromise();

    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PendingListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then((res: b2b.PendingListResponse) => {
            this.details = res.items.set2[0];

            return res;
        });
    }


}
