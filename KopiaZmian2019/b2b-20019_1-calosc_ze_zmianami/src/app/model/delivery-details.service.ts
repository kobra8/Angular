import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './shared/pagination-repo';
import { b2b } from '../../b2b';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class DeliveryDetailsService extends DocumentDetails {

    paginationRepo: PaginationRepo;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(httpClient: HttpClient, configService: ConfigService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.paginationRepo = new PaginationRepo();
        this.headerResource = 'deliveryDetails';

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'quantity', translation: 'orderedQuantity', type: 'quantity' },
            {
                translation: 'purchaseDocument', type: 'linkedDocument', link: {
                    href: '/profile/orders',
                    labelProperty: 'sourceDocumentName',
                    paramProperty: 'sourceDocumentId'
                }
            }
        ];

    }

    protected requestDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        const paginationParams: b2b.PaginationRequestParams = this.paginationRepo.getRequestParams();

        const params = {
            id: id + '',
            skip: paginationParams.skip,
            top: paginationParams.top
        };

        return this.httpClient.get<b2b.DeliveryDetailsResponse>('/api/delivery', { params: params }).toPromise();

    }

    /**
     * Loads delivery details and updates model.
     * The method overrides all the behavior of the base loadDetails method, becouse delivery details structure is significantly different from the structure of the other document details.
     */
    loadDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        return this.requestDetails(id).then((res: b2b.DeliveryDetailsResponse) => {

            this.attachments = res.items.set2;
            this.products = res.items.set5;
            (<b2b.DeliveryDetails>this.details) = res.items.set4[0];
            this.paginationRepo.pagination.isNextPage = res.hasMore;

            /**
             * Deliveries are only for XL
             */
            this.states = DocumentStates.xlDeliveryStates;
            

            return res;
        });
    }

    changePage(page) {
        this.paginationRepo.changePage(page);
        this.loadDetails(this.id);
    }


}
