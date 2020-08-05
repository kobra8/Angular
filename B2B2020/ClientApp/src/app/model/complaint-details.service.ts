import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { DocumentStates } from './shared/document-states';
import { ConfigService } from './config.service';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';
import { PrintHandlerService } from './shared/printhandler.service';

@Injectable()
export class ComplaintDetailsService extends DocumentDetails {

    completion: b2b.ComplaintCompletion[];
    columns: b2b.ColumnConfig[];
    images: {id: number, default?: 0 | 1, fromBinary: boolean}[];
    states: Map<number, string>;
    headerResource: string;

    constructor(httpClient: HttpClient, configService: ConfigService, menuService: MenuService, accountService: AccountService, printHandlerService: PrintHandlerService) {
        super(httpClient, configService, menuService, accountService, printHandlerService);

        this.headerResource = 'complaintDetails';

        this.columns = [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productName' },
            {
                type: 'linkedDocument',
                translation: 'purchaseDocument',
                link: {
                    hrefCreator: this.paymentHrefCreator.bind(this),
                    labelProperty: 'sourceDocumentName'
                },
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

            this.products = res.set5;
            this.completion = res.set6;
            this.images = res.set3;

            //move document id to details (unification with other documents)
            this.details.id = this.products[0].id;
            delete this.products[0].id;

            this.details.copyToCartDisabled = true;

            if (!this.states) {
                this.states = DocumentStates.xlComplaintStates;
            }

            return res;
        }).catch(err => {
            return Promise.reject(err);
        });
    }

    print() {
        return super.print(DocumentType.complaint, this.id);
    }

    paymentHrefCreator(item: b2b.ComplaintProduct) {
        return `/${this.menuService.routePaths.paymentDetails}/${item.sourceDocumentId}/${item.sourceDocumentType}`;
    }

}
