import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/merge';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';
import { ArrayUtils } from '../../helpers/array-utils';
import { CartsService } from '../../model/carts.service';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import { InquiryDetailsService } from '../../model/inquiry-details.service';
import { QuoteDetailsService } from '../../model/quote-details.service';
import { OrderDetailsService } from '../../model/order-details.service';
import { PaymentDetailsService } from '../../model/payment-details.service';
import { DeliveryDetailsService } from '../../model/delivery-details.service';
import { ComplaintDetailsService } from '../../model/complaint-details.service';
import { ComplaintsService } from '../../model/complaints.service';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { NgForm } from '@angular/forms';
import { UrlSegment } from '@angular/router/src/url_tree';

@Component({
    selector: 'app-document-details',
    templateUrl: './document-details.component.html',
    styleUrls: ['./document-details.component.scss'],
    host: { class: 'app-document-details' },
    encapsulation: ViewEncapsulation.None
})
export class DocumentDetailsComponent implements OnInit, OnDestroy {

    url: string;
    id: number;
    detailsContext: InquiryDetailsService & QuoteDetailsService & OrderDetailsService & PaymentDetailsService & DeliveryDetailsService & ComplaintDetailsService & ComplaintsService & PromotionDetailsService;
    r: ResourcesService;
    type?: number;
    backMenuItem: b2b.MenuItem;
    zamowienieParsed = [];

    private activatedRouteSubscription: Subscription;

    detailsVisibility: boolean;
    confirmModalVisibility: boolean;

    listLoading?: boolean;

    selectedKey?: number;
// JD
   promotionContext: boolean;

    @ViewChild('promotionProductForm')
    searchForm: NgForm;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        private cartsService: CartsService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.selectedKey = 1;

        this.activatedRouteSubscription = Observable.merge(this.activatedRoute.params, this.activatedRoute.data, this.activatedRoute.url)
            .subscribe((res: any) => {

                if (res.id || Object.keys(res).length === 0) {
                    this.id = Number(res.id || 0);
                }

                if (res.type) {
                    this.type = Number(res.type);
                }

                if (res.detailsContext) {
                    this.detailsContext = res.detailsContext;
                }

                if (res instanceof Array) {
                    this.url = res[0].path;
    // JD
                   if (this.url === 'Promotions') {
                       this.promotionContext = true;
                   } else {
                       this.promotionContext = false;
                   }

                }

                if (this.id !== undefined && this.detailsContext !== undefined && this.url !== undefined) {

                    this.detailsContext.loadDetails(this.id, this.type).then((res) => {

                        if (res.set4[0].zamowienie) {
                            this.zamowienieParsed = JSON.parse(res.set4[0].zamowienie);
                        }
                    });

                    this.listLoading = true;
                    this.menuService.loadFullMenuItems().then(() => {
                        this.backMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => item.url.toLowerCase().includes(this.url.toLowerCase())));
                        this.backMenuItem = this.menuService.convertLabelToBack(this.backMenuItem, 'back');
                        this.listLoading = false;
                        this.detailsContext.products = undefined;
                    });
                }

            });

    }

    changeVisibility(section: 'details' | 'confirmModal', isVisible?: boolean) {

        if (section === 'details') {
            this.detailsVisibility = (isVisible === undefined) ? !this.detailsVisibility : isVisible;

        } else if (section === 'confirmModal') {
            this.confirmModalVisibility = (isVisible === undefined) ? !this.confirmModalVisibility : isVisible;
        }

    }
// JD
    search(formValid, formValue) {
        this.listLoading = true;
        if (formValid) {
            this.detailsContext.filter = formValue.searchPhrase;
            this.detailsContext.loadDetails(this.id).then(() => {
                this.listLoading = false;
            });
        } else {
            this.detailsContext.loadDetails(this.id).then(() => {
                this.listLoading = false;
            });
        }
    }


    ngOnDestroy(): void {

        this.activatedRouteSubscription.unsubscribe();


    }



}
