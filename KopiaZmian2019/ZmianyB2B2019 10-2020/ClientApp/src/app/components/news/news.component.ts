import { Component, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { ConfigService } from 'src/app/model/config.service';
import { NewsService } from 'src/app/model/news.service';
import { DisplayType } from 'src/app/model/enums/display-type.enum';
import { ResourcesService } from 'src/app/model/resources.service';
import { NgForm } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { b2b } from 'src/b2b';
import { DateHelper } from 'src/app/helpers/date-helper';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuService } from 'src/app/model/menu.service';

@Component({
    selector: 'app-news',
    templateUrl: './news.component.html',
    styleUrls: ['./news.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'app-news view-with-sidebar' }
})
export class NewsComponent implements OnInit, OnDestroy {
    
    displayType: DisplayType;
    r: ResourcesService;
    menuItems: b2b.MenuItem[];


    @ViewChild('filtersForm', { static: true })
    filtersForm: NgForm;

    filtersSubj: Subject<b2b.NameValue>;
    filtersSub: Subscription;

    filtersVisibility: boolean;

    visibleCurrentFilter: {
        title: string;
        category: string;
        creationDate: string;
    };

    isAnyFilter: boolean;

    error: string;

    constructor(
        public configService: ConfigService,
        resourcesService: ResourcesService,
        public newsService: NewsService,
        public menuService: MenuService
    ) {
        this.r = resourcesService;
        this.visibleCurrentFilter = <any>{};
        this.displayType = Number(localStorage.getItem('newsDisplayType')) || DisplayType.grid;
        this.filtersSubj = new Subject<b2b.NameValue>();
    }

    

    ngOnInit() {

        this.menuService.loadFullMenuItems().then(() => {
            this.menuItems = [this.menuService.defaultBackItem];

            if (this.configService.permissions.hasAccessToNews) {
                this.menuItems.push(this.menuService.fullMenuItems.find(item => item.url === this.menuService.routePaths.news));
            }
        });

        this.loadList();

        this.filtersSub = this.filtersSubj.pipe(debounceTime(1000)).subscribe(res => {  
            this.loadList();
        });
    }

    changeView(viewType: DisplayType) {
        this.displayType = viewType;
        localStorage.setItem('newsDisplayType', viewType + '');
    }


    updateCurrentFilter(name, value: string) {

        this.newsService.updateCurrentFilter(name, value);

        if (!this.configService.isMobile) {
            this.filtersSubj.next({ name: name, value: value });
        }
    }


    resetAllFilters() {
        this.configService.loaderSubj.next(true);
        this.newsService.filters = this.newsService.getDefaultFilter();
        this.filtersForm.reset();
        this.filtersForm.form.markAsPristine();
        this.loadList().then(() => {
            this.visibleCurrentFilter = <any>{};
        });
    }

    loadList() {
        this.configService.loaderSubj.next(true);
        this.error = null;

        return this.newsService.loadList().then(() => {

            this.visibleCurrentFilter = Object.assign({}, this.newsService.filters);

            this.isAnyFilter = !!Object.values(this.newsService.filters).find(value => value !== '');

            this.configService.loaderSubj.next(false);

        }).catch((err: HttpErrorResponse) => {

            this.configService.loaderSubj.next(false);

            if (err.status === 403) {
                this.error = this.r.translations.forbidden;
            }
        });
    }

    toggleFilters(visibility?: boolean) {

        if (visibility === undefined) {

            this.filtersVisibility = !this.filtersVisibility;

        } else {

            this.filtersVisibility = visibility;
        }
    }

    handleFilterButton() {
        this.loadList();
    }

    ngOnDestroy(): void {
        this.filtersSub.unsubscribe();
        this.filtersSubj.unsubscribe();
    }

}
