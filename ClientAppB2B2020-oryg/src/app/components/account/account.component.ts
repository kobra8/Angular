import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { AccountService } from '../../model/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AccountViewType } from '../../model/enums/account-view-type.enum';
import { NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { HttpErrorResponse } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { MenuService } from 'src/app/model/menu.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrls: ['./account.component.scss'],
    host: { class: 'app-account' },
    encapsulation: ViewEncapsulation.None
})
export class AccountComponent implements OnInit, OnDestroy {


    r: ResourcesService;
    messageKey: string;
    errorKey: string;

    triedToSendInvalid: boolean;
    companies: b2b.Company[];

    companySubj: Subject<string>;
    companySub: Subscription;

    viewType: AccountViewType;
    routeSub: Subscription;

    @ViewChild('accountForm', { static: false })
    accountForm: NgForm;

    showForm: boolean;
    showPassword: boolean;

    backBtn: boolean;

    loginConfirmationHtml: SafeHtml;

    languageChangeSub: Subscription;

    constructor(
        resourcesService: ResourcesService,
        private accountService: AccountService,
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        public menuService: MenuService,
        private router: Router,
        private domSanitizer: DomSanitizer
    ) {
        this.r = resourcesService;
        this.triedToSendInvalid = false;
        this.viewType = AccountViewType.login;
        this.showForm = false;
        this.showPassword = false;
    }

    ngOnInit() {

        this.languageChangeSub = this.r.languageChanged.subscribe(() => {
            this.refreshLoginConfirmationHtml();
        });

        this.routeSub = this.activatedRoute.url.subscribe(() => {

            this.closeCompanySubject();

            if (this.router.url === this.menuService.routePaths.remindPassword) {
                this.showForm = true;
                this.viewType = AccountViewType.remind;

            } else if (this.router.url.split('?')[0] === this.menuService.routePaths.resetPassword) {

                this.viewType = AccountViewType.reset;

                this.r.translationsPromise.then(() => {

                    this.accountService.checkHashIsValid((<any>window).hash).then(() => {
                        this.showForm = true;

                    }).catch((err: HttpErrorResponse) => {


                        if (err.status === 404) {
                            this.errorKey = 'incorrectLink';
                            this.backBtn = true;

                        } else {
                            this.errorKey = 'resetPasswordFail';
                        }

                        this.showForm = false;
                    });
                });

            } else {

                this.configService.loaderSubj.next(true);
                this.viewType = AccountViewType.login;
                this.showForm = true;

                Promise.all([this.r.translationsPromise, this.accountService.checkIsLoginConfirmationRequired()])
                    .then(() => {
                        this.refreshLoginConfirmationHtml();
                        this.configService.loaderSubj.next(false);
                    });

            }

            window.setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('[autofocus]');

                if (input && input !== document.activeElement) {
                    input.focus();
                }
            }, 0);


            if (this.viewType !== AccountViewType.reset) {

                if (this.configService.applicationId === undefined) {

                    this.configService.getApplicationType().then(() => {

                        this.createCompanyInputSubject();

                    });

                } else {
                    this.createCompanyInputSubject();
                }
            }

        });

        
    }


    refreshLoginConfirmationHtml() {

        if (this.accountService.loginConfirmationResourceKey) {

            if (this.r.translations[this.accountService.loginConfirmationResourceKey]) {
                const loginConfirmationOriginalHTML = this.r.translations[this.accountService.loginConfirmationResourceKey].replace('href="', 'href="//');
                this.loginConfirmationHtml = this.domSanitizer.bypassSecurityTrustHtml(loginConfirmationOriginalHTML);
            } else {
                this.loginConfirmationHtml = '';
            }

            
        }

    }


    createCompanyInputSubject() {

        if (this.configService.applicationId === 1) {

            this.companySubj = new Subject<string>();
            this.companySub = this.companySubj.pipe(debounceTime(1000)).subscribe(customerName => {

                this.configService.loaderSubj.next(true);

                this.accountService.getCompanies(customerName).then(res => {

                    this.companies = res;
                    this.configService.loaderSubj.next(false);
                });
            });

        } else {

            this.closeCompanySubject();
        }
    }

    checkPasswordsMatching() {

        if (this.accountForm.controls.password.value !== this.accountForm.controls.repeatPassword.value) {
            this.accountForm.controls.repeatPassword.setErrors({ match: true });
            return false;
        } else {

            if (this.accountForm.controls.repeatPassword.errors && this.accountForm.controls.repeatPassword.errors.match) {
                delete this.accountForm.controls.repeatPassword.errors.match;

                if (Object.keys(this.accountForm.controls.repeatPassword.errors).length === 0) {
                    this.accountForm.controls.repeatPassword.setErrors(null);
                }
            }
            return true;
        }


    }

    submit(formValid: boolean, formValue: b2b.LoginData & b2b.ResetPwdData): void {

        if (formValid && formValue) {
            this.errorKey = null;
            this.messageKey = null;

            this.triedToSendInvalid = false;
            this.configService.loaderSubj.next(true);

            if (this.viewType !== AccountViewType.reset) {

                if (formValue.companyGroupId === undefined || formValue.companyGroupId === null) {

                    (<b2b.LoginData>formValue).companyGroupId = 0;

                } else if (formValue.companyGroupId + '' === '') {

                    formValue.companyGroupId = this.companies[0].GroupId;
                }
            }

            if (this.viewType === AccountViewType.reset) {

                formValue.hash = (<any>window).hash;

                this.accountService.resetPassword(formValue).then(() => {

                    this.messageKey = 'resetPasswordSuccess';
                    this.configService.loaderSubj.next(false);
                    this.accountForm.resetForm();
                    this.showForm = false;

                    window.setTimeout(() => {
                        location.href = '/login'; //full reload to change server view
                        this.configService.loaderSubj.next(true);
                    }, 1000);


                }).catch((err: HttpErrorResponse) => {

                    if (err.status === 404) {
                        this.errorKey = 'incorrectLink';
                        this.backBtn = true;

                    } else {
                        this.errorKey = 'changePasswordError';
                    }

                    this.configService.loaderSubj.next(false);
                    this.accountForm.resetForm();
                });

            } else if (this.viewType === AccountViewType.remind) {

                this.accountService.remindPassword(formValue).then(() => {

                    this.messageKey = 'resetPasswordEmailSent';

                    this.configService.loaderSubj.next(false);
                    this.accountForm.resetForm();
                    this.showForm = false;

                }).catch((err: HttpErrorResponse) => {

                    if (err.status === 404) {
                        this.errorKey = 'userCompanyNotInConfig';

                    } else {
                        this.errorKey = 'changePasswordError';
                    }

                    this.configService.loaderSubj.next(false);
                    this.accountForm.resetForm();
                });

            } else {

                formValue.rememberMe = !!formValue.rememberMe;

                this.accountService.logIn(formValue).then((res) => {
                    if (res.IsNeededReloadCacheAndTranslations) {
                        this.r.loadTranslations();
                    }
                    //redirect for succeed login is inside logIn method
                    this.configService.loaderSubj.next(false);

                }).catch(err => {

                    if (err.status === 401) {
                        this.errorKey = 'invalidLoginOrPassword';

                    } else if (err.status === 406) {
                        this.errorKey = 'counterOfFailedLoginsIsOverflow';

                    } else {
                        this.errorKey = 'loginFailed';
                    }

                    this.configService.loaderSubj.next(false);

                });
            }


        } else {

            this.triedToSendInvalid = true;
        }
    }


    debounceCustomerName(customerName: string) {
        if (this.companySubj && !this.companySubj.closed && customerName !== undefined) {
            this.companySubj.next(customerName);
        }
    }

    onFocus() {
        this.accountService.onInputFocus();
    }

    onFocusOut() {
        this.accountService.onInputFocusOut();
    }

    onShowHidePassword() {
        this.showPassword = !this.showPassword;
    }

    closeCompanySubject() {

        if (this.companySub && !this.companySub.closed) {
            this.companySub.unsubscribe();
        }

        if (this.companySubj && !this.companySubj.closed) {
            this.companySubj.unsubscribe();
        }
    }

    ngOnDestroy(): void {

        this.routeSub.unsubscribe();

        this.closeCompanySubject();

        this.languageChangeSub.unsubscribe();
    }
}
