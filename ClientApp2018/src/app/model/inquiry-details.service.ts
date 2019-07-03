import { Injectable } from '@angular/core';
import { DocumentDetails } from './shared/document-details';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DocumentType } from './enums/document-type.enum';
import { ConfigService } from './config.service';

@Injectable()
export class InquiryDetailsService extends DocumentDetails {


    products: any;
    columns: Map<string, string>;

    constructor(httpClient: HttpClient, private configService: ConfigService) {
        super(httpClient, 'inquiryDetails');

        this.columns = new Map<string, string>()
            .set('description', 'inquiryContent');
    }


    protected requestDetails(id = this.id): Promise<b2b.InquiryDetailsResponse> {

        return this.httpClient.get<b2b.InquiryDetailsResponse>('api/Inquiries/' + id).toPromise();
    }

    loadDetails(id = this.id): Promise<b2b.InquiryDetailsResponse> {

        const configPromise = this.configService.permissionsPromise;
        const listPromise = super.loadDetails(id);

        return Promise.all([listPromise, configPromise]).then((res) => {

            const listResponse: b2b.InquiryDetailsResponse = res[0];

            this.details.printHref = 'PrintHandler.ashx?pageId=' + DocumentType.inquiry + '&documentId=' + this.id;
            this.details.showImages = false; //never show images for inquiries products, by design
            

            this.columns = this.getColumns();

            if (this.configService.applicationId === 0) {

                //unifying inquiry with rest of lists.
                //description includes full data of product
                this.products = [{ description: listResponse.set4[0].description }];

            } else {
                this.products = listResponse.set5;
            }

            return listResponse;
        });

    }

    getColumns() {

        if (this.configService.applicationId === 0) {

            return new Map<string, string>().set('description', 'inquiryContent');

        } else {

            return new Map<string, string>()
                .set('name', 'codeName')
                .set('quantity', 'quantity');
        }
    }


}
