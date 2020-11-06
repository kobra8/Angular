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
import { MenuService } from './menu.service';
import { CacheService } from './cache.service';
import { CommonAvailableCartsService } from './shared/common-available-carts.service';

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
        accountService: AccountService,
        menuService: MenuService,
        private cacheService: CacheService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {
        super(httpClient, configService, menuService, accountService);

        this.headerResource = 'orderDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'expectedDate' },
            { property: 'price', translation: 'grossPrice', type: 'priceWithConverter', priceConverter: 'basicUnitPrice' },
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

            this.details.canRemove = this.configService.permissions.hasAccessToDeleteUncofirmedOrder
                && ((this.configService.applicationId === 0 && this.details.state === XlOrderStatus.unconfirmed)
                    || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed));

            this.details.canConfirm = this.configService.permissions.hasAccessToConfirmOrder && this.details.isConfirm &&
                ((this.configService.applicationId === 0 && this.details.state === XlOrderStatus.unconfirmed)
                    || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed));

            this.products = listResponse.set5;
            this.products.forEach((item: b2b.OrderProduct) => {

                const converterParams = ConvertingUtils.splitConverterString(item.unitConversion);
                item.basicUnitPrice = ConvertingUtils.calculateBasicUnitPrice(item.price, converterParams.denominator, converterParams.numerator);
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

        }).catch(err => {
            return Promise.reject(err);
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

                this.cacheService.clearCache('/api/orders');

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

                return this.cacheService.clearCache('/api/orders').then(() => {
                    this.router.navigate([this.menuService.routePaths.orders]);
                    return res;
                });
                
            }
        });
    }

    copyToCart(cartId: number): Promise<void> {

        const body: b2b.CopyOrderToCartRequest = {
            cartId: cartId,
            documentId: this.id,
            pageId: DocumentType.order
        };

        return this.cartsService.copyToCartRequest(body).then(() => {

            this.cartsService.loadList();

            this.router.navigate([this.menuService.routePaths.cart, cartId]);
            this.commonAvailableCartsService.refreshAvailableCarts();

        }).catch(err => {
            return Promise.reject(err);
        });
    }
}
