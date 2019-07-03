import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';

@Injectable()
export class PaymentsService extends DocumentsList {

    columns: Map<string, string>;

    summaries: {
        amount: number;
        remaining: number;
        currency: string;
    }[];

    constructor(httpClient: HttpClient) {

        super(httpClient);

        this.filters.stateKeys = [
            { id: -1, name: 'all' },
            { id: 0, name: 'open' },
            { id: 1, name: 'applied' },
            { id: 2, name: 'overdue' }
        ];

        this.columns = new Map()
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('issueDate', 'issueDate')
            .set('daysAfterDueDate', 'dueDate')
            .set('paymentForm', 'paymentForm')
            .set('amount', 'amount')
            .set('remaining', 'remaining')
            .set('currency', 'currency');

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
                currencyId: this.filters.currentFilter.currencyId.toString(),
                currencyName: this.filters.currentFilter.currencyName.toString(),
                stateId: this.filters.currentFilter.stateId.toString(),
                paymentTypeId: this.filters.currentFilter.paymentTypeId.toString(),
            }
        );

        return this.httpClient.get<b2b.PaymentsListResponse>('api/payments/', { params: params }).toPromise();

    }


    protected requestStates(getDescription = true): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('api/payments/states?getDescription=' + getDescription).toPromise();
    }


    private requestCurrency(): Promise<b2b.Option2[]> {
        return this.httpClient.get<b2b.Option2[]>('api/payments/paymentCurrency').toPromise();
    }

    loadCurrency(): Promise<b2b.Option2[]> {

        if (this.filters.currency === undefined) {
            return this.requestCurrency().then(res => {
                this.filters.currency = res;
                return res;
            });
        }
    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<void> {

        return super.loadList(getFilter, updateFilter, controlDate).then((res: b2b.PaymentsListResponse) => {

            this.summaries = res.items.set2;

        });
    }


}
