import { HttpClient } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ArrayUtils } from '../../helpers/array-utils';


export abstract class DocumentDetails implements Resolve<any> {


    id: number;
    details: b2b.InquiryDetails & b2b.QuoteDetails & b2b.OrderDetails & b2b.PaymentDetails & b2b.ComplaintDetails & b2b.PromotionDetails & b2b.DeliveryDetails;

    abstract columns: Map<string, string>;

    listLoading: boolean;


    protected constructor(protected httpClient: HttpClient, public headerResource: string) {
        //this.columns = this.getColumns();
    }

    /**
     * Makes request for details
     */
    protected abstract requestDetails(id: number): Promise<any>;


    /**
     * Makes request for details and updates model properly
     */
    loadDetails(id = this.id): Promise<any> {

        this.listLoading = true;
        return this.requestDetails(id).then(res => {

            this.id = id;
            this.details = res.set4[0];

            if (this.details && this.details.cartCount !== undefined) {
                this.details.cartCount = <string[]>ArrayUtils.toRangeArray(<string>this.details.cartCount, true);
            }
            if (this.details && this.details.priceMode !== undefined) {
                this.details.priceMode = Number(this.details.priceMode);
            }


            if (this.details.vatDirection === 'N' && this.columns.has('price')) {
                this.columns.set('price', 'netPrice');
            }

            this.listLoading = false;
            return res;

        });
    }


    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): any {
        return this;
    }


}
