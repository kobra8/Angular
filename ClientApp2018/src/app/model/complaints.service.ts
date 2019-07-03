import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentsList } from './shared/documents-list';
import { DateHelper } from '../helpers/date-helper';

@Injectable()
export class ComplaintsService extends DocumentsList {

    ifProducts: boolean;
    details?: b2b.ComplaintsListDetails;
    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {

        super(httpClient);

        this.columns = this.getColumns();

    }

    private getDocumentsFilter(): b2b.ComplaintsListFilter {

        return Object.assign(
            super.getDefaultFilter(),
            {
                statusId: 0
            }
        );
    }

    private getProductsFilter(): any {

        return Object.assign(
            super.getDefaultFilter(),
            {
                documentId: 0
            }
        );
    }

    getDefaultFilter(): any {

        if (this.ifProducts) {
            return this.getProductsFilter();
        }

        return this.getDocumentsFilter();
    }

    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.ComplaintsListResponse> {

        let params;

        if (this.ifProducts) {

            const paginationPatams = this.paginationRepo.getRequestParams();

            params = {
                dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
                dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
                skip: paginationPatams.skip,
                top: paginationPatams.top,
                documentId: this.filters.currentFilter.documentId || 0,
                filter: this.filters.currentFilter.filter
            };

        } else {

            params = Object.assign(

                this.prepareSharedParams(getFilter, updateFilter, controlDate),
                //unifying statuses with rest of list api:
                //states starts from -1, statuses starts from 0
                { statusId: (this.filters.currentFilter.statusId - 1).toString() }
            );
            
        }


        return this.httpClient.get<b2b.ComplaintsListResponse>('api/complaints/', { params: params }).toPromise();

    }


    protected requestStates(): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>('api/complaints/states/3585').toPromise().then((res) => {
            //unifying statuses with rest of list api:
            //states starts from -1, statuses starts from 0

            return res.map(item => {
                item.id++;
                return item;
            });

        });
    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.ComplaintsListResponse> {

        return this.requestList(getFilter, updateFilter, controlDate).then(res => {

            if (res.filter) {
                this.filters.ranges.dateFrom = new Date(res.filter.dateFrom);
                this.filters.ranges.dateTo = new Date(res.filter.dateTo);
            }

            this.paginationRepo.pagination.isNextPage = res.hasMore;
            (<b2b.ComplaintsListItem[]>this.items) = res.items.set1;

            
            if (this.filters.documents) {
                delete this.filters.documents;
            }

            if (res.items.set2) {
                this.details = res.items.set2[0];
            }

            return res;

        });

    }

    getColumns(): Map<string, string> {

        if (this.ifProducts) {
            return this.getProductsColumns();
        }

        return this.getDocumentsColumns();
        
    }


    private getDocumentsColumns(): Map<string, string> {

        return new Map()
            .set('number', 'number')
            .set('sourceNumber', 'myNumber')
            .set('status', 'status')
            .set('issueDate', 'issueDate')
            .set('modificationDate', 'modificationDate')
            .set('articlesCount', 'packageArticlesCount')
            .set('sourceDocuments', 'purchaseDocument');
    }


    
    private requestProducts(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any> {

        const paginationPatams = this.paginationRepo.getRequestParams();

        const params = {
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
            skip: paginationPatams.skip,
            top: paginationPatams.top,
            documentId: this.filters.currentFilter.documentId || '0',
            filter: this.filters.currentFilter.filter
        };

        return this.httpClient.get<any>('api/complaints/', { params: params }).toPromise();

    }


    private getProductsColumns(): Map<string, string> {

        return new Map()
            .set('complain', '')
            .set('name', 'name')
            .set('sourceDocumentId', 'purchaseDocument')
            .set('quantity', 'quantity');

    }

    private loadDocumentsRequest(): Promise<b2b.Option2[]> {

        const params = {
            filter: this.filters.currentFilter.filter,
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo)
        };

        return this.httpClient.get<b2b.Option2[]>('api/complaints/purchaseDocuments/', { params: params }).toPromise();

    }

    loadDocuments(): Promise<b2b.Option2[]> {

        if (this.filters.documents === undefined || (this.filters.documents.length === 1 && this.filters.documents[0].id.toString() === this.filters.currentFilter.documentId)) {

            return this.loadDocumentsRequest().then(res => {
                this.filters.documents = res;
                return res;
            });
        } else {

            Promise.resolve(this.filters.documents);
        }
    }

    /**
     * Switches type of complaints list.
     * documents - list of complaints
     * products - list of products to complain (the list is available after click "add new complain" option)
     */
    switchTo(type: 'products' | 'documents') {

        this.ifProducts = type === 'products';
        this.columns = this.getColumns();
    }
}
