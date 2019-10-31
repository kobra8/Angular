import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class PaymentsService extends DocumentsList {

    columns: b2b.ColumnConfig[];
    states: Map<number, string>;

    summaries: {
        amount: number;
        remaining: number;
        currency: string;
    }[];

    constructor(httpClient: HttpClient, configService: ConfigService, accountService: AccountService) {

        super(httpClient, configService, accountService);

        this.filters.states = [
            { id: 0, resourceKey: 'notApplied' },
            { id: 1, resourceKey: 'applied'},
            { id: 2, resourceKey: 'overdue' }
        ];

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
                property: 'stateId',
                translation: 'state',
                type: 'state',
                filter: {
                    property: 'stateId',
                    type: 'select',
                    valuesProperty: 'states',
                    defaultValue: -1
                }
            },
            { property: 'issueDate' },
            { property: 'daysAfterDueDate', translation: 'dueDate', type: 'daysAfterDueDate' },
            { property: 'paymentForm' },
            { property: 'amount', type: 'price' },
            { property: 'remaining', type: 'price' },
            {
                property: 'currency',
                filter: {
                    property: 'currencyId',
                    type: 'select',
                    valuesLoader: this.loadCurrency.bind(this),
                    valuesProperty: 'currency',
                    defaultValue: '0'
                }
            }
        ];

    }

    getDefaultFilter(): b2b.PaymentsListFilter {


        return Object.assign(

            super.getDefaultFilter(),
            {
                currencyId: 0,
                currencyName: '',
                stateId: -1,
                paymentTypeId: 2,
            }
        );
    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PaymentsListResponse> {


        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                currencyId: this.filters.currentFilter.currencyId + '',
                currencyName: this.filters.currentFilter.currencyName + '',
                stateId: this.filters.currentFilter.stateId + '',
                paymentTypeId: this.filters.currentFilter.paymentTypeId + '',
            }
        );

        return this.httpClient.get<b2b.PaymentsListResponse>('/api/payments/', { params: params }).toPromise();

    }


    private requestCurrency(): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('/api/payments/paymentCurrency').toPromise();
    }

    loadCurrency(): Promise<b2b.Option2[]> {

        if (this.filters.currency === undefined) {
            return this.requestCurrency().then(res => {
                this.filters.currency = res;
                return res;
            });
        }

        return Promise.resolve(this.filters.currency);
    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<void> {

        return super.loadList(getFilter, updateFilter, controlDate).then((res: b2b.PaymentsListResponse) => {

            this.summaries = res.items.set2;

            if (!this.states) {
                this.states = DocumentStates.xlPaymentStates;
            }
        });
    }


}
