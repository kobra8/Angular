import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';

@Injectable()
export class ComplaintFormService {

    param: string;
    config: b2b.ComplaintFormConfig;
    products: b2b.ComplaintFormProduct[];
    requests: b2b.Option2[];


    constructor(private httpClient: HttpClient) {

    }

    private requestProducts(param): Promise<b2b.ComplaintFormDetails> {

        const params = {
            itemsComplaint: param
        };

        return this.httpClient.get<b2b.ComplaintFormDetails>('/api/complaints', { params: params }).toPromise();
    }

    loadProducts(param): Promise<b2b.ComplaintFormDetails> {

        return this.requestProducts(param).then(res => {
            this.param = param;
            this.config = res.set2[0];
            this.products = res.set1;

            this.products.forEach(product => {
                product.quantity = product.basicQuantity;
            });

            return res;
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

        return this.httpClient.put<b2b.ComplaintResponse>('/api/Complaints/addComplaint', body).toPromise();

    }

    complain(complainData: b2b.ComplainData): Promise<b2b.IDs> {

        return this.complainRequest(complainData).then(res => {
            return res.set1[0];
        });
    }
}
