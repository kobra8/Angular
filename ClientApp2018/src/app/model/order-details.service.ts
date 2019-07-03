import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { Router } from '@angular/router';
import { DocumentType } from './enums/document-type.enum';
import { CartsService } from './carts.service';
import { PermissionHelper } from '../helpers/permission-helper';
import { CreditLimitMode } from './enums/credit-limit-mode.enum';
import { ConfigService } from './config.service';

@Injectable()
export class OrderDetailsService extends DocumentDetails {

    summaries: b2b.CustomerListDetailsSummary[];
    products: b2b.OrderProduct[];
    quotes: b2b.IDs[];
    attributes: b2b.OrderHeaderAttribute[];
    weight: b2b.CartWeight;
    creditInfo: b2b.CreditLimitInfo;
    columns: Map<string, string>;


    constructor(httpClient: HttpClient, private router: Router, private cartsService: CartsService, private configService: ConfigService) {
        super(httpClient, 'orderDetails');

        this.columns = new Map<string, string>()
            .set('name', 'codeName')
            .set('expectedDate', 'expectedDate')
            .set('price', 'grossPrice')
            .set('discount', 'discount')
            .set('quantity', 'orderedQuantity')
            .set('completedQuantity', 'completedQuantity')
            .set('netValue', 'netValue')
            .set('grossValue', 'grossValue')
            .set('currency', 'currency');
    }

    protected requestDetails(id = this.id): Promise<b2b.OrderDetailsResponse> {

        return this.httpClient.get<any>('api/Orders/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.OrderDetailsResponse> {

        const configPromise = this.configService.permissionsPromise;
        const listPromise = super.loadDetails(id);


        return Promise.all([configPromise, listPromise]).then((res) => {

            const listResponse: b2b.OrderDetailsResponse = res[1];

            this.details.printHref = 'PrintHandler.ashx?pageId=' + DocumentType.order + '&documentId=' + this.id; //enums doesn't work with template strings

            this.products = listResponse.set5;
            this.products.forEach((item: b2b.OrderProduct) => {
                item.discount = item.discount === 0 ? '' : item.discount + ' %';
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

            return listResponse;
            
        });

    }



    private requestConfirm(): Promise<b2b.ConfirmOrderResponse> {
        return this.httpClient.post<b2b.ConfirmOrderResponse>('api/Orders/confirm/' + this.id, null).toPromise();
    }

    confirm(): Promise<b2b.ConfirmOrderResponse> {

        return this.requestConfirm().then(res => {

            if (res.isConfirmed) {
                this.details.isConfirm = 0;
                this.details.stateResource = 'orderStateConfirmed';
                delete this.details.state;
            }

            if (res.exceededCreditLimit) {
                this.creditInfo.exceededCreditLimit = true;
            } else {
                this.creditInfo.exceededCreditLimit = false;
            }

            return res;
        });
    }

    private removeRequest(): Promise<boolean> {
        return this.httpClient.post<boolean>('api/Orders/remove/' + this.id, null).toPromise();
    }

    remove(): Promise<boolean> {

        return this.removeRequest().then(res => {
            if (res) {
                this.router.navigate(['/Profile/Orders']);
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

        return this.httpClient.post<void>('api/Carts/copyToCart', body).toPromise();
    }

    copyToCart(cartId: number): Promise<void> {

        return this.copyToCartRequest(cartId).then(res => {

            this.cartsService.loadList();

            this.router.navigate(['Carts', cartId]);

            return res;
        });
    }
}
