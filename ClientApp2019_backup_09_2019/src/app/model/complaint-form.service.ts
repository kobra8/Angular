import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';
import { ComplaintsService } from './complaints.service';

@Injectable()
export class ComplaintFormService {

    param: string;
    config: b2b.ComplaintFormConfig;
    products: b2b.ComplaintFormProduct[];
    requests: b2b.Option2[];


    constructor(private httpClient: HttpClient, private configService: ConfigService, private complaintsService: ComplaintsService) {

    }

    private requestProducts(param): Promise<b2b.ComplaintFormDetails> {

        const params = {
            itemsComplaint: param
        };

        return this.httpClient.get<b2b.ComplaintFormDetails>('/api/complaints', { params: params }).toPromise();
    }

    loadProducts(param): Promise<b2b.ComplaintFormDetails> {

        const productPromise = this.requestProducts(param);
        const configsPromise = this.configService.allConfigsPromise;

        return Promise.all([configsPromise, productPromise]).then(res => {

            const product = res[1];

            this.param = param;
            this.config = product.set2[0];
            this.products = product.set1;

            this.products.forEach(product => {
                product.quantity = product.basicQuantity;
            });

            return product;
        });
    }

    private requestRequests(): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>('/api/complaints/requests').toPromise();
    }


    loadRequests(): Promise<b2b.Option2[]> {

        return this.requestRequests().then(res => {
            this.requests = res;
            return res;
        });
    }

    private complainRequest(complainData: b2b.ComplainData): Promise<b2b.ComplaintResponse> {

        //application supports one product per complain, but method is prepared for more (for the future).
        //so, there is little adapter for now

        const product = complainData.products[0];
        delete complainData.products;
        const body = Object.assign(complainData, product);

        return this.httpClient.put<b2b.ComplaintResponse>('/api/complaints/addcomplaint', body).toPromise();

    }

    complain(complainData: b2b.ComplainData): Promise<b2b.IDs> {

        return this.complainRequest(complainData).then(res => {
            this.complaintsService.items = undefined;
            this.complaintsService.details = undefined;
            return res.set1[0];
        });
    }
}
