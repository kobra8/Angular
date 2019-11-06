import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';

@Injectable()
export class ComplaintDetailsService extends DocumentDetails {

    completion: b2b.ComplaintCompletion[];
    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(httpClient: HttpClient, configService: ConfigService, accountService: AccountService) {
        super(httpClient, configService, accountService);

        this.headerResource = 'complaintDetails';

        this.columns = [
            { property: 'name', translation: 'codeName', type: 'productName' },
            {
                translation: 'purchaseDocument', type: 'linkedDocument', link: {
                    href: '/profile/payments',
                    labelProperty: 'sourceDocumentName',
                    paramProperty: ['sourceDocumentId', 'sourceDocumentType']
                }
            },
            { property: 'quantity', type: 'quantity' },
            { property: 'reason', translation: 'complaintReason' },
            { property: 'request', },
            { property: 'completion', translation: 'state', type: 'complaintHistory'}
        ];

        
    }

    protected requestDetails(id = this.id): Promise<b2b.ComplaintDetailsResponse> {

        return this.httpClient.get<b2b.ComplaintDetailsResponse>('/api/complaints/' + id).toPromise();
    }


    loadDetails(id = this.id): Promise<b2b.ComplaintDetailsResponse> {

        return super.loadDetails(id).then((res: b2b.ComplaintDetailsResponse) => {

            this.details.printHref = '/printhandler.ashx?pageid=' + DocumentType.complaint + '&documentid=' + this.id;
            this.products = res.set5;
            this.completion = res.set6;

            //move document id to details (unification with other documents)
            this.details.id = this.products[0].id;
            delete this.products[0].id;

            if (!this.states) {
                this.states = DocumentStates.xlComplaintStates;
            }

            return res;
        });
    }



}
