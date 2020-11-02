import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';

@Injectable()
export class DeliveryService extends DocumentsList {

    columns: b2b.ColumnConfig[];
    states: Map<number, string>;

    constructor(httpClient: HttpClient, configService: ConfigService, menuService: MenuService, accountService: AccountService) {
        super(httpClient, configService, menuService, accountService);

        this.columns = [
            {
                property: 'number',
                filter: { property: 'filter', type: 'text' }
            },
            {
                property: 'statusResourceKey',
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
            { property: 'createdDate' },
            { property: 'articlesCount', translation: 'packageArticlesCount' },
            { property: 'deliveryAddress', translation: 'shippingAddress' },
            { property: 'waybill' }
        ];

        
    }


    getDefaultFilter(): b2b.DeliveryListFilter {

        return Object.assign(
            super.getDefaultFilter(),
            {
                stateId: -1,
                filter: ''
            }
        );

    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.DeliveryListResponse> {

        const params = Object.assign(
            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { stateId: this.filters.currentFilter.stateId, filter: this.filters.currentFilter.filter }
        );

        return this.httpClient.get<b2b.DeliveryListResponse>('/api/delivery/', { params: params }).toPromise();

    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.DeliveryListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then((res) => {

            if (!this.states) {
                this.states = DocumentStates.xlDeliveryStates;
            }

            return res;
        });
    }

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/delivery/filterStates').toPromise();
    }


}
