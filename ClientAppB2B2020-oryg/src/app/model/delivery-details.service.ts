import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';
import { OldPagination } from './shared/old-pagination';
import { MenuService } from './menu.service';
import { PrintHandlerService } from './shared/printhandler.service';

@Injectable()
export class DeliveryDetailsService extends DocumentDetails {

    pagination: OldPagination;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(httpClient: HttpClient, configService: ConfigService, menuService: MenuService, accountService: AccountService, printHandlerService: PrintHandlerService) {
        super(httpClient, configService, menuService, accountService, printHandlerService);

        this.pagination = new OldPagination();
        this.headerResource = 'deliveryDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'quantity', translation: 'orderedQuantity', type: 'quantity' },
            {
                translation: 'purchaseDocument', type: 'linkedDocument', link: {
                    labelProperty: 'sourceDocumentName',
                    hrefCreator: this.orderHrefCreator.bind(this)
                }
            }
        ];

    }

    protected requestDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        const paginationParams = this.pagination.getRequestParams();

        const params = {
            id: id + '',
            skip: paginationParams.skip,
            top: paginationParams.top
        };

        return this.httpClient.get<b2b.DeliveryDetailsResponse>('/api/delivery/details', { params: <any>params }).toPromise();

    }

    /**
     * Loads delivery details and updates model.
     * The method overrides all the behavior of the base loadDetails method, becouse delivery details structure is significantly different from the structure of the other document details.
     */
    loadDetails(id = this.id): Promise<b2b.DeliveryDetailsResponse> {

        return super.loadDetails(id).then((res: b2b.DeliveryDetailsResponse) => {
            this.pagination.changeParams({
                hasMore: res.hasMore
            });

            this.products = res.items.set5;
            this.states = DocumentStates.xlDeliveryStates as any;
            this.details.copyToCartDisabled = true;
            this.details.isPrintingDisabled = true;

            return res;
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    changePage(page) {
        this.pagination.changePage(page);
        this.loadDetails(this.id);
    }

    orderHrefCreator(item: b2b.DeliveryProduct) {
        return `${this.menuService.routePaths.orderDetails}/${item.sourceDocumentId}`;
    }

}
