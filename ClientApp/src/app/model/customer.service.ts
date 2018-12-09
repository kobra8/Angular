import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';


@Injectable()
export class CustomerService  {

    creditInfo: b2b.HeaderCustomerInfo;
    supervisor: b2b.Supervisor;

    constructor(private httpClient: HttpClient, private configService: ConfigService) {

        this.creditInfo = <b2b.HeaderCustomerInfo>{};
    }


    /**
      * Makes request for header data.
      */
    private requestHeaderData(): Promise<b2b.CustomerHeaderResponse> {
        return this.httpClient.get<b2b.CustomerHeaderResponse>('api/Customer/header').toPromise();
    }


    /**
     * Gets header data from server and updates model.
     */
    loadHeaderData(): Promise<b2b.CustomerHeaderResponse> {

        const headerPromise = this.requestHeaderData().then((res) => {

            this.creditInfo = res.set1[0];
            this.supervisor = res.set2[0];

            this.configService.setConfig(res.set3, { priceMode: res.set1[0].priceMode }, res.set1[0].applicationId);

            return res;
        });

        this.configService.setPermissionsPromise(headerPromise);

        return headerPromise;


    }

    

}
