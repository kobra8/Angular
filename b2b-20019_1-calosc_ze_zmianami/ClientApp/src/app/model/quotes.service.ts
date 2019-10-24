import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class QuotesService extends DocumentsList {

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
            { property: 'expirationDate' },
            {
                translation: 'fromInquiry', type: 'linkedDocument', link: {
                    href: '/profile/inquiries',
                    labelProperty: 'inquiryNumber',
                    paramProperty: 'inquiryId'
                }
            },
            {
                property: 'orders', type: 'linkedDocumentsArray', link: {
                    href: '/profile/orders',
                    labelProperty: 'number',
                    paramProperty: 'id'
                    
                }
            }

        ];

    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.QuotesListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                stateId: this.filters.currentFilter.stateId,
                valid: this.filters.currentFilter.valid,
            }
        );

        return this.httpClient.get<b2b.QuotesListResponse>('/api/quotes/', { params: params }).toPromise();

    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.QuotesListResponse>{

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (!this.states) {
                this.states = DocumentStates.xlQuoteStates;
            }

            return res;
        });
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

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/quotes/filterStates').toPromise();
    }


}
