import { HttpClient } from '@angular/common/http';
import { PaginationRepo } from './pagination-repo';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { DateHelper } from '../../helpers/date-helper';
import { b2b } from '../../../b2b';
import { ConfigService } from '../config.service';
import { DocumentStates } from './document-states';
import { AccountService } from '../account.service';

export abstract class DocumentsList implements Resolve<any> {

    items: b2b.OrderListItem[] & b2b.InquiryListItem[] & b2b.QuotesListItem[] & b2b.PaymentsListItem[] & b2b.ComplaintsListItem[] & b2b.DeliveryListItem[] & b2b.PendingListItem[];
    filters: b2b.CustomerListFilteringOptions;
    paginationRepo: PaginationRepo;
    abstract columns: b2b.ColumnConfig[];
    /* abstract */ states?: Map<number, string>; //doesn't exist for pending items list


    protected constructor(protected httpClient: HttpClient, protected configService: ConfigService, protected accountService: AccountService) {

        this.paginationRepo = new PaginationRepo();

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
            filter: '',
            number: '',
            sourceNumber: '',
            dateFrom: dateFrom,
            dateTo: dateTo,
            stateId: -1
        };
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
            filter: this.filters.currentFilter.name || this.filters.currentFilter.number || this.filters.currentFilter.sourceNumber || '',
            dateFrom: DateHelper.dateToString(this.filters.currentFilter.dateFrom),
            dateTo: DateHelper.dateToString(this.filters.currentFilter.dateTo),
            skip: paginationParams.skip,
            top: paginationParams.top,
            getFilter: getFilter,
            updateFilter: updateFilter,
            controlDate: controlDate
        };
    }

    /**
     * Makes request for list and updates model properly
     * Method includes waiting for configuration and permissions.
     */
    loadList(getFilter?: boolean, updateFilter?: boolean, controlDate?: boolean): Promise<any> {

        const listPromise = this.requestList(getFilter, updateFilter, controlDate);
        const permissionsPromise = this.configService.allConfigsPromise;

        return Promise.all([permissionsPromise, listPromise]).then(res => {

            const listRes = res[1];

            if (this.configService.applicationId === 1) {
                //Altum states are unified. XL states not, so XL states must be set in specific services.
                this.states = DocumentStates.altumAllStates;
            }

            this.paginationRepo.pagination.isNextPage = listRes.hasMore;

            this.items = listRes.items.set1.map(el => {
                if (el.state) {
                    el.state = Number(el.state);
                }

                return el;
            });


            return listRes;

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
