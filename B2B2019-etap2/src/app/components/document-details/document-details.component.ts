
import { Subscription, combineLatest } from 'rxjs';
import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';
import { InquiryDetailsService } from '../../model/inquiry-details.service';
import { QuoteDetailsService } from '../../model/quote-details.service';
import { OrderDetailsService } from '../../model/order-details.service';
import { PaymentDetailsService } from '../../model/payment-details.service';
import { DeliveryDetailsService } from '../../model/delivery-details.service';
import { ComplaintDetailsService } from '../../model/complaint-details.service';
import { ComplaintsService } from '../../model/complaints.service';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { HttpErrorResponse } from '@angular/common/http';
import { InquiriesService } from '../../model/inquiries.service';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-document-details',
    templateUrl: './document-details.component.html',
    styleUrls: ['./document-details.component.scss'],
    host: { class: 'app-document-details' },
    encapsulation: ViewEncapsulation.None
})
export class DocumentDetailsComponent implements OnInit, OnDestroy, AfterViewInit {

    url: string;
    url2: string;
    id: number;
    detailsContext: InquiryDetailsService & QuoteDetailsService & OrderDetailsService & PaymentDetailsService & DeliveryDetailsService & ComplaintDetailsService & ComplaintsService & PromotionDetailsService;
    r: ResourcesService;
    type?: number;
    backMenuItem: b2b.MenuItem;

    private activatedRouteSubscription: Subscription;

    detailsVisibility: boolean;
    confirmModalVisibility: boolean;

    selectedKey?: number;

    remove: Function;
    close: Function;
    confirm: Function;
    message: string;

    changePage: Function;

    detailsConfig: b2b.CustomerConfig & b2b.Permissions;

     // JD
     onlySpacesInSearchForm = false;
     private formSubscription = new Subscription;
 
     @ViewChild('promotionProductForm')
     searchForm: NgForm;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        private router: Router
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.selectedKey = 1;

        this.activatedRouteSubscription = combineLatest(this.activatedRoute.params, this.activatedRoute.data).subscribe(res => {
            const routeParams = res[0];
            this.configService.loaderSubj.next(true);
            this.id = Number(routeParams.id || 0);
            this.type = Number(routeParams.type);
            this.url = this.activatedRoute.pathFromRoot.map(el => el.routeConfig ? el.routeConfig.path.split('/')[0] : '').join('/');
            this.message = null;


            this.detailsContext = res[1].detailsContext;

            if (this.detailsContext.remove) {

                this.remove = () => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.remove();
                };

            }

            if (this.detailsContext.close) {

                this.close = () => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.close();
                };

            }

            if (this.detailsContext.confirm) {

                this.confirm = () => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.confirm().then(() => {
                        this.configService.loaderSubj.next(false);
                    });
                };
            }

            if (this.detailsContext.paginationRepo) {

                this.changePage = (currentPage) => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.paginationRepo.changePage(currentPage);
                    this.loadDetails(this.id, this.type).then(() => {
                        this.configService.loaderSubj.next(false);
                    });
                };
            }

            this.menuService.loadFullMenuItems().then(() => {
                this.backMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => item.url.includes(this.url)));
                this.backMenuItem = this.menuService.convertLabelToBack(this.backMenuItem, 'back');
                if (this.detailsContext instanceof PromotionDetailsService) {
                    this.backMenuItem = {
                        resourceKey: 'backToList',
                        cssClass: 'back',
                        url: '/promotions',
                        position: 0
                    };
                }
            });

            this.loadDetails(this.id, this.type);


        });

    }

    ngAfterViewInit() {
        //JD request after form input 'x' click
        if (this.detailsContext instanceof PromotionDetailsService) {
            this.formSubscription.add(this.searchForm.valueChanges.subscribe(x => {
                if (this.searchForm.dirty && x.searchPhrase === '') {
                        this.detailsContext.filter = '';
                        this.loadDetails(this.id, this.type);
                    }
                })
            );
        }
    }

    changeVisibility(section: 'details' | 'confirmModal', isVisible?: boolean) {

        if (section === 'details') {
            this.detailsVisibility = (isVisible === undefined) ? !this.detailsVisibility : isVisible;

        } else if (section === 'confirmModal') {
            this.confirmModalVisibility = (isVisible === undefined) ? !this.confirmModalVisibility : isVisible;
        }

    }

    loadDetails(id = this.id, type = this.type): Promise<any> {

        return this.detailsContext.loadDetails(id, type).then(() => {

            this.detailsConfig = Object.assign({}, this.configService.config, this.configService.permissions);

            if (this.detailsContext instanceof InquiriesService) {
                this.detailsConfig.showImages = false;
            }

            this.configService.loaderSubj.next(false);

             //JD
             if (this.detailsContext.products.length === 0 && !(this.detailsContext instanceof PromotionDetailsService)) {
                //no products received when user has no permission to the document
                this.router.navigate([this.configService.routePaths.home]);
                return;
            }

        }).catch((err: HttpErrorResponse) => {

            this.configService.loaderSubj.next(false);

            if (!this.configService.isOnline && this.id !== this.detailsContext.id) {
                //offline and old data
                this.detailsContext = <any>{};
                this.message = this.r.translations.noDataInOfflineMode;

            }
        });
    }

      // JD
      search(formValid, formValue) {
        if (formValid) {
            this.detailsContext.filter = formValue.searchPhrase;
            this.loadDetails(this.id, this.type);
        }
    }
    searchInputKeyPress(event) {
        const trimmedValue = event.target.value.trim();
        (trimmedValue.length > 0) ? this.onlySpacesInSearchForm = false : this.onlySpacesInSearchForm = true;
    }

    ngOnDestroy(): void {

        this.activatedRouteSubscription.unsubscribe();
        this.formSubscription.unsubscribe();

    }



}
