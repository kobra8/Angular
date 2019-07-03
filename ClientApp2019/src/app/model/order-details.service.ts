import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { Router } from '@angular/router';
import { DocumentType } from './enums/document-type.enum';
import { CartsService } from './carts.service';
import { ConfigService } from './config.service';
import { ConvertingUtils } from '../helpers/converting-utils';
import { DocumentStates } from './shared/document-states';
import { XlOrderStatus } from './enums/xl-order-status.enum';
import { AltumDocumentStatus } from './enums/altum-document-status.enum';
import { AccountService } from './account.service';

@Injectable()
export class OrderDetailsService extends DocumentDetails {

    summaries: b2b.CustomerListDetailsSummary[];
    quotes: b2b.IDs[];
    attributes: b2b.OrderHeaderAttribute[];
    weight: b2b.CartWeight;
    creditInfo: b2b.CreditLimitInfo;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(
        httpClient: HttpClient,
        private router: Router,
        private cartsService: CartsService,
        configService: ConfigService,
        accountService: AccountService
    ) {
        super(httpClient, configService, accountService);

        this.headerResource = 'orderDetails';

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'expectedDate' },
            { property: 'price', translation: 'grossPrice', type: 'price' },
            { property: 'discount', type: 'percent'},
            { property: 'quantity', translation: 'orderedQuantity', type: 'quantity' },
            { property: 'completedQuantity', classCondition: { valueEquals: 0, class: 'danger' } },
            { property: 'netValue', type: 'price', summaryProperty: 'net' },
            { property: 'grossValue', type: 'price', summaryProperty: 'gross' },
            { property: 'currency' }
        ];

    }

    protected requestDetails(id = this.id): Promise<b2b.OrderDetailsResponse> {

        return this.httpClient.get<any>('/api/orders/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.OrderDetailsResponse> {

        return super.loadDetails(id).then((listResponse) => {

            this.details.printHref = '/printhandler.ashx?pageid=' + DocumentType.order + '&documentid=' + this.id; //enums doesn't work with template strings

            this.details.canRemove = this.configService.permissions.removeUnconfirmedOrders
                && ((this.configService.applicationId === 0 && this.details.state === XlOrderStatus.unconfirmed)
                    || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed));

            this.details.canConfirm = this.configService.permissions.confirmOrders && this.details.isConfirm &&
                ((this.configService.applicationId === 0 && this.details.state === XlOrderStatus.unconfirmed)
                    || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed));

            this.products = listResponse.set5;
            this.products.forEach((item: b2b.OrderProduct) => {

                const converterParams = ConvertingUtils.splitConverterString(item.unitConversion);
                const priceNum = ConvertingUtils.stringToNum(item.price);
                item.basicPrice = ConvertingUtils.calculateBasicPrice(priceNum, converterParams.denominator, converterParams.numerator);
                item.basicUnit = converterParams.basicUnit;

            });

            this.quotes = listResponse.set7;
            this.attributes = listResponse.set1;


            if (this.configService.applicationId === 0) {
                this.weight = {
                    weightGross: this.details.totalWeight,
                    volume: this.details.volume
                };
                this.creditInfo = <b2b.CreditLimitInfo>listResponse.set8[0];
            } else {
                this.creditInfo = <b2b.CreditLimitInfo>{};
                this.weight = <b2b.CartWeight>listResponse.set8[0];
            }



            this.summaries = listResponse.set6;

            if (this.configService.applicationId === 1) {
                this.summaries.forEach(summary => {
                    summary.count = this.products.filter(item => item.currency === summary.currency).length;
                });
            }

            if (!this.states) {
                this.states = DocumentStates.xlOrderStates;
            }

            return listResponse;

        });

    }



    private requestConfirm(): Promise<b2b.ConfirmOrderResponse> {
        return this.httpClient.post<b2b.ConfirmOrderResponse>('/api/orders/confirm/' + this.id, null).toPromise();
    }

    confirm(): Promise<b2b.ConfirmOrderResponse> {

        return this.requestConfirm().then(res => {

            if (res.isConfirmed) {
                this.details.isConfirm = 0;
                this.details.canConfirm = false;
                this.details.canRemove = false;


                if (this.configService.applicationId === 0) {
                    this.details.state = XlOrderStatus.confirmed;                    
                } else {
                    this.details.state = AltumDocumentStatus.confirmed;  
                }

                if (this.cartsService.updateOrdersObserver) {
                    this.cartsService.updateOrdersObserver.next({
                        id: this.id,
                        number: this.details.number
                    });
                }
            }

            
            this.creditInfo.exceededCreditLimit = res.exceededCreditLimit;
            

            return res;
        });
    }

    private removeRequest(): Promise<boolean> {
        return this.httpClient.post<boolean>('/api/orders/remove/' + this.id, null).toPromise();
    }

    remove(): Promise<boolean> {

        return this.removeRequest().then(res => {
            if (res) {
                if (this.cartsService.updateOrdersObserver) {
                    this.cartsService.updateOrdersObserver.next({
                        id: this.id,
                        number: this.details.number
                    });
                }
                this.router.navigate([this.configService.routePaths.orders]);
                return res;
            }
        });
    }

    private closeRequest(): Promise<boolean> {
        return this.httpClient.post<boolean>('/api/orders/close/' + this.id, null).toPromise();
    }

    close(): Promise<boolean> {

        return this.closeRequest().then(res => {
            if (res) {
                if (this.cartsService.updateOrdersObserver) {
                    this.cartsService.updateOrdersObserver.next({
                        id: this.id,
                        number: this.details.number
                    });
                }
                this.router.navigate([this.configService.routePaths.orders]);
                return res;
            }
        });
    }

    private copyToCartRequest(cartId: number): Promise<void> {

        const body = {
            documentId: this.id,
            cartId: cartId,
            pageId: DocumentType.order
        };

        return this.httpClient.post<void>('/api/carts/copytocart', body).toPromise();
    }

    copyToCart(cartId: number): Promise<void> {

        return this.copyToCartRequest(cartId).then(res => {

            this.cartsService.loadList();

            this.router.navigate([this.configService.routePaths.cart, cartId]);

            return res;
        });
    }
}
