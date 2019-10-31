import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { b2b } from '../../b2b';
import { DateHelper } from '../helpers/date-helper';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { AccountService } from './account.service';

@Injectable()
export class ComplaintProductsService extends DocumentsList {

    details: b2b.ComplaintsListDetails;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    loadedDocumentsDateRange: [Date, Date];
    documentsLoading: boolean;

    constructor(httpClient: HttpClient, configService: ConfigService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.loadedDocumentsDateRange = [this.filters.currentFilter.dateFrom, this.filters.currentFilter.dateTo];

        this.columns = [
            { property: 'complain', translation: ' ', type: 'complain' },
            {
                property: 'name',
                type: 'productName',
                filter: { property: 'name', type: 'text' }
            },
            {
                property: 'sourceDocumentId',
                translation: 'purchaseDocument',
                type: 'linkedDocument',
                link: {
                    href: '/profile/payments',
                    labelProperty: 'sourceDocumentName',
                    paramProperty: ['sourceDocumentId', 'sourceDocumentType']
                },
                filter: {
                    property: 'documentId',
                    type: 'select',
                    valuesProperty: 'documents',
                    valuesLoader: this.loadDocuments.bind(this),
                    defaultValue: 0
                }
            },
            { property: 'quantity', type: 'quantity' }
        ];
    }

    getDefaultFilter(): b2b.PaymentsListFilter {

        return Object.assign(

            super.getDefaultFilter(),
            {
                documentId: 0
            }
        );
    }

    protected requestList(): Promise<b2b.ComplaintsListResponse> {

        let params;
        let documentsPromise = null;

        const paginationParams = this.paginationRepo.getRequestParams();

        if (DateHelper.difference(this.loadedDocumentsDateRange[0], this.filters.currentFilter.dateFrom, 'days') !== 0
                || DateHelper.difference(this.loadedDocumentsDateRange[1], this.filters.currentFilter.dateTo, 'days') !== 0) {

            documentsPromise = this.loadDocuments();
        }

        params = {
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
            skip: paginationParams.skip,
            top: paginationParams.top,
            documentId: this.filters.currentFilter.documentId,
            filter: this.filters.currentFilter.name || ''
        };



        if (documentsPromise) {

            return documentsPromise.then(() => {

                const isDocumentExist = this.filters.documents.find(el => el.id === Number(this.filters.currentFilter.documentId));

                if (!isDocumentExist) {
                    this.filters.currentFilter.documentId = 0;
                    params.documentId = 0;
                }

                return this.httpClient.get<b2b.ComplaintsListResponse>('/api/complaints/', { params: params }).toPromise();
            });
        }

        return this.httpClient.get<b2b.ComplaintsListResponse>('/api/complaints/', { params: params }).toPromise();

    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.ComplaintsListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then(res => {

            if (res.items.set2) {
                this.details = res.items.set2[0];
            }

            return res;

        });

    }


    private loadDocumentsRequest(): Promise<b2b.Option2[]> {

        const params = {
            filter: this.filters.currentFilter.name || '',
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo)
        };

        return this.httpClient.get<b2b.Option2[]>('/api/complaints/purchasedocuments/', { params: params }).toPromise();

    }

    loadDocuments(): Promise<b2b.Option2[]> {

        this.documentsLoading = true;

        if (this.filters.documents === undefined
            || DateHelper.difference(this.loadedDocumentsDateRange[0], this.filters.currentFilter.dateFrom, 'days') !== 0
            || DateHelper.difference(this.loadedDocumentsDateRange[1], this.filters.currentFilter.dateTo, 'days') !== 0) {

            this.loadedDocumentsDateRange = [this.filters.currentFilter.dateFrom, this.filters.currentFilter.dateTo];

            return this.loadDocumentsRequest().then(res => {
                this.filters.documents = res;

                this.documentsLoading = false;
                return res;
            });

        } else {

            this.documentsLoading = false;
            return Promise.resolve(this.filters.documents);
        }
    }
}
