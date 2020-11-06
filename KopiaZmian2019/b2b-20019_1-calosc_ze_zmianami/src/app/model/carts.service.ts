import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { AfterAddingToCart } from './enums/after-adding-to-cart.enum';
import { Router } from '@angular/router';
import { Subject, Observable, Observer } from 'rxjs';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ConfigService } from './config.service';
import { ArrayUtils } from '../helpers/array-utils';

@Injectable()
export class CartsService {

    /**
      * Array of single cart previews.
      * Basic summaries of cart
      */
    carts: Map<number, { count: number, currencies: b2b.CartPreviewItemResponse[] }>;

    /**
    * Summary of all carts grouped by currency
    */
    summariesByCurrency: Map<string, { totalNetAmount: number, totalGrossAmount: number }>;

    cartsAmount: number;
    totalProductsAmount: number;

    /**
     * User behaviour after adding product to cart
     */
    afterAddingToCart: AfterAddingToCart;

    /**
    * Event emited after adding product to cart
    */
    productAdded: Subject<{ cartId: number, addedCount: number, notAddedCount: number }>;

    allCarts: number[];

    updateOrdersObservable: Observable<b2b.IDs>;
    updateOrdersObserver: Observer<b2b.IDs>;
    updateInquiriesObservable: Observable<b2b.IDs>;
    updateInquiriesObserver: Observer<b2b.IDs>;

    constructor(private httpClient: HttpClient, private router: Router, private configService: ConfigService) {

        this.productAdded = new Subject<{ cartId: number, addedCount: number, notAddedCount: number }>();

        const behaviour = window.localStorage.getItem('afterAddingToCart');
        this.afterAddingToCart = behaviour === null ? null : Number(behaviour);

        this.updateOrdersObservable = Observable.create(observer => {
            this.updateOrdersObserver = observer;
        });

        this.updateInquiriesObservable = Observable.create(observer => {
            this.updateInquiriesObserver = observer;
        });
    }


    /**
    * gets carts' data preview from CartsPreview
    */
    getPreviewData(): b2b.CartsPreview {

        return {
            carts: this.carts,
            summariesByCurrency: this.summariesByCurrency,
            cartsAmount: this.cartsAmount,
            totalProductsAmount: this.totalProductsAmount
        };
    }

    /**
    * makes request for carts' preview
    */
    private requestCartsList(): Promise<b2b.CartPreviewItemResponse[]> {

        return this.httpClient.get<b2b.CartPreviewItemResponse[]>('/api/carts').toPromise();
    }

    /**
    * sets carts and emits event (cartsLoadedEvent) with carts amount and emitter name
    */
    setListData(listData: b2b.CartPreviewItemResponse[]) {

        //this.carts = <b2b.CartPreviewItem[]>{};

        const cartsById = new Map<number, { count: number, currencies: b2b.CartPreviewItemResponse[] }>();

        const summariesByCurrency = new Map<string, { totalNetAmount: number, totalGrossAmount: number }>();

        let totalProducts = 0;

        listData.forEach(item => {

            const byIdElement = cartsById.get(item.id);

            if (byIdElement === undefined) {
                cartsById.set(Number(item.id), { count: item.count, currencies: [item] });
            } else {
                byIdElement.count += item.count;
                byIdElement.currencies.push(item);
            }

            const byCurrencySummary = summariesByCurrency.get(item.currency);

            if (byCurrencySummary === undefined) {
                summariesByCurrency.set(item.currency, { totalNetAmount: item.netAmount, totalGrossAmount: item.grossAmount });
            } else {
                byCurrencySummary.totalGrossAmount += item.grossAmount;
                byCurrencySummary.totalNetAmount += item.netAmount;
            }

            totalProducts += item.count;

        });

        this.carts = cartsById;
        this.summariesByCurrency = summariesByCurrency;
        this.totalProductsAmount = totalProducts;
        this.cartsAmount = cartsById.size;

    }

    recalculateSummary(): void {

        let totalProductAmount = 0;
        const summariesByCurrency = new Map<string, { totalNetAmount: number, totalGrossAmount: number }>();

        this.carts.forEach(cart => {

            cart.currencies.forEach(summary => {

                const byCurrencySummary = summariesByCurrency.get(summary.currency);

                if (byCurrencySummary === undefined) {
                    summariesByCurrency.set(summary.currency, { totalNetAmount: summary.netAmount, totalGrossAmount: summary.grossAmount });
                } else {
                    byCurrencySummary.totalGrossAmount += summary.grossAmount;
                    byCurrencySummary.totalNetAmount += summary.netAmount;
                }

                totalProductAmount += summary.count;
            });


        });

        this.totalProductsAmount = totalProductAmount;
        this.summariesByCurrency = summariesByCurrency;
        this.cartsAmount = this.carts.size;


    }

    /**
    * Loads carts preview properties, updates model and emits event.
    * Returns promise with updated carts list.
    */
    loadList(): Promise<b2b.CartsPreview> {

        return this.requestCartsList().then((res: b2b.CartPreviewItemResponse[]) => {

            this.setListData(res);
            return this.getPreviewData();

        });


    }


    /* ---- carts operations ---- */


    /**
    * makes request for remove cart with given id
    */
    private requestRemoveCart(cartId: number): Promise<boolean> {

        return this.httpClient.delete<boolean>('/api/carts/' + cartId).toPromise();
    }

    /**
    * Removes cart with given id and updates model.
    * Returns promise with updated cart's list.
    */
    removeCart(cartId: number): Promise<boolean> {

        this.configService.loaderSubj.next(true);

        return this.requestRemoveCart(cartId).then((res: boolean) => {

            if (res) {


                this.carts.delete(cartId);

                //Map refference must be changed to rebind data. Changing map properties doesn't rebind data.
                this.carts = new Map(this.carts);

                this.recalculateSummary();

                if (this.router.url.includes(this.configService.routePaths.cart)) {
                    const urlArray = this.router.url.split('/');

                    if (urlArray[urlArray.length - 1] === cartId + '') {
                        this.router.navigate([this.configService.routePaths.home]);
                    }
                }

            }

            this.configService.loaderSubj.next(false);

            return true;

        });
    }

    /* ---- products operations ---- */

    /**
    * makes request for adding product to cart, returns request's promise
    */
    private requestAddToCart(productData: b2b.AddToCartRequest): Promise<b2b.CartPreviewItemResponse[]> {

        return this.httpClient.post<b2b.CartPreviewItemResponse[]>('/api/carts/addtocartwithsummary', productData).toPromise();

    }


    /**
    * Adds product to cart, updates model, emits event.
    * Returns promise with updated carts list.
    */

    addToCart(productData: b2b.AddToCartRequest): Promise<b2b.CartsPreview> {

        return this.configService.allConfigsPromise.then(() => {

            return this.requestAddToCart(productData).then((res: b2b.CartPreviewItemResponse[]) => {

                if (res) {
                    console.log('Add to cart res: ', res);
                    this.setListData(res);
                    this.productAdded.next({ cartId: productData.id, addedCount: 1, notAddedCount: 0 });

                    if (this.afterAddingToCart === AfterAddingToCart.go) {
                        this.router.navigate([this.configService.routePaths.cart, productData.id]);
                    }

                    return this.getPreviewData();
                }
            });
        });

    }

    /**
     * Updates given cart in header by given cart data and recalcualtes carts summary.
     */
    updateSpecificCart(cartId: number, cartSummaries: b2b.CartSummary[]) {

        const cart = this.carts.get(cartId);

        cart.count = 0;


        cartSummaries.forEach((summary, i) => {
            cart.count += summary.count;

            cart.currencies[i] = {
                count: summary.count,
                currency: summary.currency,
                grossAmount: ConvertingUtils.stringToNum(summary.grossAmount),
                netAmount: ConvertingUtils.stringToNum(summary.netAmount),
                vatValue: ConvertingUtils.stringToNum(summary.vatValue),
                id: cartId
            };
        });


        this.recalculateSummary();

        //change reference to force rebind
        //this.carts = new Map(this.carts);
    }

    saveAddToCartBehaviour(behaviourType: AfterAddingToCart): void {

        this.afterAddingToCart = behaviourType;
        window.localStorage.setItem('afterAddingToCart', behaviourType + '');
    }


    /**
   * makes request for adding many products to cart, returns request's promise
   */
    private requestAddManyToCart(products: b2b.AddToCartRequest[]): Promise<b2b.AddManyToResponseItem[]> {

        return this.httpClient.post<b2b.AddManyToResponseItem[]>('/api/carts/addmanytocart', products).toPromise();

    }


    /**
     * adding many products to cart
     */
    addManyToCart(products: b2b.AddToCartRequest[]): Promise<b2b.AddManyToResponseItem[]> {


        return this.configService.allConfigsPromise.then(() => {

            return this.requestAddManyToCart(products).then((res) => {

                const added = res.filter(item => item.success);
                const notAddedLength = res.length - added.length;

                if (added.length > 0) {

                    this.productAdded.next({ cartId: products[0].id, addedCount: added.length, notAddedCount: notAddedLength });
                    this.loadList();

                    if (this.afterAddingToCart === AfterAddingToCart.go) {
                        this.router.navigate([this.configService.routePaths.cart, + products[0].id]);
                    }
                }


                return res;
            });
        });
    }


    private importFromCsvRequest(cartId: number, csvFile: any): Promise<b2b.ImportFromCsvResponse> {

        return this.httpClient.post<b2b.ImportFromCsvResponse>('/api/carts/importFromCsv/' + cartId, csvFile).toPromise();
    }

    importFromCsv(cartId: number, csvFile: any): Promise<b2b.ImportFromCsvResponse> {

        return this.importFromCsvRequest(cartId, csvFile);
    }


    loadCartNumbers(): Promise<number[]> {
        return this.httpClient.get<number>('/api/carts/maxCartCount').toPromise().then(count => {
            this.allCarts = ArrayUtils.toRangeArray<number>(count, true);
            return Object.assign({}, this.allCarts);
        });
    }

}
