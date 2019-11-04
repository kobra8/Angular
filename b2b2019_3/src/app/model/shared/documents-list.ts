import { HttpClient } from '@angular/common/http';

import { ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { DateHelper } from '../../helpers/date-helper';
import { b2b } from '../../../b2b';
import { DocumentStates } from './document-states';
import { AccountService } from '../account.service';
import { OldPagination } from './old-pagination';
import { Pagination } from './pagination';
import { MenuService } from '../menu.service';
import { ConfigService } from '../config.service';


/**
 * Base object for old documents lists (before swagger and refactoring api)
 * */
export abstract class DocumentsList implements Resolve<any> {

    items: b2b.OrderListItem[] & b2b.InquiryListItem[] & b2b.QuotesListItem[] & b2b.PaymentsListItem[] & b2b.ComplaintsListItem[] & b2b.DeliveryListItem[] & b2b.PendingListItem[];
    filters: b2b.CustomerListFilteringOptions;
    pagination: Pagination & OldPagination & any;
    abstract columns: b2b.ColumnConfig[];
    /* abstract */ states?: Map<number, string>; //doesn't exist for pending items list

    protected constructor(protected httpClient: HttpClient, protected configService: ConfigService, protected menuService: MenuService, protected accountService: AccountService) {


        this.pagination = new Pagination();

        this.filters = {
            currentFilter: this.getDefaultFilter()
        };


        this.accountService.logOutSubj.subscribe(() => {
            this.items = undefined;
            this.filters.currentFilter = <any>this.getDefaultFilter();
        });
    }


    protected /*abstract*/ requestStates?(): Promise<b2b.Option3[]>; //doesn't exist for pending items list
    protected abstract requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any>;


    getDefaultFilter(): any {

        const dateFrom = <Date>DateHelper.calculateMonths(new Date(), -3);
        const dateTo = new Date();

        return {
            dateFrom: dateFrom,
            dateTo: dateTo,
            stateId: -1
        };
    }

    isAnyFilterChanged(): boolean {
        const defaultFilters = this.getDefaultFilter();

        for (const i in this.filters.currentFilter) {

            if (this.filters.currentFilter[i] instanceof Date) {
                if (DateHelper.difference(this.filters.currentFilter[i], defaultFilters[i], 'days') !== 0) {
                    return true;
                }
            } else if (this.filters.currentFilter[i] !== defaultFilters[i]) {
                return true;
            }
        }

        return false;
    }

    setCurrentFilter(filter: any): void {

        if (typeof filter.dateTo === 'string') {
            filter.dateTo = new Date(filter.dateTo);
        }

        if (typeof filter.dateFrom === 'string') {
            filter.dateFrom = new Date(filter.dateFrom);
        }

        this.filters.currentFilter = Object.assign(this.filters.currentFilter, filter);
    }

    prepareSharedParams(getFilter = true, updateFilter = true, controlDate = true): any {

        return Object.assign(
            {
                dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
                dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
                getFilter: getFilter,
                updateFilter: updateFilter,
                controlDate: controlDate
            },
            this.pagination.getRequestParams()
        );
    }

    /**
     * Makes request for list and updates model properly
     */
    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any> {

        return this.requestList(getFilter, updateFilter, controlDate).then(res => {
            const listRes = res;

            if (this.configService.applicationId === 1) {
                //Altum states are unified. XL states not, so XL states must be set in specific services.
                this.states = DocumentStates.altumAllStates;
            }

            if (listRes.paging) {
                (<Pagination>this.pagination).changeParams(listRes.paging);
            } else {
                if ((<Pagination>this.pagination).totalPages) {
                    this.pagination = new OldPagination();
                }
                (<OldPagination>this.pagination).changeParams({
                    hasMore: listRes.hasMore
                });
            }

            this.items = listRes.items.set1.map(el => {
                if (el.state) {
                    el.state = Number(el.state);
                }

                return el;
            });


            return listRes;

        }).catch(err => {
            return Promise.reject(err);
        });

    }

    loadStates(): Promise<b2b.Option3[]> {

        if (this.filters.states === undefined) {
            return this.requestStates().then(res => {
                this.filters.states = res;
                return this.filters.states;
            });
        }

        return Promise.resolve(this.filters.states);

    }


    /**
     * Method of Resolve interfase.
     * Method provides service to specific route using router resolver.
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        return this;
    }

}
