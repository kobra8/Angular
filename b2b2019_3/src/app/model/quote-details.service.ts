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
import { MenuService } from './menu.service';
import { QuotesService } from './quotes.service';
import { b2bQuotes } from 'src/b2b-quotes';
import { AfterAddingToCart } from './enums/after-adding-to-cart.enum';
import { AddToCartResponseEnum } from './enums/add-to-cart-response-enum';
import { ModalMessageType } from './shared/enums/modal-message-type';
import { BoxMessageClass } from './shared/enums/box-message-class.enum';
import { BoxMessageType } from './shared/enums/box-message-type.enum';
import { b2bShared } from 'src/b2b-shared';
import { CommonAvailableCartsService } from './shared/common-available-carts.service';

@Injectable()
export class QuoteDetailsService extends DocumentDetails {


    summaries: any[];
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;
    noAvailableCartsToAddMessageType: ModalMessageType;

    constructor(
        httpClient: HttpClient,
        private router: Router,
        private cartsService: CartsService,
        configService: ConfigService,
        accountService: AccountService,
        menuService: MenuService,
        private quotesService: QuotesService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {
        super(httpClient, configService, menuService, accountService);

        this.headerResource = 'quoteDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'quantity', type: 'quantity' },
            { property: 'price', translation: 'grossPrice', type: 'price' },
            { property: 'netValue', type: 'price', summaryProperty: 'net' },
            { property: 'grossValue', type: 'price', summaryProperty: 'gross' },
            { property: 'currency' }
        ];

        this.noAvailableCartsToAddMessageType = ModalMessageType.noAvailableCartsToAddQuote;

    }

    protected requestDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {
        return this.httpClient.get<b2b.QuoteDetailsResponse>('/api/quotes/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.QuoteDetailsResponse> {

        this.products = undefined;

        return super.loadDetails(id).then((listResponse) => {

            this.details.printHref = 'printhandler.ashx?pageId=' + DocumentType.quote + '&documentId=' + this.id;

            const isConfirmed = ((this.configService.applicationId === 0 && this.details.state === XLQuoteStatus.sent)
                || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.accepted));

            const isQuoteExpired = this.details.expirationDate ? DateHelper.endOfDay(new Date(this.details.expirationDate)) < new Date() : false;

            this.details.isEditable = isConfirmed && !isQuoteExpired;
            this.detailsBoxMessages = this.prepareBoxMessagesIfRequired(isQuoteExpired);

            this.changeColumns();

            this.products = listResponse.set5;
            this.summaries = listResponse.set6;


            if (!this.states) {
                this.states = DocumentStates.xlQuoteStates;
            }

            return listResponse;

        }).catch(err => {
            return Promise.reject(err);
        });
    }


    addToCart(cartId: number, quoteId: number) {
        const request: b2bQuotes.AddToCartFromQuoteRequest = {
            cartId: cartId,
            quoteId: quoteId
        };

        return this.quotesService.addToCartFromQuote(request).then(res => {
            this.cartsService.productAdded.next({ cartId: cartId, addToCartResponseEnum: AddToCartResponseEnum.AllProductsAdded });
            this.cartsService.loadList();

            if (this.cartsService.afterAddingToCart === AfterAddingToCart.go) {
                this.router.navigate([this.menuService.routePaths.cart, cartId]);
            }

            this.commonAvailableCartsService.refreshAvailableCarts();

        }).catch(err => {
            return Promise.reject(err);
        });
    }


    copyToCart(cartId: number): Promise<void> {


        const body: b2b.CopyQuoteToCartRequest = {
            cartId: cartId,
            documentId: this.id,
            pageId: DocumentType.order, //Intentionally, this is how it should be. It forcing standard prices.
            sourceNumber: this.details.sourceNumber,
            stateId: this.details.state
        };

        return this.cartsService.copyToCartRequest(body).then(res => {

            this.cartsService.loadList();
            this.router.navigate([this.menuService.routePaths.cart, cartId]);
            this.commonAvailableCartsService.refreshAvailableCarts();
            return res;
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    private changeColumns(): void {

        const lastItem = this.columns[this.columns.length - 1];

        if (this.details.isEditable) {

            if (lastItem.property !== 'addToCart') {
                this.columns[this.columns.length] = { property: 'addToCart', type: 'quoteRealizationWithEmptyContent' };
            }

        } else {

            if (lastItem.property === 'addToCart') {
                this.columns.pop();
            }
        }
    }

    private prepareBoxMessagesIfRequired(isQuoteExpired: boolean): b2bShared.BoxMessages {
        const isQuoteCompleted = (this.configService.applicationId === 0 && this.details.state === XLQuoteStatus.orderCreated);
        const showUnconfirmedNotification = (this.configService.applicationId === 0 && (
            this.details.state === XLQuoteStatus.confirmed
            || this.details.state === XLQuoteStatus.accepted
            || this.details.state === XLQuoteStatus.rejected)
            || (this.configService.applicationId === 1 && (
                this.details.state === AltumDocumentStatus.confirmed)
                || this.details.state === AltumDocumentStatus.rejected));

        const messageTypes: BoxMessageType[] = [];
        if (isQuoteCompleted) {
            messageTypes.push(BoxMessageType.QuoteIsCompleted);
            return <b2bShared.BoxMessages>{ boxMessageClass: BoxMessageClass.Warning, messages: messageTypes, showBoxMessage: true };
        }

        if (isQuoteExpired) {
            messageTypes.push(BoxMessageType.ExpiredQuote);
        }

        if (showUnconfirmedNotification) {
            messageTypes.push(BoxMessageType.UnconfirmedQuote);
        }

        if (messageTypes.length > 0) {
            return <b2bShared.BoxMessages>{ boxMessageClass: BoxMessageClass.Warning, messages: messageTypes, showBoxMessage: true };
        }
        return null;
    }

}
