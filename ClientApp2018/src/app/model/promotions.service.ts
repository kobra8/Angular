import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { PaginationRepo } from './shared/pagination-repo';

@Injectable()
export class PromotionsService {

    paginationRepo: PaginationRepo;
    columns: Map<string, string>;
    items: b2b.PromotionListItem[];
    filter: string = '';

    constructor(private httpClient: HttpClient) {

        this.paginationRepo = new PaginationRepo({ currentPage: 0 });
    }


    protected requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PromotionListResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        const params = {
            filter: this.filter,
            skip: paginationParams.skip,
            top: paginationParams.top,
            getFilter: getFilter.toString(),
            updateFilter: updateFilter.toString()
        };

        return this.httpClient.get<b2b.PromotionListResponse>('api/promotions/', { params: params }).toPromise();
    // https://b2b.bruk-bet.pl/api/promotions/17887?groupId=0&filter=holland&isNameFiltered=true&isCodeFiltered=false&isProducerFiltered=false&isDescriptionFiltered=false%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&isBrandFiltered=false&brandId=0&warehouseId=0&onlyAvailable=false&filterInGroup=false%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&features=&attributes=&skip=1&top=22&getFilter=false&updateFilter=true
    }

    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PromotionListResponse> {
        return this.requestList(getFilter, updateFilter, controlDate).then(res => {
            this.items = res.items.set1;
            this.paginationRepo.pagination.isNextPage = res.hasMore;
            return res;
        });


    }

}
