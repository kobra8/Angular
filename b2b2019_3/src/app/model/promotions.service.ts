import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ArrayUtils } from '../helpers/array-utils';
import { ConvertingUtils } from '../helpers/converting-utils';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';
import { ConfigService } from './config.service';
import { PromotionType } from './enums/promotion-type.enum';
import { ResourcesService } from './resources.service';
import { OldPagination } from './shared/old-pagination';


@Injectable()
export class PromotionsService {

    pagination: OldPagination;
    items: b2b.PromotionsListItem[];
    config: b2b.PromotionsConfig;
    carts: number[];

    logoutSub: Subscription;

    constructor(
        private httpClient: HttpClient,
        private accountService: AccountService,
        private configService: ConfigService,
        private r: ResourcesService
    ) {

        this.pagination = new OldPagination();

        this.logoutSub = this.accountService.logOutSubj.subscribe(() => {
            this.items = undefined;
            this.config = undefined;
            this.carts = undefined;
        });
    }


    protected requestList(): Promise<b2b.PromotionsListResponse> {

        const paginationParams = this.pagination.getRequestParams();

        return this.httpClient
            .get<b2b.PromotionsListResponse>('/api/promotions/', { params: <any>paginationParams })
            .toPromise();
    }

    loadList(): Promise<b2b.PromotionsList> {

        return Promise.all([this.r.translationsPromise, this.requestList()]).then(res => {

            const promotionsRes = res[1];

            this.items = promotionsRes.set1.map(promo => {
                if (promo.cyclicity && promo.cyclicity.values) {
                    promo.cyclicity.values = promo.cyclicity.values.map(val => {
                        return ConvertingUtils.lowercaseFirstLetter(val);
                    });
                }

                if (this.configService.applicationId === 1) {

                    let newType = 0;

                    if (promo.type === 7 || promo.type === 9) {
                        newType = PromotionType.PLT;
                    } else {
                        newType = PromotionType.PRM;
                    }

                    promo.type = newType;

                } else {

                    if (promo.type === PromotionType.KNT || promo.type === PromotionType.PLT) {
                        promo.name = this.r.translations[ConvertingUtils.lowercaseFirstLetter(promo.name)];
                    }
                }
                return promo;
            });

            this.config = Object.assign(promotionsRes.set2[0], { cartCount: ArrayUtils.toRangeArray(promotionsRes.set2[0].cartCount, true) });

            this.pagination.changeParams({
                hasMore: promotionsRes.hasMore
            });

            return Object.assign({}, promotionsRes, { set2: [this.config] });

        }).catch((err: HttpErrorResponse) => {
            return Promise.reject(err);
        });


    }

}
