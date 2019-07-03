import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { Router } from '@angular/router';
import { CartsService } from './carts.service';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class PaymentDetailsService extends DocumentDetails {

    type: number;
    orders: b2b.IDs[];
    paymentSummary: b2b.PaymentSummary;
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    attachments: b2b.ProductAttachement[];
    headerResource: string;

    constructor(httpClient: HttpClient, private router: Router, private cartsService: CartsService, configService: ConfigService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.headerResource = 'paymentDetails';

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'price', translation: 'grossPrice', type: 'price' },
            { property: 'discount', type: 'percent' },
            { property: 'vatRate', translation: 'vat' },
            { property: 'quantity', type: 'quantity' },
            { property: 'netValue', type: 'price', summaryProperty: 'net' },
            { property: 'grossValue', type: 'price', summaryProperty: 'gross' },
            { property: 'currency' },
            { property: 'complain', translation: ' ', type: 'complain' }
        ];

        
    }

    protected requestDetails(id = this.id, type = this.type): Promise<b2b.PaymentDetailsResponse> {

        return this.httpClient.get<b2b.PaymentDetailsResponse>(`/api/payments/${id}/${type}`).toPromise();
    }


    loadDetails(id = this.id, type = this.type): Promise<b2b.PaymentDetailsResponse> {

        return super.loadDetails(id, type).then(res => {

            this.type = type;

            //enums doesn't work with template strings
            this.details.printHref = 'printhandler.ashx?pageid=' + DocumentType.payment + '&documentid=' + this.id + '&documenttypeid=' + this.type + '&documentmode=' + this.details.isClip;

            this.products = res.set5.map(item => {
                item.discount = Number(item.discount) === 0 ? '' : item.discount + ' %';
                return item;
            });

            this.paymentSummary = res.set6[0];
            this.orders = res.set7;

            if (!this.details) {
                this.states = DocumentStates.xlPaymentStates;
            }

            return res;

        });
    }

    private copyToCartRequest(cartId: number): Promise<void> {

        const body = {
            documentId: this.id,
            cartId: cartId,
            pageId: DocumentType.payment,
            documentTypeId: this.type
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
