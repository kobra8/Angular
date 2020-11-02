import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { b2b } from 'src/b2b';
import { HttpClient } from '@angular/common/http';
import { AccountService } from '../account.service';
import { DateHelper } from 'src/app/helpers/date-helper';
import { DocumentStates } from './document-states';
import { MenuService } from '../menu.service';
import { Pagination } from './pagination';

/**
 * Base object for new documents lists (after swagger and refactoring api)
 * T - List item type
 * T2 - Filter params interface
 * */
export abstract class NewDocumentsList<T, T2> implements Resolve<ThisType<any>> {

    items: T[];
    currentFilter: T2 & b2b.CommonCustomerListFilter;
    states: b2b.Option3[];
    abstract columns: b2b.ColumnConfig[];
    abstract itemsPropertyName: string;
    pagination: Pagination;

    protected constructor(protected httpClient: HttpClient, protected menuService: MenuService, protected accountService: AccountService) {

        this.pagination = new Pagination();

        this.currentFilter = this.getDefaultFilter();

        this.accountService.logOutSubj.subscribe(() => {
            this.items = undefined;
            this.currentFilter = this.getDefaultFilter();
        });
    }

    /**
     * Method of Resolve interfase.
     * Method provides service to specific route using router resolver.
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): ThisType<any> {
        return this;
    }

    abstract getDocumentRouterLink(id: number): string[];

    protected abstract requestStates(): Promise<b2b.Option3[]>;

    loadStates(): Promise<b2b.Option3[]> {

        if (this.states === undefined) {
            return this.requestStates().then(res => {
                this.states = res;
                return Object.assign({}, this.states);
            });
        }

        return Promise.resolve(Object.assign({}, this.states));
    }

    getDefaultRequestParams(): b2b.CommonCustomerListFilterRequest {

        return Object.assign(
            this.pagination.getRequestParams(),
            {
                dateFrom: DateHelper.dateToString(this.currentFilter.dateFrom),
                dateTo: DateHelper.dateToString(this.currentFilter.dateTo)
            }
        );
    }

    getDefaultFilter(): T2 & b2b.CommonCustomerListFilter {
        const dateFrom = <Date>DateHelper.calculateMonths(new Date(), -3);
        const dateTo = new Date();

        return { dateFrom, dateTo } as T2 & b2b.CommonCustomerListFilter;
    }

    protected abstract requestList(): Promise<b2b.NewListResponse<T, any>>;

    loadList() {

        return this.requestList().then(res => {
            this.items = res[this.itemsPropertyName];
            this.pagination.changeParams(res.paging);
        });
    }

    setCurrentFilter(filterParam: Partial<b2b.CommonCustomerListFilter>) {

        if (filterParam.dateFrom) {
            filterParam.dateFrom = new Date(filterParam.dateFrom);
        }

        if (filterParam.dateTo) {
            filterParam.dateTo = new Date(filterParam.dateTo);
        }

        this.currentFilter = Object.assign(this.currentFilter, filterParam);
    }

    isAnyFilterChanged(): boolean {
        const defaultFilters = this.getDefaultFilter();

        for (const i in this.currentFilter) {

            if (this.currentFilter[i] instanceof Date) {
                if (DateHelper.difference(this.currentFilter[i], defaultFilters[i], 'days') !== 0) {
                    return true;
                }
            } else if (this.currentFilter[i] !== defaultFilters[i]) {
                return true;
            }
        }

        return false;
    }

}
