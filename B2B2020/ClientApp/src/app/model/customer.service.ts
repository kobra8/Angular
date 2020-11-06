import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { ConfigService } from './config.service';
import { Subject } from 'rxjs';
import { b2bCustomer } from 'src/integration/customer/b2b-customer';
import { ApplicationType } from './enums/application-type.enum';


@Injectable()
export class CustomerService {

    creditInfo: b2b.HeaderCustomerInfo;
    details: b2b.CustomerDetails;
    employees: b2b.Employee[];
    attributes: b2bCustomer.CustomerAttribute[];

    creditInfoChanged: Subject<b2b.HeaderCustomerInfo>;

      // JD
      supervisor: b2b.Supervisor;
      customerLimitInfo: any;

    constructor(private httpClient: HttpClient, private configService: ConfigService) {
        this.creditInfo = <b2b.HeaderCustomerInfo>{};
        this.creditInfoChanged = new Subject<b2b.HeaderCustomerInfo>();
    }


    private requestHeaderData(): Promise<b2b.CustomerHeaderResponse> {
        return this.httpClient.get<b2b.CustomerHeaderResponse>('/api/customer/header').toPromise();
    }

    loadHeaderData(): Promise<b2b.HeaderCustomerInfo> {

        const headerPromise = this.requestHeaderData().then((res) => {
            this.creditInfo = res.set1[0];
            this.supervisor = res.set2[0]; // JD
            return this.creditInfo;

        }).catch(err => {

            this.configService.handlePermissionsError(err);
            return err;
        });

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


    loadCustomerData(): Promise<void> {

        return this.requestCustomerData().then(res => {
            this.details = res.set1[0];
        });
    }

    loadContacts(): Promise<void> {

        return this.requestContacts().then(res => {
            this.employees = res.set1;
        });
    }

    refreshCreditInfo() {
        this.localRefreshCreditInfo().then((res) => {
            this.creditInfoChanged.next(res);
        });
    }

    private localRefreshCreditInfo() {
        return this.requestHeaderData().then((res) => {
            return this.creditInfo = res.set1[0];
        });
    }

    private requestAttributesXl(): Promise<b2bCustomer.GetCustomerAttributeResponseXl> {
        return this.httpClient.get<b2bCustomer.GetCustomerAttributeResponseXl>('/api/Customer/attributesXl').toPromise();
    }

    private requestAttributesAltum(): Promise<b2bCustomer.GetCustomerAttributeResponseAltum> {
        return this.httpClient.get<b2bCustomer.GetCustomerAttributeResponseAltum>('/api/Customer/attributesAltum').toPromise();
    }


    getAttributes(): Promise<void> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.getAttributesXl();

            case ApplicationType.ForAltum:
                return this.getAttributesAltum();

            default:
                console.error(`getAttributes(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private getAttributesXl(): Promise<void> {
        return this.requestAttributesXl().then(res => this.inCaseSuccessGetAttributesBase(res));
    }

    private getAttributesAltum(): Promise<void> {
        return this.requestAttributesAltum().then(res => this.inCaseSuccessGetAttributesBase(res));
    }

    private inCaseSuccessGetAttributesBase(res: b2bCustomer.GetCustomerAttributeResponseBase) {
        this.attributes = res.attributes;
    }
}
