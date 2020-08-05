import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { ConfigService } from './config.service';
import { Router } from '@angular/router';
import { DocumentStates } from './shared/document-states';
import { XlInquiryStatus } from './enums/xl-inquiry-status.enum';
import { AltumDocumentStatus } from './enums/altum-document-status.enum';
import { InquiriesService } from './inquiries.service';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';
import { CacheService } from './cache.service';
import { PrintHandlerService } from './shared/printhandler.service';

@Injectable()
export class InquiryDetailsService extends DocumentDetails {


    columns: b2b.ColumnConfig[];
    states: Map<number, string>;
    headerResource: string;

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        private router: Router,
        private inquiriesService: InquiriesService,
        menuService: MenuService,
        private cacheService: CacheService,
        accountService: AccountService,
        printHandlerService: PrintHandlerService
    ) {
        super(httpClient, configService, menuService, accountService, printHandlerService);

        this.columns = this.getColumns();
        this.headerResource = 'inquiryDetails';
    }


    protected requestDetails(id = this.id): Promise<b2b.InquiryDetailsResponse> {

        return this.httpClient.get<b2b.InquiryDetailsResponse>('/api/inquiries/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.InquiryDetailsResponse> {

        return super.loadDetails(id).then((listResponse) => {

            this.details.canRemove = (this.configService.applicationId === 0 && this.details.state === XlInquiryStatus.unconfirmed)
                || (this.configService.applicationId === 1 && this.details.state === AltumDocumentStatus.unconfirmed);

            this.columns = this.getColumns();
            this.details.copyToCartDisabled = true;
            if (this.configService.applicationId === 0) {

                //unifying inquiry with rest of lists.
                //description includes full data of product
                this.products = [{ description: listResponse.set4[0].description }];

            } else {
                this.products = listResponse.set5;
            }

            if (!this.states) {
                this.states = DocumentStates.xlInquiryStates;
            }

            return listResponse;
        }).catch(err => {
            return Promise.reject(err);
        });

    }

    protected checkIfShowDetailsIsRequired(): void {
        if (this.configService.applicationId === 0) {
            this.details.showDetails = false;
        } else {
            this.details.showDetails = this.details.description || this.details.sourceNumber ? true : false;
        }

    }

    getColumns(applicationId = this.configService.applicationId): b2b.ColumnConfig[] {

        if (applicationId === 0) {

            return [
                { property: 'description', translation: 'inquiryContent', type: 'html' }
            ];
        }

        return [
            { property: 'position', translation: 'ordinalNumber' },
            { property: 'name', translation: 'codeName', type: 'productNameWithoutPhoto' },
            { property: 'quantity', type: 'quantity' }
        ];
    }

    private removeRequest(): Promise<boolean> {
        return this.httpClient.delete<boolean>('/api/inquiries/remove/' + this.id).toPromise();
    }

    remove(): Promise<boolean> {

        return this.removeRequest().then(res => {

            if (res) {
                this.inquiriesService.items = undefined;

                return this.cacheService.clearCache('/api/orders').then(() => {
                    this.router.navigate([this.menuService.routePaths.inquiries]);
                    return res;
                });
                
            }
        });
    }

    print() {
        return super.print(DocumentType.inquiry, this.id);
    }


}
