import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './shared/pagination-repo';
import { b2b } from '../../b2b';
import { ArrayUtils } from '../helpers/array-utils';

@Injectable()
export class PromotionDetailsService extends DocumentDetails {

    paginationRepo: PaginationRepo;

    params: b2b.PromotionDetailsDefaultParams;
    products: b2b.PromotionProduct[];
    columns: Map<string, string>;
    filter = '';
    deliveryMethods: b2b.PromotionDeliveryMethod[];

    constructor(httpClient: HttpClient) {
        super(httpClient, 'promotionDetails');

        this.paginationRepo = new PaginationRepo();
        this.params = this.getDefaultParams();

        this.columns = new Map()
            .set('name', 'name')
            .set('threshold', 'threshold')
            .set('value', 'value')
            .set('type', 'discountType')
            .set('vatDirection', 'priceType')
            .set('addToCart', '');
    }

    protected requestDetails(id = this.id): Promise<b2b.PromotionDetailsResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        const params = Object.assign(
            this.params,
            { skip: paginationParams.skip, top: paginationParams.top }
        );
        this.params.filter = this.filter;

        return this.httpClient.get<b2b.PromotionDetailsResponse>('api/promotions/' + id, { params: params }).toPromise();
    }

//JD
    loadDetails(id = this.id): Promise<b2b.PromotionDetailsResponse> {

        return this.requestDetails(id).then((res: b2b.PromotionDetailsResponse) => {

            this.id = id;
            (<b2b.PromotionDetails>this.details) = res.items.set4[0];
            if (res.items.set5.length > 0) {
                this.details.calculateDiscount = true;


                if (this.details.cartCount !== undefined) {
                    this.details.cartCount = <string[]>ArrayUtils.toRangeArray(<string>this.details.cartCount, true);
                }

            this.products = res.items.set5.map(item => {
                item.quantity = item.quantity || 0;
                item.cartId = 1;
                return item;
            });
            } else {
                this.products = [];
            }
            if (res.items.set6.length > 0) {
                this.deliveryMethods = res.items.set6.map(item => {
                    item.no = item.no;
                    item.name = item.name;
                    return item;
                })
            } else {
                this.deliveryMethods = []
            }
            this.paginationRepo.pagination.isNextPage = res.hasMore;

            return res;

        });

    }


    getDefaultParams(): b2b.PromotionDetailsDefaultParams {
        //why allways hardcoded??

        return {
            groupId: '0',
            filter: '',
            isNameFiltered: 'true',
            isCodeFiltered: 'false',
            isProducerFiltered: 'false',
            isDescriptionFiltered: 'false',
            isBrandFiltered: 'false',
            brandId: '0',
            warehouseId: '0',
            onlyAvailable: 'false',
            filterInGroup: 'false',
            features: '',
            attributes: '',
            getFilter: 'true',
            updateFilter: 'false',
        };
    }

}
