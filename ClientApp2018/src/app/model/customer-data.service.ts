import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';

@Injectable()
export class CustomerDataService {

  details: b2b.CustomerDetails;
  attachments: b2b.CustomerAttachment[];
  employees: b2b.Employee[];

  constructor(private httpClient: HttpClient) { }


  /**
   * Prepares request for customer data
   */
  private requestFullData(): Promise<b2b.CustomerFullDataResponse> {
    return this.httpClient.get<b2b.CustomerFullDataResponse>('api/Customer').toPromise();
  }

  loadFullData(): Promise<boolean> {

    return this.requestFullData().then((res: b2b.CustomerFullDataResponse) => {

      this.details = res.set4[0];
      this.attachments = res.set2;
      this.employees = res.set5;

      return true;
    });
  }
}
