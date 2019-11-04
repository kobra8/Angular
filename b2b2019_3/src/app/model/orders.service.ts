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
export class OrdersService extends DocumentsList {

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
            { property: 'expectedDate' },
            { property: 'customer', translation: 'targetEmployee' },
            { property: 'deliveryMethod', translation: 'shippingMethod' },
            {
                property: 'completionEntirely', translation: 'completion', type: 'cases', cases: [
                    { case: 0, translation: 'partialCompletion' },
                    { case: 1, translation: 'entireCompletion' }
                ]
            },
            {
                property: 'quotes', type: 'linkedDocumentsArray', link: {
                    hrefCreator: this.quotesHrefCreator.bind(this),
                    labelProperty: 'number'
                }
            }
        ];

    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.OrdersListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                documentNumberFilter: this.filters.currentFilter.documentNumberFilter,
                documentOwnNumberFilter: this.filters.currentFilter.documentOwnNumberFilter,
                stateId: this.filters.currentFilter.stateId
            }
        );


        return this.httpClient.get<b2b.OrdersListResponse>('/api/orders/', { params: params }).toPromise();

    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.OrdersListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (!this.states) {
                this.states = DocumentStates.xlOrderStates;
            }

            this.hideDeliveryMethodsIfRequired();

            return res;

        }).catch(err => {
            return Promise.reject(err);
        });
    }

    /**
     * Returns default filtering options.
     * Useful for initializing list and reseting filters.
     */
    getDefaultFilter(): b2b.OrderFilter {

        return Object.assign(

            super.getDefaultFilter(),
            {
                documentNumberFilter: '',
                documentOwnNumberFilter: '',
                stateId: -1
            }
        );
    }

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/orders/filterStates').toPromise();
    }


    quotesHrefCreator(quote) {

        return `/${this.menuService.routePaths.quoteDetails}/${quote.id}`;

    }


    private hideDeliveryMethodsIfRequired(): void {
        const deliveryColumn = this.columns.find(item => item.property === 'deliveryMethod');
        if (!this.configService.permissions.hasAccessToShowDeliveryMethod) {
            deliveryColumn.type = 'noValueSymbol';
        } else {
            deliveryColumn.type = null;
        }
    }

}
