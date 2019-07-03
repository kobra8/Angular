import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './shared/pagination-repo';
import { b2b } from '../../b2b';

@Injectable()
export class DeliveryDetailsService extends DocumentDetails {

    paginationRepo: PaginationRepo;
    products: b2b.DeliveryProduct[];
    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {
        super(httpClient, 'deliveryDetails');

        this.paginationRepo = new PaginationRepo();

        this.columns = new Map<string, string>()
            .set('name', 'codeName')
            .set('quantity', 'quantity')
            .set('sourceDocumentId', 'purchaseDocument');
    }

    protected requestDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        const paginationParams: b2b.PaginationRequestParams = this.paginationRepo.getRequestParams();

        const params = {
            id: id.toString(),
            skip: paginationParams.skip,
            top: paginationParams.top
        };

        return this.httpClient.get<b2b.DeliveryDetailsResponse>('api/Delivery', { params: params }).toPromise();

    }

    loadDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        return this.requestDetails(id).then((res: b2b.DeliveryDetailsResponse) => {

            this.products = res.items.set5;
            (<b2b.DeliveryDetails>this.details) = res.items.set4[0];
            this.paginationRepo.pagination.isNextPage = res.hasMore;

            return res;
        });
    }

    changePage(page) {
        this.paginationRepo.changePage(page);
        this.loadDetails();
    }



}
