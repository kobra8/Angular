import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2bCarts } from 'src/integration/b2b-carts';
import { HttpClient } from '@angular/common/http';
import { AfterAddingToCart } from './enums/after-adding-to-cart.enum';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ConfigService } from './config.service';
import { MenuService } from './menu.service';
import { AddToCartResponseEnum } from './enums/add-to-cart-response-enum';
import { CommonAvailableCartsService } from './shared/common-available-carts.service';
import * as FileSaver from 'file-saver';
import { ApplicationType } from './enums/application-type.enum';

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

    addToCartBehaviour: b2bCarts.AddToCartBehaviour;
    productAdded: Subject<b2bCarts.AddToCartStatus>;
    cartNameChanged: Subject<b2bCart.CartIdentifier>;

    allCarts: number[];

    cartPreviewExtra: b2b.GenericCollection<number, b2bCarts.CartPreviewExtraProperties>;
    get cartPreviewExtraLength(): number {
        if (this.cartPreviewExtra) {
            return Object.keys(this.cartPreviewExtra).length;
        }
        return 0;
    }

    constructor(
        private httpClient: HttpClient,
        private router: Router,
        private configService: ConfigService,
        private menuService: MenuService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {

        this.productAdded = new Subject<b2bCarts.AddToCartStatus>();
        this.cartNameChanged = new Subject<b2bCart.CartIdentifier>();
        this.initAddToCartBehaviour();
    }

    private initAddToCartBehaviour() {
        const storageBehaviourType = window.localStorage.getItem('afterAddingToCart');

        if (storageBehaviourType) {
            this.addToCartBehaviour = this.prepareAddToCartBehaviour(true, Number(storageBehaviourType));
        } else {
            this.addToCartBehaviour = this.prepareAddToCartBehaviour(false, null);
        }
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

    private requestCartsList(): Promise<b2b.CartPreviewItemResponse[]> {

        return this.httpClient.get<b2b.CartPreviewItemResponse[]>('/api/carts').toPromise();
    }

    setListData(listData: b2b.CartPreviewItemResponse[]) {
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

    updateCartName(cartId: number, newCartName: string): Promise<void> {
        const request = {
            cartId: cartId,
            newCartName: newCartName
        } as b2bCarts.UpdateCartNameBaseRequest;

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateCartNameXl(request);

            case ApplicationType.ForAltum:
                return this.updateCartNameAltum(request);

            default:
                console.error(`updateCartName(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private updateCartNameXl(request: b2bCarts.UpdateCartNameXlRequest): Promise<void> {
        return this.updateCartNameXlRequest(request).then(() => {
            this.updateCartNameBase(request);
        });
    }

    private updateCartNameAltum(request: b2bCarts.UpdateCartNameAltumRequest): Promise<void> {
        return this.updateCartNameAltumRequest(request).then(() => {
            this.updateCartNameBase(request);
        });
    }

    private updateCartNameBase(request: b2bCarts.UpdateCartNameBaseRequest) {
        this.updateCartPreviewName(request.cartId, request.newCartName);
        this.commonAvailableCartsService.refreshAvailableCarts();
        this.cartNameChanged.next({cartId: request.cartId, cartName: request.newCartName});
    }

    private updateCartPreviewName(cartId: number, newCartName: string) {
        const cartPreview = this.carts.get(cartId);
        cartPreview.currencies.forEach(item => {
            item.cartName = newCartName;
        });
    }


    private updateCartNameXlRequest(request: b2bCarts.UpdateCartNameXlRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Carts/updateCartNameXl', request).toPromise();
    }

    private updateCartNameAltumRequest(request: b2bCarts.UpdateCartNameAltumRequest): Promise<void> {
        return this.httpClient.put<void>('/api/Carts/updateCartNameAltum', request).toPromise();
    }

    private requestRemoveCart(cartId: number): Promise<boolean> {

        return this.httpClient.delete<boolean>('/api/carts/' + cartId).toPromise();
    }

    removeCart(cartId: number): Promise<boolean> {
        this.configService.loaderSubj.next(true);

        return this.requestRemoveCart(cartId).then((res: boolean) => {

            if (res) {
                this.performAfterRemoveCart(cartId);
            }

            this.commonAvailableCartsService.refreshAvailableCarts();

            this.configService.loaderSubj.next(false);
            return true;
        });
    }


    private performAfterRemoveCart(cartId: number) {
        this.carts.delete(cartId);

        //Map refference must be changed to rebind data. Changing map properties doesn't rebind data.
        this.carts = new Map(this.carts);

        this.recalculateSummary();

        if (this.router.url.includes(this.menuService.routePaths.cart)) {
            const urlArray = this.router.url.split('/');

            if (urlArray[urlArray.length - 1] === cartId + '') {
                this.router.navigate([this.menuService.routePaths.home]);
            }
        }
    }

    /**
    * makes request for adding product to cart, returns request's promise
    */
    private requestAddToCart(products: b2b.AddToCartRequest): Promise<b2bCarts.AddToCartResponse> {
        return this.httpClient.post<b2bCarts.AddToCartResponse>('/api/carts/addToCart', products).toPromise();
    }


    addToCart(products: b2b.AddToCartRequest): Promise<void> {
        return this.requestAddToCart(products).then((res) => {
            if (res.addToCartResponseEnum !== AddToCartResponseEnum.FailedToAddAnyProducts) {
                this.inCaseSuccessAddToCart(res);
            }
        });
    }

    inCaseSuccessAddToCart(status: b2bCarts.AddToCartStatus) {
        this.loadList();
        this.productAdded.next(status);
        this.commonAvailableCartsService.refreshAvailableCarts();
    }

    prepareAddToCartStatus(cartIdentifier: b2bCart.CartIdentifier, addToCartResponseEnum: AddToCartResponseEnum): b2bCarts.AddToCartStatus {
        return {
            cartIdentifier: cartIdentifier,
            addToCartResponseEnum: addToCartResponseEnum
        };
    }


    updateSpecificCart(cartId: number, cartSummaries: b2b.CartSummary[]) {
        const cart = this.carts.get(cartId);
        cart.count = 0;

        const newCurrencies: b2b.CartPreviewItemResponse[] = [];

        cartSummaries.forEach((summary) => {
            const currency = cart.currencies.find(item => item.currency === summary.currency);
            if (!currency) {
                return;
            }

            cart.count += summary.count;
            this.updateCartPreviewCurrency(currency, summary);
            newCurrencies.push(currency);
        });

        cart.currencies = newCurrencies;
        this.recalculateSummary();
    }

    private updateCartPreviewCurrency(currency: b2b.CartPreviewItemResponse, summary: b2b.CartSummary) {
        currency.count = summary.count;
        currency.grossAmount = ConvertingUtils.stringToNum(summary.grossAmount);
        currency.netAmount = ConvertingUtils.stringToNum(summary.netAmount);
        currency.vatValue = ConvertingUtils.stringToNum(summary.vatValue);
    }

    saveAddToCartBehaviour(behaviourType: AfterAddingToCart): void {

        this.addToCartBehaviour = this.prepareAddToCartBehaviour(true, behaviourType);
        window.localStorage.setItem('afterAddingToCart', behaviourType + '');
    }

    private prepareAddToCartBehaviour(isRemembered: boolean, behaviourType?: AfterAddingToCart): b2bCarts.AddToCartBehaviour {
        return {
            isBehaviourTypeRemembered: isRemembered,
            behaviourType: behaviourType
        };
    }


    private importFromCsvRequest(request: b2bCarts.ImportFromCsvRequest): Promise<b2b.ImportFromCsvResponse> {
        return this.httpClient.post<b2b.ImportFromCsvResponse>(`/api/carts/importFromCsv?cartId=${request.cartId}&createNewCart=${request.createNewCart}`, request.csvFile).toPromise();
    }

    importFromCsv(request: b2bCarts.ImportFromCsvRequest): Promise<b2b.ImportFromCsvResponse> {
        return this.importFromCsvRequest(request);
    }

    private copyToCartRequest(body: b2b.CopyToCartRequest): Promise<b2bCarts.CopyToCartResponse> {
        return this.httpClient.post<b2bCarts.CopyToCartResponse>('/api/carts/copytocart', body).toPromise();
    }

    copyToCart(body: b2b.CopyToCartRequest) {
        return this.copyToCartRequest(body).then((res) => {
            this.inCaseSuccessAddToCart(res);
        });
    }

    private downloadDefaultCsvRequest(): Promise<any> {
        return this.httpClient.get('/api/carts/getDefaultCsv/', { responseType: 'arraybuffer', observe: 'response' }).toPromise();
    }

    downloadDefaultCsv(): Promise<void> {
        return this.downloadDefaultCsvRequest().then((res) => {
            const fileName = res.headers.get('content-disposition').split('filename=')[1];
            const blob = new Blob([res.body], { type: 'application/octet-stream' });
            FileSaver.saveAs(blob, fileName);
        });
    }
}


