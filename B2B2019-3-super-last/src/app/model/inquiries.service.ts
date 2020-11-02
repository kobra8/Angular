import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';
import { CacheService } from './cache.service';
import { MenuService } from './menu.service';

@Injectable()
export class InquiriesService extends DocumentsList {

    columns: b2b.ColumnConfig[];
    states: Map<number, string>;

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        accountService: AccountService,
        menuService: MenuService,
        private cacheService: CacheService
    ) {

        super(httpClient, configService, menuService, accountService);

        this.columns = [
            {
                property: 'number',
                filter: { property: 'documentNumberFilter', type: 'text' }
            },
            {
                property: 'sourceNumber',
                translation: 'myNumber',
                filter: { property: 'documentOwnNumberFilter', type: 'text' }
            },
            {
                property: 'stateResourceKey',
                translation: 'state',
                type: 'translation',
                filter: {
                    property: 'stateId',
                    type: 'select',
                    valuesProperty: 'states',
                    valuesLoader: this.loadStates.bind(this),
                    defaultValue: -1
                }
            },
            { property: 'issueDate' },
            { property: 'description' },
        ];
    }



    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.InquiriesListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                documentNumberFilter: this.filters.currentFilter.documentNumberFilter,
                documentOwnNumberFilter: this.filters.currentFilter.documentOwnNumberFilter,
                stateId: this.filters.currentFilter.stateId
            }
        );

        return this.httpClient.get<b2b.InquiriesListResponse>('/api/inquiries/', { params: params }).toPromise();

    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.InquiriesListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (!this.states) {
                this.states = DocumentStates.xlInquiryStates;
            }

            return res;
        });
    }

    getDefaultFilter(): b2b.InquiryListFilter {

        return Object.assign(
            super.getDefaultFilter(),
            {
                stateId: -1,
                documentNumberFilter: '',
                documentOwnNumberFilter: '',
            }
        );

    }

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/inquiries/filterStates').toPromise();
    }


}
