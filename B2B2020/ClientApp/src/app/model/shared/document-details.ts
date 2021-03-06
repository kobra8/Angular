import { HttpClient } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DocumentStates } from './document-states';
import { ConfigService } from '../config.service';
import { AccountService } from '../account.service';
import { ConvertingUtils } from 'src/app/helpers/converting-utils';
import { MenuService } from '../menu.service';
import { b2bShared } from 'src/integration/b2b-shared';
import { PrintHandlerService } from './printhandler.service';
import { BoxMessageType } from './enums/box-message-type.enum';
import { BoxMessageClass } from './enums/box-message-class.enum';


export abstract class DocumentDetails implements Resolve<any> {


    id: number;
    detailsBoxMessages: b2bShared.BoxMessages;
    details: b2b.InquiryDetails & b2b.QuoteDetails & b2b.OrderDetails & b2b.PaymentDetails & b2b.ComplaintDetails & b2b.DeliveryDetails;
    attachments: b2b.Attachement[];
    products: (b2b.OrderProduct & b2b.PaymentProduct & b2b.PromotionProduct & b2b.ComplaintProduct & b2b.DeliveryProduct & b2b.InquiryProduct & any)[];
    abstract states: Map<number, string>;
    abstract columns: b2b.ColumnConfig[];
    abstract headerResource: string;

    /**
     * Payments only
     */
    type: number;



    protected constructor(
        protected httpClient: HttpClient,
        protected configService: ConfigService,
        protected menuService: MenuService,
        protected accountService: AccountService,
        protected printHandlerService: PrintHandlerService
    ) {


        this.accountService.logOutSubj.subscribe(() => {
            this.products = undefined;
            this.details = undefined;
            this.attachments = undefined;
            this.id = undefined;
        });
    }

    /**
     * Makes request for details
     */
    protected abstract requestDetails(id: number, type?: number): Promise<any>;


    /**
     * Makes request for details and updates model properly
     */
    loadDetails(id = this.id, type?: number): Promise<any> {

        return this.requestDetails(id, type).then(res => {
            this.calculateBaseDetailsAfterLoad(res.items || res, id, type);
            return res;

        }).catch(err => {
            return Promise.reject(err);
        });
    }

    calculateBaseDetailsAfterLoad(detailsRes: any, id: number, type?: number) {
        this.id = id;
        this.details = detailsRes.set4[0] || {};
        this.attachments = detailsRes.set2;

        if (this.type !== undefined) {
            this.type = type;
        }

        if (this.details && this.configService.config.priceMode !== undefined) {
            this.configService.config.priceMode = Number(this.configService.config.priceMode);
        }

        if (this.details.vatDirection === 'N') {

            this.columns.forEach(el => {
                if (el.property === 'price') {
                    el.translation = 'netPrice';
                }
            });
        }

        if (this.details.vatDirection === 'B') {

            this.columns.forEach(el => {
                if (el.property === 'price') {
                    el.translation = 'grossPrice';
                }
            });
        }

        if (this.configService.applicationId === 1) {
            //Altum states are unified. XL states not, so XL states must be set in specific services.
            this.states = DocumentStates.altumAllStates;
        }

        if (detailsRes.set5[0] && detailsRes.set5[0].price) {
            detailsRes.set5.forEach(product => {
                product.price = ConvertingUtils.stringToNum(product.price);
            });
        }

        this.checkIfShowDetailsIsRequired();
    }


    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        return this;
    }


    print(pageId: number, documentId: number, documentTypeId?: number, documentMode?: number): Promise<void> {
        this.clearDetailsBoxMessages();
        this.configService.loaderSubj.next(true);
        return this.printHandlerService.print(pageId, documentId, documentTypeId, documentMode).then(() => {
            this.configService.loaderSubj.next(false);
        }).catch(() => {
            this.detailsBoxMessages = this.preparePrintBoxMessages();
            this.configService.loaderSubj.next(false);
        });
    }

    clearDetailsBoxMessages() {
        this.detailsBoxMessages = null;
    }

    private preparePrintBoxMessages(): b2bShared.BoxMessages {
        return <b2bShared.BoxMessages>{ boxMessageClass: BoxMessageClass.Danger, messages: [BoxMessageType.PrintFailed], showBoxMessage: true };
    }

    protected checkIfShowDetailsIsRequired(): void {
        this.details.showDetails = this.columns && this.columns.length > 1;
    }
}
