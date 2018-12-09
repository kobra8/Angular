import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { ArrayUtils } from '../helpers/array-utils';
import { AfterAddingToCart } from './enums/after-adding-to-cart.enum';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { UrlSegment } from '@angular/router/src/url_tree';
import { Subject } from 'rxjs/Subject';
import { FormattingUtils } from '../helpers/formatting-utils';

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




    constructor(private httpClient: HttpClient, private router: Router) {

        this.productAdded = new Subject<{ cartId: number, addedCount: number, notAddedCount: number }>();

        const behaviour = window.localStorage.getItem('afterAddingToCart');
        this.afterAddingToCart = behaviour === null ? null : Number(behaviour);
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

        return this.httpClient.get<b2b.CartPreviewItemResponse[]>('api/carts').toPromise();
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

        return this.httpClient.delete<boolean>('api/carts/' + cartId).toPromise();
    }

    /**
    * Removes cart with given id and updates model.
    * Returns promise with updated cart's list.
    */
    removeCart(cartId: number): Promise<boolean> {

        return this.requestRemoveCart(cartId).then((res: boolean) => {

            if (res) {


                this.carts.delete(cartId);

                //Map refference must be changed to rebind data. Changing map properties doesn't rebind data.
                this.carts = new Map(this.carts);

                this.recalculateSummary();

                if (this.router.url.toLowerCase().includes('carts')) {
                    const urlArray = this.router.url.split('/');

                    if (urlArray[urlArray.length - 1] === cartId.toString()) {
                        this.router.navigate(['/Items']);
                    }
                }

            }

            return true;

        });
    }

    /* ---- products operations ---- */

    /**
    * makes request for adding product to cart, returns request's promise
    */
    private requestAddToCart(productData: b2b.AddToCartRequest): Promise<b2b.CartPreviewItemResponse[]> {

        return this.httpClient.post<b2b.CartPreviewItemResponse[]>('api/carts/addToCartWithSummary', productData).toPromise();

    }


    /**
    * Adds product to cart, updates model, emits event.
    * Returns promise with updated carts list.
    */

    addToCart(productData: b2b.AddToCartRequest, callback?: Function): Promise<b2b.CartsPreview> {

        return this.requestAddToCart(productData).then((res: b2b.CartPreviewItemResponse[]) => {

            if (res) {
                this.setListData(res);
                this.productAdded.next({ cartId: productData.id, addedCount: 1, notAddedCount: 0 });

                if (this.afterAddingToCart === AfterAddingToCart.go) {
                    this.router.navigate(['/Carts/' + productData.id]);
                }

                return this.getPreviewData();
            }
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
                grossAmount: FormattingUtils.stringToNum(summary.grossAmount),
                netAmount: FormattingUtils.stringToNum(summary.netAmount),
                vatValue: FormattingUtils.stringToNum(summary.vatValue),
                id: cartId
            };
        });


        this.recalculateSummary();

        //change reference to force rebind
        //this.carts = new Map(this.carts);
    }

    saveAddToCartBehaviour(behaviourType: AfterAddingToCart): void {

        this.afterAddingToCart = behaviourType;
        window.localStorage.setItem('afterAddingToCart', behaviourType.toString());
    }


    /**
   * makes request for adding many products to cart, returns request's promise
   */
    private requestAddManyToCart(products: b2b.AddToCartRequest[]): Promise<b2b.AddManyToResponseItem[]> {

        return this.httpClient.post<b2b.AddManyToResponseItem[]>('api/carts/addManyToCart', products).toPromise();

    }


    /**
     * adding many products to cart
     */
    addManyToCart(products: b2b.AddToCartRequest[]): Promise<b2b.AddManyToResponseItem[]> {


        return this.requestAddManyToCart(products).then((res) => {

            const added = res.filter(item => item.success);
            const notAddedLength = res.length - added.length;

            if (added.length > 0) {

                this.productAdded.next({ cartId: products[0].id, addedCount: added.length, notAddedCount: notAddedLength });
                this.loadList();

                if (this.afterAddingToCart === AfterAddingToCart.go) {
                    this.router.navigate(['/Carts/' + products[0].id]);
                }
            }


            return res;
        });
    }

}
