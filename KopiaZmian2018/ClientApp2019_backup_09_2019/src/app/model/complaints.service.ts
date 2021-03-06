import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class ComplaintsService extends DocumentsList {

    details: b2b.ComplaintsListDetails;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;


    constructor(httpClient: HttpClient, configService: ConfigService, accountService: AccountService) {

        super(httpClient, configService, accountService);

        this.columns = [
            {
                property: 'number',
                filter: { property: 'number', type: 'text' }
            },
            {
                property: 'sourceNumber',
                translation: 'myNumber',
                filter: { property: 'sourceNumber', type: 'text' }
            },
            {
                property: 'state',
                type: 'state',
                filter: {
                    property: 'stateId',
                    type: 'select',
                    valuesProperty: 'states',
                    valuesLoader: this.loadStates.bind(this),
                    defaultValue: -1
                }
            },
            { property: 'issueDate' },
            { property: 'modificationDate' },
            { property: 'articlesCount', translation: 'packageArticlesCount' },
            {
                property: 'sourceDocuments', translation: 'purchaseDocument', type: 'linkedDocumentsArray', link: {
                    href: '/profile/payments',
                    labelProperty: 'number',
                    paramProperty: ['id', 'type']
                }
            },
        ];

    }

    getDefaultFilter(): any {
        return Object.assign(
            super.getDefaultFilter(),
            {
                stateId: -1
            }
        );
    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.ComplaintsListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { stateId: this.filters.currentFilter.stateId }
        );

        return this.httpClient.get<b2b.ComplaintsListResponse>('/api/complaints/', { params: params }).toPromise();

    }


    protected requestStates(): Promise<b2b.Option3[]> {

        return this.httpClient.get<b2b.Option3[]>('/api/complaints/filterStates').toPromise();
    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.ComplaintsListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (res.items.set2) {
                this.details = res.items.set2[0];
            }

            if (!this.states) {
                this.states = DocumentStates.xlComplaintStates;
            }

            return res;

        });

    }

}
