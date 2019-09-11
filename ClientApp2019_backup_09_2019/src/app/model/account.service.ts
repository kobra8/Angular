import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { b2b } from '../../b2b';
import { Subject } from 'rxjs';
import { ConfigService } from './config.service';
import { CustomerService } from './customer.service';

@Injectable()
export class AccountService implements CanActivate {

    authenticated: boolean;
    logInSubj: Subject<void>;
    logOutSubj: Subject<void>;
    formInputFocused: boolean;
    token: string;
    isLoginConfirmationRequired: boolean;
    loginConfirmationResourceKey: string;

    constructor(private httpClient: HttpClient, private router: Router, private configService: ConfigService, private customerService: CustomerService) {
        this.logInSubj = new Subject<void>();
        this.logOutSubj = new Subject<void>();
        this.formInputFocused = false;
    }

    logIn(loginData: b2b.LoginData): Promise<boolean | HttpErrorResponse> {


        return this.httpClient.post('/account/login', loginData, { observe: 'response' }).toPromise().then((res) => {

            if (res.status !== 200) {
                this.authenticated = false;
                return false;
            }


            this.authenticated = true;

            return Promise.all([this.getToken(), this.configService.getCustomerConfig(), this.customerService.loadHeaderData()]).then(() => {
                this.logUser();
                this.logInSubj.next();
                this.router.navigate([this.configService.routePaths.home]);
                return true;
            });



        }).catch((err: HttpErrorResponse) => {

            this.authenticated = false;
            return Promise.reject(err);
        });


    }

    isLoggedIn(): Promise<boolean> {


        if (this.authenticated !== undefined) {
            return Promise.resolve(this.authenticated);
        }


        this.configService.loaderSubj.next(true);

        return this.httpClient.get<boolean>('/account/isloggedin', {}).toPromise().then(isAuthenticated => {

            this.authenticated = isAuthenticated;

            if (!this.authenticated) {
                //when app initializing while user is logged out
                this.logOutSubj.next();
                this.configService.loaderSubj.next(false);
                return Promise.resolve(this.authenticated);
            }


            //when app initializing while user is logged in
            const configPromise = this.configService.getCustomerConfig();
            const headerPromise = this.customerService.loadHeaderData();
            let tokenPromise;

            if (this.configService.isOnline) {
                tokenPromise = this.getToken();
            } else {
                tokenPromise = Promise.resolve(this.token);
            }

            return Promise.all([configPromise, headerPromise, tokenPromise]).then(() => {
                this.logInSubj.next();
                return this.authenticated;
            });

        });
    }


    

    logUser(): Promise<void> {

        return this.httpClient.get<void>('/account/loguser').toPromise();

    }

    logOut(): Promise<void> {

        return this.httpClient.post<void>('/account/logoff', {}).toPromise().then(() => {
            this.authenticated = false;
            this.token = undefined;
            this.configService.reinitConfigs();
            this.customerService.details = undefined;
            this.customerService.creditInfo = undefined;
            this.customerService.supervisor = undefined;
            this.customerService.attachments = undefined;
            this.customerService.employees = undefined;
            this.logOutSubj.next();
            this.router.navigate([this.configService.routePaths.login]);
            
        });        

    }

    getCompanies(customerName: string): Promise<b2b.Company[]> {

        return this.httpClient.get<b2b.Company[]>('/account/getcompanies?customerName=' + customerName).toPromise();
    }

    remindPassword(remindData: b2b.RemindData): Promise<void> {

        return this.httpClient.post<void>('/remindpassword/createreminder', remindData).toPromise();
    }

    checkHashIsValid(hash: string): Promise<boolean> {
        return this.httpClient.post<boolean>('/remindpassword/checkhashisvalid', { hash: hash }).toPromise();
    }


    resetPassword(resetPwdData: b2b.ResetPwdData): Promise<void> {

        return this.httpClient.post<void>('/remindpassword/resetpassword', resetPwdData).toPromise();
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {

        const isLoggedInPromise = this.isLoggedIn();

        return isLoggedInPromise.then(isAuthenticated => {

            if (state.url === this.configService.routePaths.login
                || state.url === this.configService.routePaths.remindPassword
                || state.url.split('?')[0] === this.configService.routePaths.resetPassword) {

                if (isAuthenticated) {
                    this.router.navigate([this.configService.routePaths.home]);
                }

                return !isAuthenticated;

            } else {


                if (!isAuthenticated) {
                    this.router.navigate([this.configService.routePaths.login]);
                }

            }


            return isAuthenticated;
        });

    }



    getToken(): Promise<string> {
        return this.httpClient.post<string>('/account/antiforgerytokenforajaxpost', null).toPromise().then(token => {
            this.token = token;
            return token;
        });
    }

    checkIsLoginConfirmationRequired(): Promise<boolean> {

        if (this.isLoginConfirmationRequired !== undefined) {
            return Promise.resolve(this.isLoginConfirmationRequired);
        }

        return this.httpClient.get<b2b.LoginConfirmationData>('/account/isloginconfirmationrequired').toPromise().then(res => {
            this.isLoginConfirmationRequired = res.IsLoginConfirmationRequired;
            this.loginConfirmationResourceKey = res.LoginConfirmationResourceKey;
            return this.isLoginConfirmationRequired;
        }).catch(() => {
            this.isLoginConfirmationRequired = false;
            return false;
        });
    }

    onInputFocus() {
        this.formInputFocused = true;
    }

    onInputFocusOut() {
        this.formInputFocused = false;
    }
}
