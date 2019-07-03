import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';


@Injectable()
export class CustomerService {

    creditInfo: b2b.HeaderCustomerInfo;
    overduePayments: b2b.OverduePayment[]
    supervisor: b2b.Supervisor;
    details: b2b.CustomerDetails;
    attachments: b2b.CustomerAttachment[];
    employees: b2b.Employee[];


    constructor(private httpClient: HttpClient, private configService: ConfigService) {

        this.creditInfo = <b2b.HeaderCustomerInfo>{};
    }


    /**
      * Makes request for header data.
      */
    private requestHeaderData(): Promise<b2b.CustomerHeaderResponse> {
        return this.httpClient.get<b2b.CustomerHeaderResponse>('/api/customer/header').toPromise();
    }


    /**
     * Gets header data from server and updates model.
     */
    loadHeaderData(): Promise<b2b.CustomerHeaderResponse> {

        const headerPromise = this.requestHeaderData().then((res) => {

            this.creditInfo = res.set1[0];
            this.supervisor = res.set2[0];
            this.overduePayments = res.set3;

            this.configService.setPermissions(res.set4, res.set1[0].applicationId);

            return res;

        }).catch(err => {

            this.configService.handlePermissionsError(err);
            return err;
        });

        //this.configService.setPermissionsPromise(headerPromise);

        return headerPromise;


    }

    /**
    * Prepares request for customer data
    */
    private requestCustomerData(): Promise<b2b.CustomerDataResponse> {
        return this.httpClient.get<b2b.CustomerDataResponse>('/api/customer').toPromise();
    }

    private requestContacts(): Promise<b2b.EmployeesResponse> {
        return this.httpClient.get<b2b.EmployeesResponse>('/api/customer/contacts').toPromise();
    }

    loadCustomerData(): Promise<boolean> {

        return this.requestCustomerData().then(res => {

            this.details = res.set4[0];
            this.attachments = res.set2;

            return true;
        });
    }

    loadContacts(): Promise<boolean> {

        return this.requestContacts().then(res => {
            this.employees = res.set1;
            return true;
        });
    }


    
}
