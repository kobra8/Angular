import { Injectable } from '@angular/core';
import { b2b } from 'src/b2b';
import { AccountService } from './account.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { NewDocumentsList } from './shared/new-documents-list';
import { MenuService } from './menu.service';

@Injectable()
export class ServiceJobsService extends NewDocumentsList<b2b.ServiceJobListElement, b2b.ServiceJobsFilter> {
    
    columns: b2b.ColumnConfig[];
    statuses: b2b.Option4[];
    itemsPropertyName: string;


    constructor(httpClient: HttpClient, menuService: MenuService, accountService: AccountService) {
        super(httpClient, menuService, accountService);

        this.columns = [
            {
                property: 'documentNumber',
                translation: 'number',
                filter: { property: 'documentNumber', type: 'text' }
            },
            {
                property: 'myDocumentNumber',
                translation: 'myNumber',
                filter: { property: 'myDocumentNumber', type: 'text' }
            },
            {
                property: 'stateResourceKey',
                translation: 'state',
                type: 'translation',
                filter: {
                    property: 'stateId',
                    type: 'select',
                    valuesProperty: 'states',
                    valuesLoader: this.loadStates.bind(this),
                    defaultValue: -1
                }
            },
            {
                property: 'status',
                filter: {
                    property: 'statusId',
                    type: 'select',
                    valuesProperty: 'statuses',
                    valuesLoader: this.loadStatuses.bind(this),
                    defaultValue: -1
                }
            },
            { property: 'creationDate', type: 'dateWithTime' },
            { property: 'realizationDate', translation: 'expectedDate', type: 'dateWithTime' },
            { property: 'plannedEndDate', type: 'dateWithTime' }

        ];

        this.itemsPropertyName = 'serviceJobs';
    }

    protected requestList(): Promise<b2b.ServiceJobsResponse> {

        const params = Object.assign(

            super.getDefaultRequestParams(),
            {
                documentNumber: this.currentFilter.documentNumber,
                myDocumentNumber: this.currentFilter.myDocumentNumber,
                statusId: this.currentFilter.statusId,
                stateId: this.currentFilter.stateId
            }
        );

        return this.httpClient.get<b2b.ServiceJobsResponse>('/api/serviceJob/get', { params: <any>params }).toPromise();
    }


    getDefaultFilter() {
        return Object.assign(
            super.getDefaultFilter(),
            {
                documentNumber: '',
                myDocumentNumber: '',
                statusId: -1,
                stateId: -1
            }
        );
    }

    requestStates() {
        return this.httpClient.get<b2b.Option3[]>('/api/serviceJob/filterStates').toPromise();
    }

    loadStatuses() {
        if (this.statuses === undefined) {
            return this.httpClient.get<b2b.Option4[]>('/api/serviceJob/filterStatuses').toPromise().then(res => {
                this.statuses = res;
                return res;
            });
        }


        return Promise.resolve(Object.assign({}, this.statuses));
    }


    getDocumentRouterLink(id: number): string[] {
        return [this.menuService.routePaths.serviceJobDetails, id + ''];
    }
}
