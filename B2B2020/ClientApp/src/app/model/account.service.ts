import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { b2b } from '../../b2b';
import { Subject } from 'rxjs';
import { CustomerService } from './customer.service';
import { CacheService } from './cache.service';
import { MenuService } from './menu.service';
import { ConfigService } from './config.service';
import { b2bUser } from 'src/integration/b2b-user';

@Injectable()
export class AccountService implements CanActivate {

    authenticated: boolean;
    logInSubj: Subject<void>;
    logOutSubj: Subject<void>;
    formInputFocused: boolean;
    token: string;
    tokenReqUrl: string;
    isLoginConfirmationRequired: boolean;
    loginConfirmationResourceKey: string;

    constructor(
        private httpClient: HttpClient,
        private router: Router,
        private menuService: MenuService,
        private customerService: CustomerService,
        private configService: ConfigService,
        private cacheService: CacheService
    ) {
        this.logInSubj = new Subject<void>();
        this.logOutSubj = new Subject<void>();
        this.formInputFocused = false;
        this.tokenReqUrl = '/account/antiforgerytokenforajaxpost';
    }

    logIn(loginData: b2b.LoginData): Promise<b2bUser.LoginResponse> {

        return this.httpClient.post<b2bUser.LoginResponse>('/account/login', loginData).toPromise().then((res) => {
            this.authenticated = true;

            return this.configService.getCustomerConfig().then(() => {
                this.logUser();
                this.logInSubj.next();
                this.router.navigate([this.menuService.routePaths.home]);
                return res;
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

            return this.configService.getCustomerConfig().then(() => {
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
            this.customerService.employees = undefined;
            this.cacheService.clearCache();
            this.logOutSubj.next();
            this.router.navigate([this.menuService.routePaths.login]);
            
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

            if (state.url === this.menuService.routePaths.login
                || state.url === this.menuService.routePaths.remindPassword
                || state.url.split('?')[0] === this.menuService.routePaths.resetPassword) {

                if (isAuthenticated) {
                    this.router.navigate([this.menuService.routePaths.home]);
                }

                return !isAuthenticated;

            } else {


                if (!isAuthenticated) {
                    this.router.navigate([this.menuService.routePaths.login]);
                }

            }


            return isAuthenticated;
        });

    }



    getToken(): Promise<string> {
        return this.httpClient.post<string>(this.tokenReqUrl, null).toPromise().then(token => {
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
