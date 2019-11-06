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
    // JD
    customerLimitInfo: any;


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
      * JD - get customer limit info
      */
     private requestCustomerLimitInfo(clientAcronym): Promise<any> {
        return this.httpClient.get<any>('/api/CustLimitInfo/'+ clientAcronym).toPromise();
    }

    /**
     * Gets header data from server and updates model.
     */
    loadHeaderData(): Promise<b2b.CustomerHeaderResponse> {

        const headerPromise = this.requestHeaderData().then((res) => {

            this.creditInfo = res.set1[0];
            this.supervisor = res.set2[0];
            this.overduePayments = res.set3;

            // JD
            this.requestCustomerLimitInfo(res.set1[0].customer).then(res => {
                // Dane grupowane w tabeli - Indeksy potrzebnych danych:
                // 2 - Zaległość standardowa
                // 3 - ZWM
                // 4 - Wolny limit
                this.customerLimitInfo = {
                    zalStandard:res[2].value, 
                    zwm:res[3].value, 
                    wolnyLimit:res[4].value };
            }).catch(err => {
                this.configService.handlePermissionsError(err);
                return err;
            });

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
