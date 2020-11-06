import { Injectable } from '@angular/core';
import { StoreRequestsService } from './store-requests.service';
import { Subject, Observable } from 'rxjs';
import { b2bStore } from 'src/integration/store/b2b-store';
import { Pagination } from '../shared/pagination';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MenuService } from '../menu.service';
import { StoresService } from './stores.service';

@Injectable({
    providedIn: 'root'
})
export class StoreService {

    private _pagination: Pagination;
    get pagination() { return this._pagination; }

    private _storeIdentifier: b2bStore.StoreIdentifier;
    get storeIdentifier() { return this._storeIdentifier; }
    storeNameChanged: Subject<b2bStore.StoreIdentifier>;

    private articles: b2bStore.StoreArticleListItem[];
    private summary: b2bStore.StoreSummary;
    articlesChanged: Subject<b2bStore.StoreArticlesSummary>;

    constructor(
        private storeRequestsService: StoreRequestsService,
        private router: Router,
        private menuService: MenuService,
        private storesService: StoresService) {

        this._pagination = new Pagination;
        this.storeNameChanged = new Subject();
        this.articlesChanged = new Subject();
    }

    getStoreContent(storeId: number): void {
        const request = { storeId, pageNumber: this._pagination.currentPage } as b2bStore.GetStoreContentRequest;
        this.storeRequestsService.getStoreContentRequest(request).subscribe((res) => {
            this.articles = res.items;
            this.summary = res.summary;
            this._pagination.changeParams(res.pagingResponse);
            this._storeIdentifier = res.storeIdentifier;
            this.articlesChanged.next({ articles: this.articles.slice(), summary: res.summary, storeExists: true});
            this.storeNameChanged.next(this.storeIdentifier);

        }, (err: HttpErrorResponse) => {
            if (err.status === 404) {
                this.articlesChanged.next({ storeExists: false });
            }
        });
    }

    updateItemQuantity(storeItemId: number, quantity: number): Observable<void> {
        const request = { storeItemId, quantity } as b2bStore.UpdateItemQuantityRequest;
        return this.storeRequestsService.updateItemQuantityRequest(request);
    }

    removeStoreItem(storeId: number, itemId: number): void {
        const request = { itemId, pageNumber: this._pagination.currentPage, storeId } as b2bStore.RemoveStoreItemRequest;
        this.storeRequestsService.removeStoreItemRequest(request).subscribe((res) => {

            if (!res.storeStillExists) {
                this.router.navigate([this.menuService.routePaths.home]);
                this.storesService.refreshStores();
                return;
            }

            this._pagination.changePageIfDifferent(res.pageNumberToGet);
            this.getStoreContent(storeId);
        });
    }

    updateStoreName(storeId: number, newStoreName: string) {
        const request = { storeId, newStoreName } as b2bStore.UpdateStoreNameRequest;
        this.storeRequestsService.updateStoreName(request).subscribe(() => {
            this._storeIdentifier = {
                ...this.storeIdentifier,
                name: newStoreName
            };
            this.storesService.refreshStoreName(this.storeIdentifier);
            this.storeNameChanged.next(this.storeIdentifier);
        });
    }

    changePage(pageNumber: number, storeId: number) {
        this._pagination.changePage(pageNumber);
        this.getStoreContent(storeId);
    }
}
