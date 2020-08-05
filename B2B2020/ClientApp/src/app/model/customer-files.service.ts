import { Injectable } from '@angular/core';
import { b2b } from 'src/b2b';
import { HttpClient } from '@angular/common/http';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DateHelper } from '../helpers/date-helper';


@Injectable({
  providedIn: 'root'
})
export class CustomerFilesService implements Resolve<CustomerFilesService> {
    

    items: b2b.CustomerFile[];
    columns: b2b.ColumnConfig[];
    filters: {
        currentFilter: b2b.CustomerFilesFilter
    };

    constructor(private httpClient: HttpClient) {
        this.columns = [
            {
                property: 'name',
                translation: 'fileName',
                type: 'fileName',
                extensionProperty: 'extension',
                filter: { property: 'fileName', type: 'text' }
            },
            {
                property: 'crationTime',
                translation: 'creationDate',
                filter: { property: 'creationDate', type: 'date' }
            },
            {
                property: 'modificationtime',
                translation: 'modificationDate',
                filter: { property: 'modificationDate', type: 'date' }
            },
            {
                translation: 'filesToDownload', type: 'linkedDocument', link: {
                    type: 'href',
                    hrefCreator: this.hrefCreator,
                    labelResource: 'downloadFile',
                    labelIcon: 'ti-download'
                }
            },
        ];

        this.filters = {
            currentFilter: this.getDefaultFilter()
        };
    }


    getDefaultFilter(): any {
        return {
            creationDate: null,
            modificationDate: null,
            fileName: null
        };
    }

    private requestFiles(fileName = null, creationDate = null, modificationDate = null) {
        const params = {
            fileName: fileName,
            creationDate: creationDate,
            modificationDate: modificationDate
        };
        return this.httpClient
            .get<b2b.CustomerFile[]>(`/api/files/getfilesbycustomer?fileName=${fileName || ''}&creationDate=${creationDate || ''}&modificationDate=${modificationDate || ''}`)
            .toPromise();
    }

    loadList() {

        return this.requestFiles(this.filters.currentFilter.fileName, this.filters.currentFilter.creationDate, this.filters.currentFilter.modificationDate).then(res => {
            this.items = res.map(item => {
                if (item.extension.includes('.')) {
                    item.extension = item.extension.replace('.', '');
                }
                return item;
            });
        });
    }

    hrefCreator(item: b2b.CustomerFile) {

        if (item.isUrl) {
            return item.hashOrUrl;
        }

        return `/filehandler.ashx?id=${item.id}&fileName=${item.name}.${item.extension}&fromBinary=false&customerData=${item.hashOrUrl}`;
    }

    setCurrentFilter(filter: any): void {

        this.filters.currentFilter = Object.assign(this.filters.currentFilter, filter);
    }

    isAnyFilterChanged(): boolean {
        const defaultFilters = this.getDefaultFilter();

        for (const i in this.filters.currentFilter) {

            if (this.filters.currentFilter[i] !== defaultFilters[i]) {
                return true;
            }
        }

        return false;
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this;
    }
}
