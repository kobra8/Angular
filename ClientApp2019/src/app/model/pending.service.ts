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
            //JD
            {   property: 'numberWm'},
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
            { property: 'numberWz'},
            { property: 'issueDate' },
            { property: 'orderedQuantity' },
            { property: 'completedQuantity' },
            { property: 'quantityToComplete' },
            { property: 'quantityWm' },
            { property: 'basicUnit', translation: '', type: 'unit' },
          // JD  { property: 'expectedDate' }
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
        // JD
            const resSet1Arr = JSON.parse(JSON.stringify(res.items.set1)); // Deep copy of arr set 1
            res.items.set1.forEach((x, i) => {
               if (x.numberWm === '') {
                    x.numberWm = 'brak nr WM';
               } else if (i > 0 && x.numberWm === resSet1Arr[i - 1].numberWm) {
                    x.numberWm = ' ';
               }
               return x;
            });
            return res;
        });
    }


}
