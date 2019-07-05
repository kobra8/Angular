import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './shared/pagination-repo';
import { b2b } from '../../b2b';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';


@Injectable()
export class PromotionDetailsService extends DocumentDetails {

    id: number;
    paginationRepo: PaginationRepo;
  //  details: b2b.PromotionDetails;
    params: b2b.PromotionDetailsDefaultParams;
    products: b2b.PromotionProduct[];
    columns: b2b.ColumnConfig[];
    config: b2b.Permissions & b2b.CustomerConfig;
    //JD
    states: Map<number, string>;
    headerResource: string;
    filter = '';
    deliveryMethods: b2b.PromotionDeliveryMethod[];

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        accountService: AccountService
        ) {
        super(httpClient, configService, accountService);

        this.headerResource = 'promotionDetails';

        this.paginationRepo = new PaginationRepo();
        this.params = this.getDefaultParams();

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'threshold' },
            { property: 'value', type: 'promotionValue' },
            {
                property: 'type', translation: 'discountType', type: 'cases', cases: [
                    { case: 1, translation: 'percentage' },
                    { case: 2, translation: 'discountValue' },
                    { case: 3, translation: 'fixedPrice' }
                ]
            },
            {
                property: 'vatDirection', translation: 'priceType', type: 'cases', cases: [
                    { case: 'N', translation: 'net' },
                    { case: 'B', translation: 'gross' }
                ]
            },
            { property: 'addToCart', translation: '', type: 'addToCart' }
        ];
    }

    protected requestDetails(id = this.id): Promise<b2b.PromotionDetailsResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        const params = Object.assign(
            this.params,
            { skip: paginationParams.skip, top: paginationParams.top }
        );
        //JD
        this.params.filter = this.filter;

        return this.httpClient.get<b2b.PromotionDetailsResponse>('/api/promotions/' + id, { params: params }).toPromise();
    }


    loadDetails(id = this.id): Promise<b2b.PromotionDetailsResponse> {
        console.log('Load details in service fired');
        const detailsPromise = this.requestDetails(id);
        const configPromise = this.configService.allConfigsPromise;

       return Promise.all([detailsPromise, configPromise]).then((res) => {
           console.log('Load details ins service promise all resolved');
      //  return super.loadDetails(id).then((res) => {
            const detailsRes = res[0];

            this.config = Object.assign({}, this.configService.permissions, this.configService.config, { calculateDiscount: true, showState: false });

            this.id = id;
          //  this.details = detailsRes.items.set4[0];
            //JD
            if (detailsRes.items.set5.length > 0) {
             //   this.details.calculateDiscount = true;

            if (this.details.cartCount !== undefined) {
                this.details.cartCount = ArrayUtils.toRangeArray(<any>detailsRes.items.set4[0].cartCount, true);
            }

            this.products = detailsRes.items.set5.map(item => {
                item.quantity = item.quantity || 0;
                item.cartId = 1;
                return item;
            });
        } else {
            this.products = [];
        }
            //JD
            if (detailsRes.items.set6.length > 0) {
                this.deliveryMethods = detailsRes.items.set6.map(item => {
                    item.no = item.no;
                    item.name = item.name;
                    return item;
                })
            } else {
                this.deliveryMethods = [];
            }


            this.paginationRepo.pagination.isNextPage = detailsRes.hasMore;

            return detailsRes;
        });

    }


    getDefaultParams(): b2b.PromotionDetailsDefaultParams {

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
