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
import { CreditLimitBehaviourEnum } from './shared/enums/credit-limit-behaviour.enum';
import { CustomerService } from './customer.service';
import { PrintHandlerService } from './shared/printhandler.service';
import { Config } from '../helpers/config';

@Injectable()
export class OrderDetailsService extends DocumentDetails {

    summaries: b2b.CustomerListDetailsSummary[];
    quotes: b2b.IDs[];
    attributes: b2b.OrderHeaderAttribute[];
    weight: b2b.CartWeight;
    creditLimitBehaviour: CreditLimitBehaviourEnum;
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
        private commonAvailableCartsService: CommonAvailableCartsService,
        private customerService: CustomerService,
        printHandlerService: PrintHandlerService
    ) {
        super(httpClient, configService, menuService, accountService, printHandlerService);

        this.headerResource = 'orderDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'expectedDate' },
            { property: 'price', translation: 'grossPrice', type: 'priceWithConverter', priceConverter: 'basicUnitPrice' },
            { property: 'discount', type: 'percent' },
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

            this.products = listResponse.set5;
            this.products.forEach((item: b2b.OrderProduct) => {

                const converterParams = ConvertingUtils.splitConverterString(item.unitConversion);
                item.basicUnitPrice = ConvertingUtils.calculateBasicUnitPrice(item.price, converterParams.denominator, converterParams.numerator);
                item.basicUnit = converterParams.basicUnit;

                if (item.description && item.description.length > Config.collapsedDescriptionLength) {
                    item.collapsedDescription = item.description.slice(0, Config.collapsedDescriptionLength) + '...';
                    item.isDescriptionOverflow = true;
                } else {
                    item.collapsedDescription = item.description;
                    item.isDescriptionOverflow = false;
                }
            });

            this.creditLimitBehaviour = listResponse.set8[0].creditLimitBehaviour;
            this.details.canConfirm = listResponse.set8[0].canConfirm;
            this.details.canRemove = listResponse.set8[0].canRemove;

            if (this.creditLimitBehaviour !== CreditLimitBehaviourEnum.NothingToDo || this.creditLimitBehaviour === CreditLimitBehaviourEnum.NothingToDo && this.details.canConfirm) {
                this.customerService.refreshCreditInfo();
            }

            this.quotes = listResponse.set7;
            this.attributes = listResponse.set1;

            this.weight = {
                weightGross: this.details.totalWeight,
                volume: this.details.volume
            };

            this.summaries = listResponse.set6;

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

    confirm(): Promise<void> {

        return this.requestConfirm().then((res: b2b.ConfirmOrderResponse) => {

            if (res.isConfirmed) {
                this.customerService.refreshCreditInfo();
                this.details.canConfirm = false;
                this.details.canRemove = false;
                this.creditLimitBehaviour = CreditLimitBehaviourEnum.NothingToDo;

                if (this.configService.applicationId === 0) {
                    this.details.state = XlOrderStatus.confirmed;
                } else {
                    this.details.state = AltumDocumentStatus.confirmed;
                }

                this.cacheService.clearCache('/api/orders');
                return;
            }

            if (res.exceededCreditLimit) {
                this.customerService.refreshCreditInfo();
                this.details.canConfirm = false;
                this.creditLimitBehaviour = CreditLimitBehaviourEnum.ShowErrorAndBlockOperation;
            }
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

    private closeRequest(): Promise<boolean> {
        return this.httpClient.post<boolean>('/api/orders/close/' + this.id, null).toPromise();
    }

    close(): Promise<boolean> {

        return this.closeRequest().then(res => {
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
            pageId: DocumentType.order,
            createNewCart: cartId === Config.createNewCartId,
        };

        return this.cartsService.copyToCart(body);
    }

    print() {
        return super.print(DocumentType.order, this.id);
    }
}
