
import { Subscription, Subject, combineLatest } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChildren, QueryList, ElementRef, ViewChild, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { MenuService } from '../../model/menu.service';
import { OrdersService } from '../../model/orders.service';
import { InquiriesService } from '../../model/inquiries.service';
import { QuotesService } from '../../model/quotes.service';
import { PaymentsService } from '../../model/payments.service';
import { ComplaintsService } from '../../model/complaints.service';
import { DeliveryService } from '../../model/delivery.service';
import { PendingService } from '../../model/pending.service';
import { FloatingLabelInputComponent } from '../../controls/floating-label-input/floating-label-input.component';
import { ConfigService } from '../../model/config.service';
import { PermissionHelper } from '../../helpers/permission-helper';
import { DateHelper } from '../../helpers/date-helper';
import { HttpErrorResponse } from '@angular/common/http';
import { ConvertingUtils } from '../../helpers/converting-utils';
import { OrderDetailsService } from 'src/app/model/order-details.service';
import { ComplaintProductsService } from 'src/app/model/complaint-products.service';
import { CustomerFilesService } from 'src/app/model/customer-files.service';

/**
 * Component for old customer lists (before swagger and refactoring api)
 * */
@Component({
    selector: 'app-documents-list',
    templateUrl: './documents-list.component.html',
    styleUrls: ['./documents-list.component.scss'],
    host: { 'class': 'app-documents-list' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentsListComponent implements OnInit, OnDestroy {

    @HostBinding('class.view-with-sidebar')
    isSidebar: boolean;

    private activatedRouteSubscription: Subscription;

    listContext: OrdersService & InquiriesService & QuotesService & PaymentsService & ComplaintsService & DeliveryService & PendingService & ComplaintProductsService & CustomerFilesService;
    listLoading: boolean;

    url: string;
    currentMenuItem: b2b.MenuItem;
    backMenuItem: b2b.MenuItem;

    r: ResourcesService;

    @ViewChildren('textFilterInput')
    textFilterInputs: QueryList<FloatingLabelInputComponent>;

    @ViewChild('dateFrom', { static: false })
    dateFromInput: ElementRef<HTMLInputElement>;

    @ViewChild('dateTo', { static: false })
    dateToInput: ElementRef<HTMLInputElement>;

    //filters watcher
    private filtersSubject: Subject<b2b.ControlFiltersParams & { filterParam: any }>;
    private filtersSub: Subscription;

    states: Map<number, string>;

    message: string;

    emptyListMessage: b2b.EmptyListInfoElement;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        public menuService: MenuService,
        public changeDetector: ChangeDetectorRef,
        private router: Router
    ) {
        this.r = resourcesService;
        this.filtersSubject = new Subject<b2b.ControlFiltersParams & { filterParam: any }>();

    }

    ngOnInit() {

        this.activatedRouteSubscription = this.activatedRoute.data.subscribe(res => {

            this.listContext = res.listContext;

            if (this.listContext === undefined) {
                if (this.configService.permissions.hasAccessToOrdersList) {
                    this.router.navigate([this.menuService.routePaths.orders]);
                } else {
                    this.router.navigate([this.menuService.profileSidebar[0].url]);
                }
                return;
            }

            this.url = this.activatedRoute.pathFromRoot.map(el => el.routeConfig ? el.routeConfig.path.split('/')[0] : '').join('/');

            
            this.isSidebar = !(this.listContext instanceof PendingService);

            if (this.listContext.items && this.listContext.items.length === 0) {
                this.emptyListMessage = this.getEmptyListInfo();
            }

            if (this.listContext instanceof PaymentsService) {

              
                const config = Object.assign({}, this.configService.permissions, this.configService.config);
                const oldColumnsLength = this.listContext.columns.length;

                this.listContext.columns = PermissionHelper.removeForbiddenColumns(this.listContext.columns, config);

                if (oldColumnsLength !== this.listContext.columns.length) {
                    this.changeDetector.markForCheck();
                }
            }


            this.loadList(undefined, undefined, undefined).then(() => {
                this.changeDetector.markForCheck();
            });


            //set back menu item
            this.backMenuItem = this.menuService.defaultBackItem;

            this.menuService.loadFullMenuItems().then(() => {

                if (this.router.url === this.menuService.routePaths.complaintItems) {

                    this.currentMenuItem = Object.assign(
                        {},
                        this.menuService.fullMenuItems.find(item => item.url === this.menuService.routePaths.complaints)
                    );

                    this.currentMenuItem.resourceKey = 'purchaseDocumentByRange';

                } else {

                    this.currentMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => item.url.includes(this.url)));

                }

                this.changeDetector.markForCheck();

            });

        });



        //watching filter changes and debounce timing for changes
        this.filtersSub = this.filtersSubject.pipe(debounceTime(1000)).subscribe((res) => {
           
            this.listContext.setCurrentFilter(res.filterParam);

            if (this.listContext.pagination) {
                this.listContext.pagination.goToStart();
            }
            this.loadList(res.getFilter, res.updateFilter, res.controlDate).then(() => {
                this.changeDetector.markForCheck();
            });

        });

    }


    changePage(currentPage) {
        this.listContext.pagination.changePage(currentPage);
        this.loadList(false, false);
    }

    /**
     * Updates current filter with given params.
     * Supported method calls:
     * updateFilter(key, value)
     * updateFilter([key, value])
     * updateFilter([[key1, value1], [key2, value2], ...])
     */
    updateFilter(filterKeyOrArray: string | string[] | [string, string][], filterValue?: string) {

       

        let filterParam;

        if (filterKeyOrArray instanceof Array) {
            filterParam = ConvertingUtils.paramsArrayToObject<any>(filterKeyOrArray);
        } else {
            filterParam = {};
            filterParam[filterKeyOrArray] = filterValue;
        }

        if (filterParam.statusId !== undefined) {
            filterParam.statusId = Number(filterParam.statusId);
        }

        if (filterParam.stateId !== undefined) {
            filterParam.stateId = Number(filterParam.stateId);
        }

        if (filterParam.currencyId) {
            const currency = this.listContext.filters.currency.find(currency => currency.id === filterParam.currencyId);
            filterParam.currencyName = currency ? currency.name : '';

        } else if (this.listContext.filters.currentFilter.currencyName) {
            filterParam.currencyName = '';
        }

        for (const param in filterParam) {
            if (filterParam[param] !== this.listContext.filters.currentFilter[param]) {

                //update when at least one parameter differs from current filter state
                this.filtersSubject.next({ getFilter: false, updateFilter: true, filterParam: filterParam });
                return;
            }
        }


    }


    /**
     * Fixing wrong validation of native date controls. They doesn't respect min, max and required values for direct input.
     * Validators respected only for setting data via datapicker. 
     */
    updateDateWithGuardian(value, dateInputType: 'dateFrom' | 'dateTo'): boolean {

        if (!DateHelper.isValid(value)) {

            if (dateInputType === 'dateFrom') {
                this.dateFromInput.nativeElement.value = DateHelper.dateToString(this.listContext.filters.currentFilter.dateFrom);
                return false;
            }

            if (dateInputType === 'dateTo') {
                this.dateToInput.nativeElement.value = DateHelper.dateToString(this.listContext.filters.currentFilter.dateTo);
                return false;
            }

            return false;
        }


        if (dateInputType === 'dateFrom') {
            this.listContext.filters.currentFilter.dateFrom = new Date(value);
            this.filtersSubject.next({ getFilter: false, updateFilter: true, filterParam: { dateFrom: this.listContext.filters.currentFilter.dateFrom } });
            return true;
        }

        if (dateInputType === 'dateTo') {
            this.listContext.filters.currentFilter.dateTo = new Date(value);
            this.filtersSubject.next({ getFilter: false, updateFilter: true, filterParam: { dateTo: this.listContext.filters.currentFilter.dateTo } });
            return true;
        }

        return true;

    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<void> {

        this.message = null;
        this.emptyListMessage = null;

        this.configService.loaderSubj.next(true);

        return this.listContext.loadList(getFilter, updateFilter, controlDate).then(() => {

            if (this.listContext.items && this.listContext.items.length === 0) {
                this.emptyListMessage = this.getEmptyListInfo();
            }

            this.configService.loaderSubj.next(false);

            this.changeDetector.markForCheck();

        }).catch((err: HttpErrorResponse) => {

            if (typeof err.message === 'string') {
                this.message = err.message;
            }

            this.configService.loaderSubj.next(false);

            if (!this.configService.isOnline && this.listContext.items === undefined) {
                this.message = this.r.translations.noDataInOfflineMode;
            }

            if (err.status === 403 || err.status === 405) {
                this.emptyListMessage = this.getEmptyListInfo();
                this.emptyListMessage.resx = 'forbidden';
            }

            this.changeDetector.markForCheck();

        });
    }

    lazyLoadFilterValues(requestPromise?: Function) {
        if (requestPromise) {
            requestPromise().then(() => {
                this.changeDetector.markForCheck();
            });
        }
    }


    trackByFn(i, el) {
        return el.id || i;
    }

    getEmptyListInfo() {

        if (<any>this.listContext instanceof ComplaintsService) {
            return { resx: 'noComplaints', svgId: 'Complaints' };
        }
        if (<any>this.listContext instanceof ComplaintProductsService) {
            return { resx: 'noComplaintProducts', svgId: 'ComplaintProducts' };
        }
        if (<any>this.listContext instanceof DeliveryService) {
            return { resx: 'noDelivery', svgId: 'Delivery' };
        }
        if (<any>this.listContext instanceof InquiriesService) {
            return { resx: 'noInquiries', svgId: 'Inquiries' };
        }
        if (<any>this.listContext instanceof OrdersService) {
            return { resx: 'noOrders', svgId: 'Orders' };
        }
        if (<any>this.listContext instanceof PaymentsService) {
            return { resx: 'noPayments', svgId: 'Payments' };
        }
        if (<any>this.listContext instanceof PendingService) {
            return { resx: 'noPending', svgId: 'Pending' };
        }
        if (<any>this.listContext instanceof QuotesService) {
            return { resx: 'noQuotes', svgId: 'Quotes' };
        }
        if (<any>this.listContext instanceof CustomerFilesService) {
            return { resx: 'noFiles', svgId: 'Files' };
        }
    }

    getItemHref(listItem) {
   
        if (<any>this.listContext instanceof PendingService || <any>this.listContext instanceof ComplaintProductsService) {
            return this.configService.permissions.hasAccessToArticleList && `${this.menuService.routePaths.itemDetails}/${listItem.itemId}`;
        }

        if (<any>this.listContext instanceof PaymentsService) {
            return `${this.menuService.routePaths.paymentDetails}/${listItem.id}/${listItem.type}`;
        }

        if (<any>this.listContext instanceof CustomerFilesService) {
            return this.listContext.hrefCreator(listItem);
        }

        return `${this.url}/${listItem.id}`;


    }


    resetAllFilters() {
        this.listContext.filters.currentFilter = <any>this.listContext.getDefaultFilter();
        if (this.listContext.pagination) {
            this.listContext.pagination.goToStart();
        }
        this.loadList();
    }

    ngOnDestroy() {
        this.activatedRouteSubscription.unsubscribe();
        this.filtersSubject.unsubscribe();
        this.filtersSub.unsubscribe();
    }
}
