import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { b2bShared } from 'src/b2b-shared';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CommonAvailableCartsService {

    private _cartsForArticles: number[];
    private _cartsForQuotes: number[];

    cartsForArticlesChanged: Subject<number[]>;
    cartsForQuotesChanged: Subject<number[]>;


    constructor(
        private httpClient: HttpClient
    ) {
        this.cartsForArticlesChanged = new Subject<number[]>();
        this.cartsForQuotesChanged = new Subject<number[]>();
    }

    getCartsForArticles() {
        if (!this._cartsForArticles) {
            return this.localRefreshCartsForArticle();
        }
        return Promise.resolve(this._cartsForArticles);
    }

    getCartsForQuotes() {
        if (!this._cartsForQuotes) {
            return this.localRefreshCartsForQuotes();
        }
        return Promise.resolve(this._cartsForQuotes);
    }

    private localRefreshCartsForArticle() {
        return this.getAvailableCartsToAddArticlesRequest().then((res) => {
            return this._cartsForArticles = res.cartsIds;
        });
    }

    private localRefreshCartsForQuotes() {
        return this.getAvailableCartsToAddQuotesRequest().then((res) => {
            return this._cartsForQuotes = res.cartsIds;
        });
    }

    refreshAvailableCarts() {
        this.localRefreshCartsForArticle().then((res) => {
            this.cartsForArticlesChanged.next(res);
        });
        this.localRefreshCartsForQuotes().then((res) => {
            this.cartsForQuotesChanged.next(res);
        });
    }

    private getAvailableCartsToAddArticlesRequest(): Promise<b2bShared.AvailableCarts> {
        return this.httpClient.get<b2bShared.AvailableCarts>('/api/Carts/availableCarts').toPromise();
    }

    private getAvailableCartsToAddQuotesRequest(): Promise<b2bShared.AvailableCarts> {
        return this.httpClient.get<b2bShared.AvailableCarts>('/api/Quotes/availableCarts').toPromise();
    }

}
