
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
import { ComplaintsService } from '../../model/complaints.service';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CartsService } from 'src/app/model/carts.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { ModalMessageType } from 'src/app/model/shared/enums/modal-message-type';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';

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

    selectedKey?: number;

    remove: Function;
    confirm: Function;
    message: string;
    error: string;

    changePage: Function;

    detailsConfig: b2b.CustomerConfig & b2b.Permissions & { fromQuote?: number };

    private cartsService?: CartsService;
    cartsToCopy: number[];

    private cartsForArticlesChanged: Subscription;

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

            if (this.configService && this.configService.permissions && this.configService.permissions.hasAccessToCart && this.detailsContext && this.detailsContext.details && !this.detailsContext.details.copyToCartDisabled) {
                this.loadCartsToCopy();
                this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForArticlesChanged.subscribe((res) => {
                    this.setCartsToCopyWithSelectedKey(res);
                    this.changeDetector.markForCheck();
                });
            }

            this.detailsConfig = Object.assign({}, this.configService.config, this.configService.permissions);

            if (this.detailsContext instanceof InquiryDetailsService) {
                this.detailsConfig.showImages = false;
            }

            if (this.detailsContext instanceof QuoteDetailsService) {
                this.detailsConfig.fromQuote = this.id;
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
            this.showNoAvailableCartsToCopyMessageInModal();
            return;
        }
        this.error = null;
        this.configService.loaderSubj.next(true);

        this.detailsContext.copyToCart(cartId).catch((err: HttpErrorResponse) => {

            if (err.status === 403) {
                this.error = this.r.translations.forbiddenProductsWhileCopying;
            }

            this.configService.loaderSubj.next(false);
        });
    }

    private loadCartsToCopy() {
        this.commonAvailableCartsService.getCartsForArticles().then((res) => {
            this.setCartsToCopyWithSelectedKey(res);
            this.changeDetector.markForCheck();
        });
    }

    private setCartsToCopyWithSelectedKey(carts: number[]) {
        this.cartsToCopy = carts;
        if (this.cartsToCopy === null || this.cartsToCopy.length < 1) {
            this.selectedKey = null;
            return;
        }

        if (!this.cartsToCopy.includes(this.selectedKey)) {
            this.selectedKey = this.cartsToCopy[0];
        }
    }

    onOpenCopyToCartSelect(cartId: number) {
        if (!cartId) {
            this.showNoAvailableCartsToCopyMessageInModal();
            return;
        }
    }

    private showNoAvailableCartsToCopyMessageInModal() {
        this.commonModalService.showModalMessageType(ModalMessageType.noAvailableCartsToAddArticle);
    }

    showErrorMessage(errorMessage: string) {
        this.error = errorMessage;
    }


    ngOnDestroy(): void {

        this.activatedRouteSubscription.unsubscribe();

        if (this.cartsForArticlesChanged) {
            this.cartsForArticlesChanged.unsubscribe();
        }
    }
}
