
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

    listContext: OrdersService & InquiriesService & QuotesService & PaymentsService & ComplaintsService & DeliveryService & PendingService & any;
    listLoading: boolean;

    url: string;
    currentMenuItem: b2b.MenuItem;
    backMenuItem: b2b.MenuItem;

    r: ResourcesService;

    @ViewChildren('textFilterInput')
    textFilterInputs: QueryList<FloatingLabelInputComponent>;

    @ViewChild('dateFrom')
    dateFromInput: ElementRef<HTMLInputElement>;

    @ViewChild('dateTo')
    dateToInput: ElementRef<HTMLInputElement>;

    //filters watcher
    private filtersSubject: Subject<b2b.ControlFiltersParams & { filterParam: any }>;
    private filtersSub: Subscription;

    states: Map<number, string>;

    message: string;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        public changeDetector: ChangeDetectorRef,
        private router: Router
    ) {
        this.r = resourcesService;
        this.filtersSubject = new Subject<b2b.ControlFiltersParams & { filterParam: any }>();

    }

    ngOnInit() {

        this.changeDetector.detach();

        this.activatedRouteSubscription = combineLatest(this.activatedRoute.data).subscribe(res => {

            this.changeDetector.detach();

            this.url = this.activatedRoute.pathFromRoot.map(el => el.routeConfig ? el.routeConfig.path.split('/')[0] : '').join('/');

            this.listContext = res[0].listContext;
            this.isSidebar = !(this.listContext instanceof PendingService);

            if (this.listContext instanceof PaymentsService) {

                this.configService.allConfigsPromise.then(() => {
                    const config = Object.assign({}, this.configService.permissions, this.configService.config);
                    const oldColumnsLength = this.listContext.columns.length;

                    this.listContext.columns = PermissionHelper.removeForbiddenColumns(this.listContext.columns, config);

                    if (oldColumnsLength !== this.listContext.columns.length) {
                        this.changeDetector.markForCheck();
                    }
                });
            }


            if (this.listContext.items === undefined) {
                this.loadList(undefined, undefined, undefined).then(() => {
                    this.changeDetector.reattach();
                });
            } else {
                if (this.listContext.items.length === 0) {
                    this.message = this.r.translations.resultsNotFound;
                }
                this.changeDetector.reattach();
            }


            //set back menu item
            this.backMenuItem = this.menuService.defaultBackItem;

            this.menuService.loadFullMenuItems().then(() => {

                if (this.router.url === this.configService.routePaths.complaintItems) {

                    this.currentMenuItem = Object.assign(
                        {},
                        this.menuService.fullMenuItems.find(item => item.url === this.configService.routePaths.complaints)
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
            this.changeDetector.detach();

            this.listContext.setCurrentFilter(res.filterParam);

            this.listContext.paginationRepo.changePage(0);

            this.loadList(res.getFilter, res.updateFilter, res.controlDate).then(() => {
                this.changeDetector.reattach();
            });

        });

    }


    changePage(currentPage) {
        this.listContext.paginationRepo.changePage(currentPage);
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

        if (filterParam.number !== undefined) {

            if (this.listContext.filters.currentFilter.sourceNumber !== undefined) {
                this.listContext.filters.currentFilter.sourceNumber = '';
            }

            if (this.listContext.filters.currentFilter.name !== undefined) {
                this.listContext.filters.currentFilter.name = '';
            }
        }

        if (filterParam.sourceNumber !== undefined) {
            this.listContext.filters.currentFilter.number = '';

            if (this.listContext.filters.currentFilter.name !== undefined) {
                this.listContext.filters.currentFilter.name = '';
            }
        }

        if (filterParam.name !== undefined) {

            if (this.listContext.filters.currentFilter.sourceNumber !== undefined) {
                this.listContext.filters.currentFilter.sourceNumber = '';
            }

            this.listContext.filters.currentFilter.number = '';
        }

        for (const param in filterParam) {
            if (filterParam[param] !== this.listContext.filters.currentFilter[param]) {

                //update when at least one parameter differs from current filter state
                this.filtersSubject.next({ getFilter: false, updateFilter: true, filterParam: filterParam });
                return;
            }
        }


    }


    clearOthers(current: 'number' | 'sourceNumber' | 'name') {

        this.textFilterInputs.forEach(item => {

            if (item.name !== current && item.value !== '') {
                item.value = '';
                //item.inputField.nativeElement.value = '';
                //this.listContext.filters.currentFilter[current] = ''; 
            }
        });

        this.changeDetector.markForCheck();
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
        this.configService.loaderSubj.next(true);

        return this.listContext.loadList(getFilter, updateFilter, controlDate).then(() => {

            this.configService.loaderSubj.next(false);

            if (this.listContext.items.length === 0) {
                this.message = this.r.translations.resultsNotFound;
            }

            this.changeDetector.markForCheck();

        }).catch((err: HttpErrorResponse) => {

            this.configService.loaderSubj.next(false);

            if (this.listContext.items && this.listContext.items.length === 0) {
                this.message = this.r.translations.resultsNotFound;
            }

            if (!this.configService.isOnline && this.listContext.items === undefined) {
                this.message = this.r.translations.noDataInOfflineMode;
            }

            this.changeDetector.markForCheck();

        });
    }


    genedareDocumentRouteLink(href, properties, document) {
        if (properties instanceof Array) {
            return [href].concat(properties.map(prop => document[prop]));
        }

        return [href, document[properties]];

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


    ngOnDestroy() {
        this.activatedRouteSubscription.unsubscribe();
        this.filtersSubject.unsubscribe();
        this.filtersSub.unsubscribe();
    }
}
