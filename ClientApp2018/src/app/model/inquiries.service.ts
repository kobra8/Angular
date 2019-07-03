import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';

@Injectable()
export class InquiriesService extends DocumentsList {

    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {

        super(httpClient);

        this.columns = new Map()
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('state', 'state')
            .set('issueDate', 'issueDate')
            .set('description', 'description');

    }



    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.InquiriesListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { stateId: this.filters.currentFilter.stateId.toString() }
        );

        return this.httpClient.get<b2b.InquiriesListResponse>('api/inquiries/', { params: params }).toPromise();

    }


    getDefaultFilter(): b2b.InquiryListFilter {

        return Object.assign(
            super.getDefaultFilter(),
            { stateId: -1 }
        );

    }

    protected requestStates(getDescription = true): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('api/inquiries/states?getDescription=' + getDescription).toPromise();
    }


}
