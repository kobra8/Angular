import { Injectable } from '@angular/core';
import { DocumentsList } from './shared/documents-list';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';
import { CacheService } from './cache.service';
import { MenuService } from './menu.service';

@Injectable()
export class PendingService extends DocumentsList {

    details: b2b.PendingListDetails;
    columns: b2b.ColumnConfig[];

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        accountService: AccountService,
        menuService: MenuService,
        private cacheService: CacheService
    ) {
        super(httpClient, configService, menuService, accountService);

        this.columns = [
            {   property: 'numberWm'}, //JD
            {
                property: 'name',
                type: 'productName',
                translation: 'article',
                filter: { property: 'articleNameFilter', type: 'text' }
            },
            {
                property: 'number',
                filter: { property: 'documentNumberFilter', type: 'text' }
            },
            {
                property: 'sourceNumber',
                translation: 'myNumber',
                filter: { property: 'documentOwnNumberFilter', type: 'text' }
            },
            { property: 'numberWz'}, // JD
            { property: 'issueDate' },
            { property: 'orderedQuantity' },
            { property: 'completedQuantity' },
            { property: 'quantityToComplete' },
            { property: 'quantityWm' }, // JD
            { property: 'basicUnit', translation: '', type: 'unit' },
          //  { property: 'expectedDate' } //JD
        ];
    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PendingListResponse> {


        const params = Object.assign(
            this.prepareSharedParams(getFilter, updateFilter, controlDate),
            {
                articleNameFilter: this.filters.currentFilter.articleNameFilter,
                documentNumberFilter: this.filters.currentFilter.documentNumberFilter,
                documentOwnNumberFilter: this.filters.currentFilter.documentOwnNumberFilter
            }
        );

        return this.httpClient
            .get<b2b.PendingListResponse>('/api/orders/extendedFilter', { params: params })
            .toPromise();
    }

    getDefaultFilter(): any {
        return Object.assign(
            super.getDefaultFilter(),
            {
                articleNameFilter: '',
                documentNumberFilter: '',
                documentOwnNumberFilter: ''
            }
        );
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
