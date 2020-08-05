import { Component, OnInit, ViewEncapsulation, HostBinding, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { b2b } from 'src/b2b';
import { ResourcesService } from 'src/app/model/resources.service';
import { Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from 'src/app/model/config.service';
import { MenuService } from 'src/app/model/menu.service';
import { NewDocumentsList } from 'src/app/model/shared/new-documents-list';
import { ServiceJobsService } from 'src/app/model/service-jobs.service';
import { DateHelper } from 'src/app/helpers/date-helper';
import { debounceTime } from 'rxjs/operators';


type allListsItem = b2b.NewsListItem & b2b.ServiceJobListElement;
type allListsFilters = b2b.CommonCustomerListFilter & b2b.ServiceJobsFilter;


@Component({
    selector: 'app-new-documents-list',
    templateUrl: './new-documents-list.component.html',
    styleUrls: ['./new-documents-list.component.scss'],
    host: { 'class': 'app-documents-list app-new-documents-list view-with-sidebar' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewDocumentsListComponent implements OnInit, OnDestroy {


    listContext: NewDocumentsList<allListsItem, allListsFilters>;

    currentMenuItem: b2b.MenuItem;
    backMenuItem: b2b.MenuItem;

    r: ResourcesService;

    @ViewChild('dateFrom', { static: false })
    dateFromInput: ElementRef<HTMLInputElement>;

    @ViewChild('dateTo', { static: false })
    dateToInput: ElementRef<HTMLInputElement>;

    private filtersSubject: Subject<Partial<b2b.CommonCustomerListFilter>>;

    emptyListMessage: b2b.EmptyListInfoElement;
    gridTemplateColumns: string;
    url: string;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        public changeDetector: ChangeDetectorRef,
        private router: Router
    ) {
        this.r = resourcesService;
        this.filtersSubject = new Subject<Partial<b2b.CommonCustomerListFilter>>();
    }

    ngOnInit() {

        this.activatedRoute.data.subscribe(res => {

            this.listContext = res.listContext;

            this.gridTemplateColumns = `repeat(${this.listContext.columns.length}, minmax(auto, ${100 / this.listContext.columns.length}fr))`;

            if (this.listContext === undefined) {
                this.handleLackOfPermissions();
                return;
            }

            this.emptyListMessage = this.getEmptyListInfo();

            this.menuService.loadFullMenuItems().then(() => {
                this.backMenuItem = this.menuService.defaultBackItem;
                this.currentMenuItem = this.menuService.fullMenuItems.find(item => item.url.includes(this.router.url));
            });
            this.url = this.activatedRoute.pathFromRoot.map(el => el.routeConfig ? el.routeConfig.path.split('/')[0] : '').join('/');

            if (this.listContext.pagination) {
                if (!this.isLastRouteRelated()) {
                    this.listContext.pagination.goToStart();
                }
            }

            this.loadList();
        });

        //watching filter changes and debounce timing for changes
        this.filtersSubject.pipe(debounceTime(1000)).subscribe((res) => {

            this.listContext.setCurrentFilter(res);

            this.loadList().then(() => {
                this.changeDetector.markForCheck();
            });
        });
    }

    private isLastRouteRelated() {
        if (!this.menuService.lastTwoRoutes) {
            return false;
        }

        return this.isLastRoute(this.url);
    }

    private isLastRoute(path: string) {
        return this.menuService.lastTwoRoutes[0].url.includes(path);
    }


    handleLackOfPermissions() {
        if (this.configService.permissions.hasAccessToOrdersList) {
            this.router.navigate([this.menuService.routePaths.orders]);
        } else {
            this.router.navigate([this.menuService.profileSidebar[0].url]);
        }
    }

    loadList() {
        this.configService.loaderSubj.next(true);

        return this.listContext.loadList().then(() => {

            this.configService.loaderSubj.next(false);

            this.changeDetector.markForCheck();

        }).catch(err => {
            return Promise.reject(err);
        });
    }

    getEmptyListInfo() {
        if (<any>this.listContext instanceof ServiceJobsService) {
            return { resx: 'noServiceJobs', svgId: 'Pending' };
        }
    }

    /**
     * Fixing wrong validation of native date controls. They doesn't respect min, max and required values for direct input.
     * Validators respected only for setting data via datapicker. 
     */
    updateDateWithGuardian(value, dateInputType: 'dateFrom' | 'dateTo'): boolean {

        if (!DateHelper.isValid(value)) {

            if (dateInputType === 'dateFrom') {
                this.dateFromInput.nativeElement.value = DateHelper.dateToString(this.listContext.currentFilter.dateFrom);
                return false;
            }

            if (dateInputType === 'dateTo') {
                this.dateToInput.nativeElement.value = DateHelper.dateToString(this.listContext.currentFilter.dateTo);
                return false;
            }

            return false;
        }


        if (dateInputType === 'dateFrom') {
            this.listContext.currentFilter.dateFrom = new Date(value);
            this.filtersSubject.next({ dateFrom: this.listContext.currentFilter.dateFrom });
            return true;
        }

        if (dateInputType === 'dateTo') {
            this.listContext.currentFilter.dateTo = new Date(value);
            this.filtersSubject.next({ dateTo: this.listContext.currentFilter.dateTo });
            return true;
        }

        return true;

    }

    trackByFn(i, el) {
        return el.id || i;
    }

    updateFilter(name, value) {
        const param = {};
        param[name] = value;

        this.filtersSubject.next(param);
    }

    lazyLoadFilterValues(requestPromise?: Function) {
        if (requestPromise) {
            requestPromise().then(() => {
                this.changeDetector.markForCheck();
            });
        }
    }

    resetAllFilters() {

        this.configService.loaderSubj.next(true);
        this.listContext.currentFilter = this.listContext.getDefaultFilter();
        this.loadList().then(() => {
            this.configService.loaderSubj.next(false);
        });
    }


    changePage(page: number) {
        this.listContext.pagination.changePage(page);
        this.loadList();
    }

    ngOnDestroy(): void {
        this.filtersSubject.complete();
    }
}
