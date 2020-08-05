import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { CartsService } from './carts.service';
import { ConfigService } from './config.service';
import { DocumentStates } from './shared/document-states';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';
import { QuotesService } from './quotes.service';
import { b2bQuotes } from 'src/integration/b2b-quotes';
import { BoxMessageClass } from './shared/enums/box-message-class.enum';
import { BoxMessageType } from './shared/enums/box-message-type.enum';
import { b2bShared } from 'src/integration/b2b-shared';
import { PrintHandlerService } from './shared/printhandler.service';
import { Config } from '../helpers/config';
import { AddToCartResponseEnum } from './enums/add-to-cart-response-enum';
import { UiUtils } from '../helpers/ui-utils';

@Injectable()
export class QuoteDetailsService extends DocumentDetails {

    summaries: any[];
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;
    isPossibleToMakeAnOffer: boolean;

    constructor(
        httpClient: HttpClient,
        private cartsService: CartsService,
        configService: ConfigService,
        accountService: AccountService,
        menuService: MenuService,
        private quotesService: QuotesService,
        printHandlerService: PrintHandlerService
    ) {
        super(httpClient, configService, menuService, accountService, printHandlerService);

        this.headerResource = 'quoteDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            { property: 'price', translation: 'grossPrice', type: 'price' },
            { property: 'quantity', type: 'quantity' },
            { property: 'netValue', type: 'price', summaryProperty: 'net' },
            { property: 'grossValue', type: 'price', summaryProperty: 'gross' },
            { property: 'currency' }
        ];
    }

    protected requestDetails(id = this.id): Promise<b2bQuotes.GetQuoteDetailsResponse> {
        return this.httpClient.get<b2bQuotes.GetQuoteDetailsResponse>('/api/quotes/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2bQuotes.GetQuoteDetailsResponse> {

        this.products = undefined;

        return this.requestDetails(id).then(res => {
            this.calculateBaseDetailsAfterLoad(res.quoteDetails, id);

            this.detailsBoxMessages = this.prepareBoxMessagesIfRequired(res.quoteValidationObject);
            this.isPossibleToMakeAnOffer = res.quoteValidationObject.isPermissionToQuoteRealize;
            this.details.copyToCartDisabled = this.details.copyToCartDisabled || this.isPossibleToMakeAnOffer;

            this.products = res.quoteDetails.set5;
            this.summaries = res.quoteDetails.set6;

            if (!this.states) {
                this.states = DocumentStates.xlQuoteStates;
            }

            return res.quoteDetails as any;

        }).catch(err => {
            return Promise.reject(err);
        });
    }

    addToCartFromQuote() {
        this.configService.loaderSubj.next(true);
        this.detailsBoxMessages = undefined;
        const request: b2bQuotes.AddToCartFromQuoteRequest = {
            quoteId: this.id
        };

        return this.quotesService.addToCartFromQuote(request).then(res => {
            const status = this.cartsService.prepareAddToCartStatus(res, AddToCartResponseEnum.AllProductsAdded);
            this.cartsService.inCaseSuccessAddToCart(status);
            this.configService.loaderSubj.next(false);

        }).catch(err => {
            if (err.status === 406) {
                this.detailsBoxMessages = this.prepareMessageInCaseAddToCartFailed(BoxMessageType.MaxNumberOfCartsReached, BoxMessageClass.Warning);
                this.configService.loaderSubj.next(false);
                UiUtils.scrollToTop();
                return Promise.resolve();
            }
            if (err.status === 409) {
                this.detailsBoxMessages = this.prepareMessageInCaseAddToCartFailed(BoxMessageType.UnavailableArticles, BoxMessageClass.Danger);
                this.configService.loaderSubj.next(false);
                UiUtils.scrollToTop();
                return Promise.resolve();
            }

            this.configService.loaderSubj.next(false);
            return Promise.reject(err);
        });
    }

    copyToCart(cartId: number): Promise<void> {
        const body: b2b.CopyQuoteToCartRequest = {
            cartId: cartId,
            documentId: this.id,
            pageId: DocumentType.order, //Intentionally, this is how it should be. It forcing standard prices.
            sourceNumber: this.details.sourceNumber,
            stateId: this.details.state,
            createNewCart: cartId === Config.createNewCartId,
        };

        return this.cartsService.copyToCart(body);
    }

    private prepareBoxMessagesIfRequired(quoteValidationObject: b2bQuotes.QuoteDetailsValidation): b2bShared.BoxMessages {
        const messageTypes: BoxMessageType[] = [];

        if (quoteValidationObject.showRealizedQuoteWarning) {
            messageTypes.push(BoxMessageType.QuoteIsCompleted);
        }

        if (quoteValidationObject.showOutdatedQuoteWarning) {
            messageTypes.push(BoxMessageType.ExpiredQuote);
        }

        if (quoteValidationObject.showIncorrectStateOfQuoteWarning) {
            messageTypes.push(BoxMessageType.UnconfirmedQuote);
        }

        if (messageTypes.length > 0) {
            return <b2bShared.BoxMessages>{ boxMessageClass: BoxMessageClass.Warning, messages: messageTypes, showBoxMessage: true };
        }
        return null;
    }

    private prepareMessageInCaseAddToCartFailed(messageType: BoxMessageType, messageClass: BoxMessageClass): b2bShared.BoxMessages {
        return <b2bShared.BoxMessages>{ boxMessageClass: messageClass, messages: [messageType], showBoxMessage: true };
    }

    print() {
        return super.print(DocumentType.quote, this.id);
    }
}
