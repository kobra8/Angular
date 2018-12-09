import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { FormattingUtils } from '../helpers/formatting-utils';
import { DocumentType } from './enums/document-type.enum';
import { Router } from '@angular/router';
import { CartsService } from './carts.service';
import { DateHelper } from '../helpers/date-helper';
import { PermissionHelper } from '../helpers/permission-helper';
import { QuoteStatus } from './enums/quote-status.enum';
import { ConfigService } from './config.service';

@Injectable()
export class QuoteDetailsService extends DocumentDetails {


    summaries: any[];
    products: b2b.CustomerListProduct[];
    columns: Map<string, string>;

    constructor(httpClient: HttpClient, private router: Router, private cartsService: CartsService, private configService: ConfigService) {
        super(httpClient, 'quoteDetails');

        this.columns = this.getColumns();
    }

    protected requestDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {
        return this.httpClient.get<b2b.QuoteDetailsResponse>('api/Quotes/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {

        this.products = undefined;

        const permissionsPromise = this.configService.permissionsPromise;
        const listPromise = super.loadDetails(id);

        return Promise.all([permissionsPromise, listPromise]).then((res) => {

            const listResponse: b2b.QuoteDetailsResponse = res[1];

            this.details.printHref = 'PrintHandler.ashx?pageId=' + DocumentType.quote + '&documentId=' + this.id;

            this.details.copyToCartDisabled = (this.details.stateId === QuoteStatus.orderCreated && this.details.createManyOrders === 0) || this.details.stateId === QuoteStatus.unconfirmed; //&& this.details.stateId !== 2 && this.details.stateId !== 3 && this.details.stateId !== 5;

            if (this.details.expirationDate) {
                this.details.copyToCartDisabled = this.details.copyToCartDisabled || DateHelper.endOfDay(new Date(this.details.expirationDate)) < new Date();
            }

            this.columns = this.getColumns();

            if (!this.configService.permissions.canChangeQuoteQuantity) {
                this.details.quantityDisabled = true;
            }

            if (this.details.isEditable && !this.details.copyToCartDisabled) {
              
                this.products = listResponse.set5.map(item => {
                    item.cartId = 1;
                    item.quantity = item.quantity || 0;
                    item.fromQuote = this.id.toString();
                    return item;
                });

            } else {

                this.products = listResponse.set5;
            }

            this.summaries = listResponse.set6;

            return listResponse;

        });
    }


    private copyToCartRequest(cartId: number): Promise<void> {

        const body = {
            documentId: this.id,
            cartId: cartId,
            //pageId: CustomerListType.quote,
            pageId: DocumentType.order, //has to be standard prices
            sourceNumber: this.details.sourceNumber,
            stateId: this.details.stateId
        };

        return this.httpClient.post<void>('api/Carts/copyToCart', body).toPromise();
    }

    copyToCart(cartId: number): Promise<void> {

        return this.copyToCartRequest(Number(cartId)).then(res => {

            this.cartsService.loadList();
            this.router.navigate(['Carts', cartId]);
            return res;
        });
    }

    private getColumns(): Map<string, string> {


        if (this.details && (!this.details.isEditable || this.details.copyToCartDisabled)) {

            return new Map<string, string>()
                .set('name', 'codeName')
                .set('price', 'grossPrice')
                .set('quantity', 'quantity')
                .set('netValue', 'netValue')
                .set('grossValue', 'grossValue')
                .set('currency', 'currency');

        } else {

            return new Map<string, string>()
                .set('name', 'codeName')
                .set('price', 'netPrice')
                .set('netValue', 'netValue')
                .set('grossValue', 'grossValue')
                .set('currency', 'currency')
                .set('addToCart', '');
        }


    }

}
