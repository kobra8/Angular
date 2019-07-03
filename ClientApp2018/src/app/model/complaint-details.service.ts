import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';

@Injectable()
export class ComplaintDetailsService extends DocumentDetails {

    

    products: b2b.ComplaintProduct[];
    completion: b2b.ComplaintCompletion[];
    columns: Map<string, string>;

    constructor(httpClient: HttpClient) {
        super(httpClient, 'complaintDetails');

        this.headerResource = 'complaintDetails';

        this.columns = new Map<string, string>()
            .set('name', 'codeName')
            .set('sourceDocumentId', 'purchaseDocument')
            .set('quantity', 'quantity')
            .set('reason', 'complaintReason')
            .set('request', 'request')
            .set('completion', 'state');
    }

    protected requestDetails(id = this.id): Promise<b2b.ComplaintDetailsResponse> {

        return this.httpClient.get<b2b.ComplaintDetailsResponse>('api/complaints/' + id).toPromise();
    }


    loadDetails(id = this.id): Promise<b2b.ComplaintDetailsResponse> {

        return super.loadDetails(id).then((res: b2b.ComplaintDetailsResponse) => {

            this.details.printHref = 'PrintHandler.ashx?pageId=' + DocumentType.complaint + '&documentId=' + this.id;
            this.products = res.set5;
            this.completion = res.set6;

            //move document id to details (unifying with other documents)
            this.details.id = this.products[0].id;
            delete this.products[0].id;

            return res;
        });
    }



}
