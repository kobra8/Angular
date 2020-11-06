import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { DocumentsList } from './shared/documents-list';
import { DocumentStates } from './shared/document-states';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';
import { ConfigService } from './config.service';
import { b2bShared } from 'src/b2b-shared';
import { b2bQuotes } from 'src/b2b-quotes';

@Injectable()
export class QuotesService extends DocumentsList {

    columns: b2b.ColumnConfig[];
    states: Map<number, string>;

    constructor(httpClient: HttpClient, configService: ConfigService, menuService: MenuService, accountService: AccountService) {

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
            { property: 'expirationDate' },
            {
                translation: 'fromInquiry', type: 'linkedDocument', link: {
                    hrefCreator: this.inquiryHrefCreator.bind(this),
                    labelProperty: 'inquiryNumber'
                }
            },
            {
                property: 'orders', type: 'linkedDocumentsArray', link: {
                    hrefCreator: this.ordersHrefCreator.bind(this),
                    labelProperty: 'number'

                }
            }

        ];

    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.QuotesListResponse> {

        const params = Object.assign(

            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                documentNumberFilter: this.filters.currentFilter.documentNumberFilter,
                documentOwnNumberFilter: this.filters.currentFilter.documentOwnNumberFilter,
                stateId: this.filters.currentFilter.stateId,
                valid: this.filters.currentFilter.valid
            }
        );

        return this.httpClient.get<b2b.QuotesListResponse>('/api/quotes/', { params: params }).toPromise();

    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.QuotesListResponse> {

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
                valid: true,
                documentNumberFilter: '',
                documentOwnNumberFilter: ''
            }
        );

    }

    inquiryHrefCreator(item: b2b.QuotesListItem) {

        return `/${this.menuService.routePaths.inquiryDetails}/${item.id}`;
    }

    ordersHrefCreator(order) {

        return `/${this.menuService.routePaths.orderDetails}/${order.id}`;

    }

    protected requestStates(): Promise<b2b.Option3[]> {
        return this.httpClient.get<b2b.Option3[]>('/api/quotes/filterStates').toPromise();
    }

    addToCartFromQuote(request: b2bQuotes.AddToCartFromQuoteRequest): Promise<void> {
        return this.httpClient.post<void>('/api/Quotes/addCartFromQuote', request).toPromise();
    }

}
