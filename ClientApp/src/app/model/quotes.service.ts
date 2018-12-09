import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';

@Injectable()
export class QuotesService extends DocumentsList {

    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {

        super(httpClient);

        this.columns = new Map()
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('state', 'state')
            .set('issueDate', 'issueDate')
            .set('expirationDate', 'expirationDate')
            .set('inquiryNumber', 'fromInquiry')
            .set('orders', 'orders');

    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.QuotesListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                //unifying statuses with rest of list api:
                //states starts from -1, statuses starts from 0
                stateId: (this.filters.currentFilter.stateId + 1).toString(),
                valid: this.filters.currentFilter.valid.toString(),
            }
        );

        return this.httpClient.get<b2b.QuotesListResponse>('api/quotes/', { params: params }).toPromise();

    }


    getDefaultFilter(): b2b.QuotesListFilter {

        return Object.assign(

            super.getDefaultFilter(),
            {
                stateId: -1,
                valid: true
            }
        );

    }

    protected requestStates(getDescription = true): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>('api/quotes/states?getDescription=' + getDescription).toPromise().then((res) => {
            //unifying statuses with rest of list api:
            //states starts from -1, statuses starts from 0

            return res.map(item => {
                item.id--;
                return item;
            });

        });
    }


}
