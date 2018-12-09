import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './pagination-repo';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { DateHelper } from '../../helpers/date-helper';
import { b2b } from '../../../b2b';

export abstract class DocumentsList implements Resolve<any> {

    items: b2b.OrderListItem[] & b2b.InquiryListItem[] & b2b.QuotesListItem[] & b2b.PaymentsListItem[] & b2b.ComplaintsListItem[] & b2b.DeliveryListItem[] & b2b.PendingListItem[];
    filters: b2b.CustomerListFilteringOptions;
    paginationRepo: PaginationRepo;
    abstract columns: Map<string, string>;


    protected constructor(protected httpClient: HttpClient) {

        this.paginationRepo = new PaginationRepo({ currentPage: 0 });

        this.filters = {
            ranges: {},
            currentFilter: this.getDefaultFilter()
        };

    }


    getCommonMenuItems(): b2b.MenuItem[] {

        return [
            {
                cssClass: 'back',
                displayNameResource: 'backToShopping',
                position: 0,
                url: 'Items'
            }
        ];
    }

    protected requestStates?(getDescription: boolean): Promise<b2b.Option2[]>;
    protected abstract requestList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any>;


    getDefaultFilter(): any {

        let dateFrom = <Date>DateHelper.calculateMonths(new Date(), -3);
        let dateTo = new Date();

        if (this.filters && this.filters.ranges && this.filters.ranges.dateFrom) {
            dateFrom = this.filters.ranges.dateFrom;
        }

        if (this.filters && this.filters.ranges && this.filters.ranges.dateTo) {
            dateTo = this.filters.ranges.dateTo;
        }

        return {
            filter: '',
            dateFrom: dateFrom,
            dateTo: dateTo
        };
    }

    getItems(): any {
        return this.items;
    }

    getFilter(): any {
        return this.filters;
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

        const paginationParams = this.paginationRepo.getRequestParams();

        return {
            filter: this.filters.currentFilter.filter,
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
            skip: paginationParams.skip,
            top: paginationParams.top,
            getFilter: getFilter.toString(),
            updateFilter: updateFilter.toString(),
            controlDate: controlDate.toString()
        };
    }


    getPaginationParams(): b2b.PaginationConfig {
        return this.paginationRepo.pagination;
    }


    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any> {

        return this.requestList(getFilter, updateFilter, controlDate).then(res => {

            if (res.filter) {
                this.filters.ranges.dateFrom = new Date(res.filter.dateFrom);
                this.filters.ranges.dateTo = new Date(res.filter.dateTo);
            }

            this.paginationRepo.pagination.isNextPage = res.hasMore;
            this.items = res.items.set1;

            return res;

        });

    }

    loadStates(getDescription = true): Promise<b2b.Option2[]> {

        if (this.filters.states === undefined) {
            return this.requestStates(getDescription).then(res => {
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
