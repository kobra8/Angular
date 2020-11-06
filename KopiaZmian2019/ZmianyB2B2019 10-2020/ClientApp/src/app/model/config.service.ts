import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, merge, of, fromEvent, Subject, Subscription } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { Router } from '@angular/router';



@Injectable()
export class ConfigService {

    applicationId: number;

    isMobile: boolean;
    private mobileViewport: MediaQueryList;

    bodyRef: HTMLBodyElement;

    permissions: b2b.Permissions;
    permissionsPromise: Promise<b2b.CustomerHeaderResponse>;
    private permissionsPromiseResolver: Function;
    private permissionsPromiseReject: Function;

    config: b2b.CustomerConfig;
    configPromise: Promise<b2b.CustomerConfig>;
    private configPromiseResolver: Function;
    private configPromiseReject: Function;


    allConfigsPromise: Promise<[b2b.CustomerHeaderResponse, b2b.CustomerConfig]>;


    private isOnlineObs: Observable<boolean>;
    isOnline: boolean;

    /**
    * Binding loader using subject, not simple variable, to avoid error "expression has changed after it was checked"
    */
    loaderSubj: Subject<boolean>;

    /**
    * Search form submit event.
    */
    searchEvent: Subject<{ searchPhrase: string }>;



    isFirefox: boolean;
    isSafari: boolean;

    constructor(private httpClient: HttpClient, private router: Router) {


        this.loaderSubj = new Subject<boolean>();
        this.searchEvent = new Subject<{ searchPhrase: string }>();

        this.bodyRef = document.querySelector('body');

        this.reinitConfigs();

        this.isMobile = false;
        this.mobileViewport = window.matchMedia('(max-width: 1024px)');

        if (this.mobileViewport) {

            this.isMobile = this.mobileViewport.matches;

            this.mobileViewport.addListener((matchListener) => {
                this.isMobile = matchListener.matches;
            });
        }


        this.isOnlineObs = merge(
            of(navigator.onLine),
            fromEvent(window, 'online').pipe(mapTo(true)),
            fromEvent(window, 'offline').pipe(mapTo(false))
        );


        this.isOnlineObs.subscribe(isOnline => {

            this.isOnline = isOnline;

            if (this.isOnline === false) {
                this.bodyRef.classList.add('with-offline-msg');
            } else {
                this.bodyRef.classList.remove('with-offline-msg');
            }
        });

        this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);



    }



    getApplicationType(): Promise<number> {

        return this.httpClient.get<number>('/account/getapplicationtype').toPromise().then(id => {
            this.applicationId = id;
            return id;
        });
    }


    requestCustomerConfig() {
        return this.httpClient.get<b2b.CustomerConfigResponse>('/api/configuration/getforcustomer', {}).toPromise();
    }

    getCustomerConfig(): Promise<b2b.CustomerConfig> {

        if (this.config === undefined) {

            let configPromiseLocal: Promise<[b2b.CustomerConfigResponse, number]>;

            if (this.applicationId === undefined) {

                configPromiseLocal = Promise.all([
                    this.requestCustomerConfig(),
                    this.getApplicationType()
                ]);

            } else {
                configPromiseLocal = Promise.all([
                    this.requestCustomerConfig(),
                    Promise.resolve(this.applicationId)
                ]);
            }


            configPromiseLocal.then(configs => {

                const config = configs[0];

                this.setPermissions(config.rights, configs[1]);

                delete config.rights;

                this.config = config;

                //always true, regardless of configuration
                this.config.showFeatures = true;

                this.configPromiseResolver(Object.assign({}, this.config));

            }).catch((err: HttpErrorResponse) => {

                this.configPromiseReject(err);
            });
        }

        return this.configPromise;

    }

    reinitConfigs() {

        this.permissions = undefined;
        this.config = undefined;

        this.permissionsPromise = new Promise((resolver, reject) => {
            this.permissionsPromiseResolver = resolver;
            this.permissionsPromiseReject = reject;
        });

        this.configPromise = new Promise((resolver, reject) => {
            this.configPromiseResolver = resolver;
            this.configPromiseReject = reject;
        });


        this.allConfigsPromise = Promise.all([this.permissionsPromise, this.configPromise]);
    }

    setPermissions(permissions: b2b.PermissionsResponseBeforeUnification, applicationId = 0): void {

        this.applicationId = applicationId;

        const propertiesToUnify = {
            hasAccessToArticleList: permissions.hasAccessToArticleList || permissions.hasAccessToArticleCatalog,
            hasAccessToCart: permissions.hasAccessToCart || permissions.hasAccessToCarts,
            hasAccessToPromotionList: permissions.hasAccessToPromotionList || permissions.hasAccessToPromotions,
            hasAccessToChangeRealizationTime: permissions.hasAccessToChangeRealizationTime || permissions.hasAccessToChangeOrderRealizationDate,
            hasAccessToChangeDefaultWarehouse: permissions.hasAccessToChangeDefaultWarehouse || permissions.hasAccessToWarehouseChange,
            hasAccessToChangeOrderWarehouse: applicationId === 0 ? permissions.hasAccessToChangeOrderWarehouse : permissions.hasAccessToWarehouseChange,
            hasAccessToDiscount: applicationId === 0 ? permissions.hasAccessToDiscount : permissions.hasAccessToRebate,
            hasAccessToEditQuantityInQuotes: applicationId === 0 ? permissions.hasAccessToEditQuantityInQuotes : permissions.hasAccessToEditQuantityInQuote

        };

        if (applicationId === 1) {
            delete permissions.hasAccessToPromotions;
            delete permissions.hasAccessToChangeOrderRealizationDate;
            delete permissions.hasAccessToWarehouseChange;
            delete permissions.hasAccessToArticleCatalog;
            delete permissions.hasAccessToCarts;
            delete permissions.hasAccessToRebate;
            delete permissions.hasAccessToEditQuantityInQuote;
        }

        const hasAccessToProfile = permissions.hasAccessToComplaintsList
            || permissions.hasAccessToCustomerData
            || permissions.hasAccessToPackagesList
            || permissions.hasAccessToInquiriesList
            || permissions.hasAccessToOrdersList
            || permissions.hasAccessToPaymentsList
            || permissions.hasAccessToQuotesList
            || permissions.hasAccessToAttachmentsList
            || permissions.hasAccessToPromotionList
            || permissions.hasAccessToEmployeesList;


        this.permissions = Object.assign(
            <b2b.PermissionsResponseAfterUnification>permissions,
            propertiesToUnify,
            { hasAccessToProfile: hasAccessToProfile }
        );

        this.permissionsPromiseResolver(Object.assign({}, this.permissions));
    }


    handlePermissionsError(err: HttpErrorResponse) {
        this.permissionsPromiseReject(err);
    }



}
