import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConvertingUtils } from '../helpers/converting-utils';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';
import { ConfigService } from './config.service';
import { PromotionType } from './enums/promotion-type.enum';
import { ResourcesService } from './resources.service';


@Injectable()
export class PromotionsService {

    items: b2b.PromotionsListItem[];
    logoutSub: Subscription;

    constructor(
        private httpClient: HttpClient,
        private accountService: AccountService,
        private configService: ConfigService,
        private r: ResourcesService
    ) {

        this.logoutSub = this.accountService.logOutSubj.subscribe(() => {
            this.items = undefined;
        });
    }


    protected requestList(): Promise<b2b.PromotionsListResponse> {
        return this.httpClient.get<b2b.PromotionsListResponse>('/api/promotions/').toPromise();
    }

    loadList(): Promise<void> {

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

            return Promise.resolve();

        }).catch((err: HttpErrorResponse) => {
            return Promise.reject(err);
        });
    }
}
