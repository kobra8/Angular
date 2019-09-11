import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { Subscription } from 'rxjs';
import { CartsService } from './carts.service';
import { AccountService } from './account.service';

@Injectable()
export class OrdersService extends DocumentsList {

    columns: b2b.ColumnConfig[];
    states: Map<number, string>;

    createdOrderSub: Subscription;

    constructor(httpClient: HttpClient, configService: ConfigService, private cartsService: CartsService, accountService: AccountService) {

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
                    href: '/profile/quotes',
                    labelProperty: 'number',
                    paramProperty: 'id'
                }
            }
        ];

        this.createdOrderSub = this.cartsService.updateOrdersObservable.subscribe(() => {
            this.items = undefined;
        });

    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.OrdersListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            { stateId: this.filters.currentFilter.stateId }
        );


        return this.httpClient.get<b2b.OrdersListResponse>('/api/orders/', { params: params }).toPromise();

    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.OrdersListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (!this.states) {
                this.states = DocumentStates.xlOrderStates;
            }

            return res;

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
                stateId: -1,
            }
        );
    }

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/orders/filterStates').toPromise();
    }


}
