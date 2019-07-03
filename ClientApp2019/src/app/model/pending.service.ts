import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';
import { CartsService } from './carts.service';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';

@Injectable()
export class PendingService extends DocumentsList {

    details: b2b.PendingListDetails;
    columns: b2b.ColumnConfig[];

    createdOrderSub: Subscription;

    constructor(httpClient: HttpClient, configService: ConfigService, private cartsService: CartsService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.columns = [
            {
                property: 'name',
                type: 'productName',
                translation: 'article',
                filter: { property: 'name', type: 'text' }
            },
            {
                property: 'number',
                filter: { property: 'number', type: 'text' }
            },
            {
                property: 'sourceNumber',
                translation: 'myNumber',
                filter: { property: 'sourceNumber', type: 'text' }
            },
            { property: 'issueDate' },
            { property: 'orderedQuantity' },
            { property: 'completedQuantity' },
            { property: 'quantityToComplete' },
            { property: 'basicUnit', translation: '', type: 'unit' },
            { property: 'expectedDate' }
        ];

        this.createdOrderSub = this.cartsService.updateOrdersObservable.subscribe(() => {
            this.items = undefined;
            this.details = undefined;
        });
    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PendingListResponse> {

        return this.httpClient
            .get<b2b.PendingListResponse>('/api/orders/', { params: this.prepareSharedParams(getFilter, updateFilter, controlDate) })
            .toPromise();
    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PendingListResponse> {

        return super.loadList(getFilter, updateFilter, controlDate).then((res: b2b.PendingListResponse) => {
            this.details = res.items.set2[0];

            return res;
        });
    }


}
