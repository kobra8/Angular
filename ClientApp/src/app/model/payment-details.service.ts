import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { Router } from '@angular/router';
import { ArrayUtils } from '../helpers/array-utils';
import { CartsService } from './carts.service';

@Injectable()
export class PaymentDetailsService extends DocumentDetails {

    type: number;
    orders: b2b.IDs[];
    products: b2b.PaymentProduct[];
    paymentSummary: b2b.PaymentSummary;
    columns: Map<string, string>;

    constructor(httpClient: HttpClient, private router: Router, private cartsService: CartsService) {
        super(httpClient, 'paymentDetails');

        this.columns = new Map<string, string>()
            .set('name', 'codeName')
            .set('price', 'grossPrice')
            .set('discount', 'discount')
            .set('vatRate', 'vat')
            .set('quantity', 'quantity')
            .set('netValue', 'netValue')
            .set('grossValue', 'grossValue')
            .set('currency', 'currency')
            .set('complain', '');
    }

    protected requestDetails(id = this.id, type = this.type): Promise<b2b.PaymentDetailsResponse> {

        return this.httpClient.get<b2b.PaymentDetailsResponse>(`api/Payments/${id}/${type}`).toPromise();
    }


    loadDetails(id = this.id, type = this.type): Promise<b2b.PaymentDetailsResponse> {

        return this.requestDetails(id, type).then(res => {

            this.id = id;
            this.type = type;

            (<b2b.PaymentDetails>this.details) = res.set4[0];

            if (this.details.cartCount !== undefined) {
                this.details.cartCount = <string[]>ArrayUtils.toRangeArray(<string>this.details.cartCount, true);
            }

            //enums doesn't work with template strings
            this.details.printHref = 'PrintHandler.ashx?pageId=' + DocumentType.payment + '&documentId=' + this.id + '&documentTypeId=' + this.type + '&documentMode=' + this.details.isClip;

            this.products = res.set5.map(item => {
                item.discount = Number(item.discount) === 0 ? '' : item.discount + ' %';
                return item;
            });

            this.paymentSummary = res.set6[0];
            this.orders = res.set7;

            return res;

        });
    }

    private copyToCartRequest(cartId: number): Promise<void> {

        const body = {
            documentId: this.id,
            cartId: cartId,
            pageId: DocumentType.payment
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
