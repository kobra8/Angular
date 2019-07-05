import { HttpClient } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ArrayUtils } from '../../helpers/array-utils';
import { DocumentStates } from './document-states';
import { ConfigService } from '../config.service';
import { AccountService } from '../account.service';


export abstract class DocumentDetails implements Resolve<any> {


    id: number;
    details: b2b.InquiryDetails & b2b.QuoteDetails & b2b.OrderDetails & b2b.PaymentDetails & b2b.ComplaintDetails & b2b.DeliveryDetails;
    attachments: b2b.ProductAttachement[];
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
        protected accountService: AccountService
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
     * Method includes waiting for configuration and permissions.
     */
    loadDetails(id = this.id, type?: number): Promise<any> {

        const detailsPromise = this.requestDetails(id, type);
        const configPromise = this.configService.allConfigsPromise;

        return Promise.all([configPromise, detailsPromise]).then(res => {

            const detailsRes = res[1];

            this.id = id;
            this.details = detailsRes.set4[0] || {};
            this.attachments = detailsRes.set2;

            if (this.type !== undefined) {
                this.type = type;
            }

            if (this.details && this.details.cartCount !== undefined) {
                this.details.cartCount = ArrayUtils.toRangeArray<number>(detailsRes.set4[0].cartCount, true);
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

            if (this.configService.applicationId === 1) {
                //Altum states are unified. XL states not, so XL states must be set in specific services.
                this.states = DocumentStates.altumAllStates;
            }

            return detailsRes;

        });
    }


    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        return this;
    }


}
