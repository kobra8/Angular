import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/observable/merge';
import { MenuService } from '../../model/menu.service';
import { ArrayUtils } from '../../helpers/array-utils';
import { CustomerService } from '../../model/customer.service';
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


@Component({
    selector: 'app-documents-list',
    templateUrl: './documents-list.component.html',
    styleUrls: ['./documents-list.component.scss'],
    host: { 'class': 'app-documents-list' },
    encapsulation: ViewEncapsulation.None,
})
export class DocumentsListComponent implements OnInit, OnDestroy {

    private activatedRouteSubscription: Subscription;

    listContext: OrdersService & InquiriesService & QuotesService & PaymentsService & ComplaintsService & DeliveryService & PendingService;
    listLoading: boolean;

    url: string;
    currentMenuItem: b2b.MenuItem;
    backMenuItem: b2b.MenuItem;

    r: ResourcesService;

    @ViewChildren('textFilterInput')
    textFilterInputs: QueryList<FloatingLabelInputComponent>;

    @ViewChild('dateFrom')
    dateFromInput: ElementRef;

    @ViewChild('dateTo')
    dateToInput: ElementRef;

    //filters watcher
    private filtersSubject: Subject<b2b.ControlFiltersParams & {filterParam: any}>;
    private filtersSub: Subscription;


    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService
    ) {
        this.r = resourcesService;
        this.filtersSubject = new Subject<b2b.ControlFiltersParams & { filterParam: any }>();
    }

    ngOnInit() {
        this.listLoading = true;

        //watching filter changes and debounce timing for changes
        this.filtersSub = this.filtersSubject.debounceTime(1000).subscribe((res) => {

            if (res.filterParam.dateFrom !== undefined) {
                const wasValid = this.datesInputGuardian(res.filterParam.dateFrom, 'dateFrom');
                if (!wasValid) {
                    return;
                }
            }

            if (res.filterParam.dateTo !== undefined) {
                const wasValid = this.datesInputGuardian(res.filterParam.dateTo, 'dateTo');
                if (!wasValid) {
                    return;
                }
            }

            this.listLoading = true;

            this.listContext.setCurrentFilter(res.filterParam);

            this.listContext.paginationRepo.changePage(0);

            this.listContext.loadList(res.getFilter, res.updateFilter, res.controlDate).then(() => {
                this.listLoading = false;
            });
        });


        this.activatedRouteSubscription = Observable.merge(this.activatedRoute.data, this.activatedRoute.url).subscribe((res: any) => {


            if (res.listContext) {
                this.listContext = res.listContext;
                console.log(this.listContext);
            }

            if (res instanceof Array) {
                this.url = res[res.length - 1].path;

            }


            if (this.listContext !== undefined && this.url !== undefined) {

                if (this.url === 'ItemsComplaint') {
                    this.listContext.switchTo('products');
                } 

                if (this.url === 'Complaints') {
                    this.listContext.switchTo('documents');
                }

                if (this.url === 'Payments') {

                    this.configService.permissionsPromise.then(() => {
                        this.listContext.columns = PermissionHelper.removeForbiddenColumns(this.listContext.columns, this.configService.permissions);
                    });
                }

                //clear filters
                this.listContext.setCurrentFilter(this.listContext.getDefaultFilter());

                this.listContext.loadList(undefined, undefined, undefined).then(() => {
                    this.listLoading = false;
                });

                this.backMenuItem = this.menuService.defaultBackItem;

                this.menuService.loadFullMenuItems().then(() => {

                    if (this.url === 'ItemsComplaint') {
                        this.currentMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => item.url.toLowerCase().includes('complaints')));
                        this.currentMenuItem.displayNameResource = 'purchaseDocumentByRange';
                        this.currentMenuItem.displayName = null;

                    } else {

                        this.currentMenuItem = Object.assign({}, this.menuService.fullMenuItems.find(item => item.url.includes(this.url)));

                    }

                });
            }

        });

    }


    changePage(currentPage) {
        this.listLoading = true;
        this.listContext.paginationRepo.changePage(currentPage);
        this.listContext.loadList(false, false).then(() => {
            this.listLoading = false;          
        });
    }


    updateFilter(filterParam) {
       

        if (filterParam.statusId !== undefined) {
            filterParam.statusId = Number(filterParam.statusId);
        }

        if (filterParam.stateId !== undefined) {
            filterParam.stateId = Number(filterParam.stateId);
        }
        
        
        this.filtersSubject.next({ getFilter: false, updateFilter: true, filterParam: filterParam });
    }


    clearOthers(current: 'number' | 'sourceNumber' | 'name') {

        this.textFilterInputs.forEach(item => {

            if (item.name !== current && item.value !== '') {
                item.value = '';
                //item.inputField.nativeElement.value = '';
            }
        });
    }

    /**
     * Fixing wrong validation of native date controls. They doesn't respect min, max and required values for direct input.
     * Validators respected only for datapicker. 
     */
    datesInputGuardian(value, dateInputType: 'dateFrom' | 'dateTo'): boolean {

        if (!DateHelper.isValid(value)) {

            if (dateInputType === 'dateFrom') {
                this.dateFromInput.nativeElement.value = DateHelper.dateToString(this.listContext.filters.currentFilter.dateFrom);
            }

            if (dateInputType === 'dateTo') {
                this.dateToInput.nativeElement.value = DateHelper.dateToString(this.listContext.filters.currentFilter.dateTo);
            }

            return false;
        }


        if (dateInputType === 'dateFrom') {
            this.listContext.filters.currentFilter.dateFrom = new Date(value);
        }

        if (dateInputType === 'dateTo') {
            this.listContext.filters.currentFilter.dateTo = new Date(value);
        }

        return true;

    }

    ngOnDestroy() {
        this.activatedRouteSubscription.unsubscribe();
        this.filtersSubject.unsubscribe();
        this.filtersSub.unsubscribe();
    }
}
