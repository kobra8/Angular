import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { PromotionsService } from '../../model/promotions.service';
import { ResourcesService } from '../../model/resources.service';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { b2b } from '../../../b2b';

@Component({
    selector: 'app-promotions',
    templateUrl: './promotions.component.html',
    styleUrls: ['./promotions.component.scss'],
    host: {class: 'app-promotions'},
    encapsulation: ViewEncapsulation.None
})
export class PromotionsComponent implements OnInit {

    r: ResourcesService;
    activePromotionId: number; 
    message: string;

    // JD

    constructor(
        resourcesService: ResourcesService,
        public promotionsService: PromotionsService,
        public promotionDetailsService: PromotionDetailsService,
        private configService: ConfigService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {
        this.promotionsService.paginationRepo.changePage(0);
        if (!this.promotionsService.loadedOnce) {
            this.loadList(true, true, true);
        }

    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<b2b.PromotionListResponse | null> {

        this.configService.loaderSubj.next(true);

        return this.promotionsService.loadList(getFilter, updateFilter, controlDate).then((res) => {
            this.message = null;
            
            if (this.promotionsService.items.length > 0) {
                this.configService.loaderSubj.next(false);
            // JD
                this.promotionsService.loadedOnce = true;

                this.activePromotionId = this.promotionsService.items[0].id;
            // JD
             //   this.loadDetails(this.activePromotionId).then(() => {
            //    });

            } else {
                this.promotionDetailsService.products = [];
                this.configService.loaderSubj.next(false);
            }

            return res;

        }).catch(() => {

            if (!this.configService.isOnline && (this.promotionsService.items === undefined || this.promotionDetailsService.products === undefined)) {
                this.message = this.r.translations.noDataInOfflineMode;
            }

            this.configService.loaderSubj.next(false);

            return null;
        });
    }

    loadDetails(id = this.activePromotionId): Promise<b2b.PromotionDetailsResponse | null> {

        this.configService.loaderSubj.next(true);

        return this.promotionDetailsService.loadDetails(id).then(() => {

            this.configService.loaderSubj.next(false);

        }).catch(() => {

            if (!this.configService.isOnline && this.promotionDetailsService.products === undefined) {
                this.message = this.r.translations.noDataInOfflineMode;
            }
            this.configService.loaderSubj.next(false);
            return null;
        });
    }

    changePage(pageNumber) {
        this.promotionsService.paginationRepo.changePage(pageNumber);
        this.loadList(true, true, true);
    }

    changeDetailsPage(pageNumber) {

        this.promotionDetailsService.paginationRepo.changePage(pageNumber);

        this.loadDetails(this.activePromotionId);
    }

    

    setActive(id) {
        if (id !== this.activePromotionId) {
            this.activePromotionId = id;
            this.promotionDetailsService.products = undefined;
            this.promotionDetailsService.paginationRepo.changePage(0);
            this.loadDetails(this.activePromotionId);
        } 
    }
  

}
