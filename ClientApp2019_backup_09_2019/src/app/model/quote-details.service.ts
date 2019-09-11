import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { Router } from '@angular/router';
import { CartsService } from './carts.service';
import { DateHelper } from '../helpers/date-helper';
import { XLQuoteStatus } from './enums/xl-quote-status.enum';
import { ConfigService } from './config.service';
import { DocumentStates } from './shared/document-states';
import { AltumDocumentStatus } from './enums/altum-document-status.enum';
import { AccountService } from './account.service';
import { ArrayUtils } from '../helpers/array-utils';

@Injectable()
export class QuoteDetailsService extends DocumentDetails {


    summaries: any[];
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(httpClient: HttpClient, private router: Router, private cartsService: CartsService, configService: ConfigService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.headerResource = 'quoteDetails';

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'price', translation: 'grossPrice', type: 'price' },
            { property: 'quantity', type: 'quantity' },
            { property: 'netValue', type: 'price', summaryProperty: 'net' },
            { property: 'grossValue', type: 'price', summaryProperty: 'gross' },
            { property: 'currency' }
        ];
        
    }

    protected requestDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {
        return this.httpClient.get<b2b.QuoteDetailsResponse>('/api/quotes/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {

        this.products = undefined;

        return super.loadDetails(id).then((listResponse) => {

            this.details.printHref = 'printhandler.ashx?pageId=' + DocumentType.quote + '&documentId=' + this.id;

            const isUnconfirmed = (this.configService.applicationId === 0 && this.details.state === XLQuoteStatus.unconfirmed)
                || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed);

            const isOrderCreated = (this.configService.applicationId === 0 && this.details.state === XLQuoteStatus.orderCreated); //XL only

            this.details.copyToCartDisabled = isUnconfirmed || (isOrderCreated && this.details.createManyOrders === 0); 

            if (this.details.expirationDate) {
                this.details.copyToCartDisabled = this.details.copyToCartDisabled || DateHelper.endOfDay(new Date(this.details.expirationDate)) < new Date();
            }

            this.changeColumns();

            if (!this.configService.permissions.canChangeQuoteQuantity) {
                this.details.quantityDisabled = true;
            }

            if (this.details.isEditable && !this.details.copyToCartDisabled) {
              
                this.products = listResponse.set5.map(item => {
                    item.cartId = 1;
                    item.quantity = item.quantity || 0;
                    item.fromQuote = this.id + '';
                    return item;
                });

            } else {

                this.products = listResponse.set5;
            }

            this.summaries = listResponse.set6;

            if (!this.states) {
                this.states = DocumentStates.xlQuoteStates;
            }

            return listResponse;

        });
    }


    private copyToCartRequest(cartId: number): Promise<void> {

        const body = {
            documentId: this.id,
            cartId: cartId,
            pageId: DocumentType.order, //has to be standard prices
            sourceNumber: this.details.sourceNumber,
            stateId: this.details.state
        };

        return this.httpClient.post<void>('/api/carts/copytocart', body).toPromise();
    }

    copyToCart(cartId: number): Promise<void> {

        return this.copyToCartRequest(Number(cartId)).then(res => {

            this.cartsService.loadList();
            this.router.navigate([this.configService.routePaths.cart, cartId]);
            return res;
        });
    }

    private changeColumns(): void {

        const lastItem = this.columns[this.columns.length - 1];
        const quantityColumnIndex = this.columns.findIndex(column => column.property === 'quantity');

        if (this.details.isEditable && !this.details.copyToCartDisabled) {

            if (lastItem.property !== 'addToCart') {
                this.columns[this.columns.length] = { property: 'addToCart', type: 'addToCart' };
            }


            if (quantityColumnIndex >= 0) {
                this.columns = ArrayUtils.remove(this.columns, quantityColumnIndex);
            }

        } else {

            if (lastItem.property === 'addToCart') {
                this.columns.pop();
            }

            if (quantityColumnIndex === -1) {

                const priceColumnIndex = this.columns.findIndex(column => column.property === 'price');
                this.columns = ArrayUtils.insert(this.columns, priceColumnIndex, { property: 'quantity', type: 'quantity' });
            }

            
        }

    }

}
