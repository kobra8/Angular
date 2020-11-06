import { Subscription, combineLatest } from 'rxjs';
import { Component, OnInit, ViewEncapsulation, OnDestroy, Injector, ChangeDetectorRef } from '@angular/core';
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
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { BoxMessageType } from '../../model/shared/enums/box-message-type.enum';
import { CommonAvailableCartsService } from '../../model/shared/common-available-carts.service';
import { b2bShared } from 'src/integration/b2b-shared';

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
    detailsContext: InquiryDetailsService & QuoteDetailsService & OrderDetailsService & PaymentDetailsService & DeliveryDetailsService & ComplaintDetailsService & PromotionDetailsService;
    r: ResourcesService;
    type?: number;
    backMenuItem: b2b.MenuItem;

    private activatedRouteSubscription: Subscription;

    detailsVisibility: boolean;
    confirmModalVisibility: boolean;

    remove: Function;
    confirm: Function;
    message: string;
    error: string;

    changePage: Function;

    detailsConfig: b2b.CustomerConfig & b2b.Permissions & { fromQuote?: number } & b2bShared.ProductTableConfig;

    private availableCartsSub: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        private router: Router,
        private injector: Injector,
        private changeDetector: ChangeDetectorRef,
        private commonModalService: CommonModalService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {
        this.activatedRouteSubscription = combineLatest([this.activatedRoute.params, this.activatedRoute.data]).subscribe(res => {
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

            if (this.detailsContext.confirm) {

                this.confirm = () => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.confirm().then(() => {
                        this.configService.loaderSubj.next(false);
                    });
                };
            }

            if (this.detailsContext.pagination) {

                this.changePage = (currentPage) => {
                    this.configService.loaderSubj.next(true);
                    this.detailsContext.pagination.changePage(currentPage);
                    this.loadDetails(this.id, this.type).then(() => {
                        this.configService.loaderSubj.next(false);
                    });
                };
            }

            this.menuService.loadFullMenuItems().then(() => {
                this.backMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => this.url.includes(item.url)));
                this.backMenuItem = this.menuService.convertLabelToBack(this.backMenuItem, 'back');
            });


            this.loadDetails(this.id, this.type);

            this.availableCartsSub = this.commonAvailableCartsService.availableCartsStatusChanged.subscribe(res => {
                if (res.isPermissionToCreateNewCart) {
                    if (this.detailsContext.detailsBoxMessages && this.detailsContext.detailsBoxMessages.messages.includes(BoxMessageType.MaxNumberOfCartsReached)) {
                        this.detailsContext.detailsBoxMessages = undefined;
                    }
                }
            });
        });

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

            if (this.detailsContext instanceof InquiryDetailsService) {
                this.detailsConfig.showImages = false;
            }

            if (this.detailsContext instanceof QuoteDetailsService) {
                this.detailsConfig.fromQuote = this.id;
            }

            if (this.detailsContext instanceof OrderDetailsService) {
                this.detailsConfig.haveProductsDescription = true;
            }

            this.configService.loaderSubj.next(false);

            if (this.detailsContext.productsOrDetails.length === 0) {
                //no products received when user has no permission to the document
                this.router.navigate([this.menuService.routePaths.home]);
                return;
            }

        }).catch((err: HttpErrorResponse) => {

            this.configService.loaderSubj.next(false);

            if (!this.configService.isOnline && this.id !== this.detailsContext.id) {
                //offline and old data
                this.detailsContext = <any>{};
                this.error = this.r.translations.noDataInOfflineMode;

            }

            if (err.status === 405 || err.status === 403) {
                this.error = this.r.translations.forbidden;
            }

            if (err.status === 404) {
                this.error = this.r.translations.documentNotFound;
            }
        });
    }


    copyToCart(cartId: number) {
        if (!cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }
        this.error = null;
        this.configService.loaderSubj.next(true);

        this.detailsContext.copyToCart(cartId).then(() => {
            this.configService.loaderSubj.next(false);

        }).catch((err: HttpErrorResponse) => {
            if (err.status === 403) {
                this.error = this.r.translations.forbiddenProductsWhileCopying;
            }

            this.configService.loaderSubj.next(false);
        });
    }

    showErrorMessage(errorMessage: string) {
        this.error = errorMessage;
    }

    ngOnDestroy(): void {
        this.availableCartsSub.unsubscribe();
        this.detailsContext.clearDetailsBoxMessages();
        this.activatedRouteSubscription.unsubscribe();
    }
}
