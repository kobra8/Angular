import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable()
export class AccountService {

    constructor(private httpClient: HttpClient, private router: Router) { }


    logUser(ipAddress: string, type: string): Promise<any> {

        const params = { ipAddress: ipAddress, type: type };
        return this.httpClient.get('/Account/LogUser', { params: params }).toPromise();

    }

    getIP(): Promise<{ ip: string }> {

        return this.httpClient.get<{ ip: string }>('https://jsonip.com/').toPromise();
    }

    logOut(): Promise<boolean> {

        return this.getIP().then(
            res => {

                if (res && res.ip) {
                    return this.logUser(res.ip, 'logout').then(() => {
                        return true;
                    });

                }
            },
            () => Promise.resolve(false)
        ).then(res => {

            location.href = '/Account/LogOff';
            return Promise.resolve(res);

        });


    }
}
