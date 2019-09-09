import { Injectable } from '@angular/core';
import { RightXL } from './enums/right-xl.enum';
import { b2b } from '../../b2b';
import { RightAltum } from './enums/right-altum.enum';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, merge, of, fromEvent, Subject } from 'rxjs';
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

    routePaths: b2b.Collection<string>;

    isFirefox: boolean;
    isSafari: boolean;

    constructor(private httpClient: HttpClient, private router: Router) {

        this.routePaths = {};
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


    getCustomerConfig(): Promise<b2b.CustomerConfig> {

        if (this.config === undefined) {

            this.httpClient.get<b2b.CustomerConfig>('/api/configuration/getforcustomer', {}).toPromise().then(config => {
                this.config = config;

                //always true, regardless of configuration
                this.config.showFeatures = true;

                this.configPromiseResolver(config);

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

    setPermissions(permissionsArray: { rightId: RightXL & RightAltum }[], applicationId = 0): void {

        this.applicationId = applicationId;

        this.permissions = <b2b.Permissions>{};

        permissionsArray.forEach(right => {

            if (applicationId === 0) {

                switch (right.rightId) {

                    case RightXL.createInquiries:
                        this.permissions.createInquiries = true;
                        break;

                    case RightXL.canChangeDefaultWarehouse:
                        this.permissions.canChangeDefaultWarehouse = true;
                        break;

                    case RightXL.canChangePassword:
                        this.permissions.canChangePassword = true;
                        break;

                    case RightXL.canChangeQuoteQuantity:
                        this.permissions.canChangeQuoteQuantity = true;
                        break;

                    case RightXL.canComplain:
                        this.permissions.canComplain = true;
                        break;

                    case RightXL.canPrint:
                        this.permissions.canPrint = true;
                        break;

                    case RightXL.confirmOrders:
                        this.permissions.confirmOrders = true;
                        break;

                    case RightXL.deliveryMethodChange:
                        this.permissions.deliveryMethodChange = true;
                        break;

                    case RightXL.errorList:
                        this.permissions.errorList = true;
                        break;

                    case RightXL.paymentDateChange:
                        this.permissions.paymentDateChange = true;
                        break;

                    case RightXL.paymentFormChange:
                        this.permissions.paymentFormChange = true;
                        break;

                    case RightXL.pricesVisibility:
                        this.permissions.pricesVisibility = true;
                        break;

                    case RightXL.receiptDateChange:
                        this.permissions.receiptDateChange = true;
                        break;

                    case RightXL.removeUnconfirmedOrders:
                        this.permissions.removeUnconfirmedOrders = true;
                        break;

                    case RightXL.showCarts:
                        this.permissions.showCarts = true;
                        break;

                    case RightXL.showComplaints:
                        this.permissions.showComplaints = true;
                        break;

                    case RightXL.showCompletion:
                        this.permissions.showCompletion = true;
                        break;

                    case RightXL.showCustomerData:
                        this.permissions.showCustomerData = true;
                        break;

                    case RightXL.showDeliveries:
                        this.permissions.showDeliveries = true;
                        break;

                    case RightXL.showDeliveryMethod:
                        this.permissions.showDeliveryMethod = true;
                        break;

                    case RightXL.showDiscount:
                        this.permissions.showDiscount = true;
                        break;

                    case RightXL.showInquiries:
                        this.permissions.showInquiries = true;
                        break;

                    case RightXL.showOrders:
                        this.permissions.showOrders = true;
                        break;

                    case RightXL.showPayments:
                        this.permissions.showPayments = true;
                        break;

                    case RightXL.showProduction:
                        this.permissions.showProduction = true;
                        break;

                    case RightXL.showProducts:
                        this.permissions.showProducts = true;
                        break;

                    case RightXL.showPromotions:
                        this.permissions.showPromotions = true;
                        break;

                    case RightXL.showQuotes:
                        this.permissions.showQuotes = true;
                        break;

                    case RightXL.showReservations:
                        this.permissions.showReservations = true;
                        break;

                    case RightXL.showServices:
                        this.permissions.showServices = true;
                        break;

                    case RightXL.showTargetCustomer:
                        this.permissions.showTargetCustomer = true;
                        break;

                    case RightXL.canChangeDefaultWarehouseCart:
                        this.permissions.canChangeDefaultWarehouseCart = true;
                        break;

                    default:
                        break;

                }

                this.permissions.showPending = true;

            } else {

                switch (right.rightId) {

                    case RightAltum.createInquiries:
                        this.permissions.createInquiries = true;
                        break;

                    case RightAltum.canChangeQuoteQuantity:
                        this.permissions.canChangeQuoteQuantity = true;
                        break;

                    case RightAltum.canPrint:
                        this.permissions.canPrint = true;
                        break;

                    case RightAltum.confirmOrders:
                        this.permissions.confirmOrders = true;
                        break;

                    case RightAltum.deliveryMethodChange:
                        this.permissions.deliveryMethodChange = true;
                        break;

                    case RightAltum.paymentDateChange:
                        this.permissions.paymentDateChange = true;
                        break;

                    case RightAltum.paymentFormChange:
                        this.permissions.paymentFormChange = true;
                        break;

                    case RightAltum.pricesVisibility:
                        this.permissions.pricesVisibility = true;
                        break;

                    case RightAltum.receiptDateChange:
                        this.permissions.receiptDateChange = true;
                        break;

                    case RightAltum.removeUnconfirmedOrders:
                        this.permissions.removeUnconfirmedOrders = true;
                        break;

                    case RightAltum.showCarts:
                        this.permissions.showCarts = true;
                        break;

                    case RightAltum.showCustomerData:
                        this.permissions.showCustomerData = true;
                        break;

                    case RightAltum.showDeliveryMethod:
                        this.permissions.showDeliveryMethod = true;
                        break;

                    case RightAltum.showDiscount:
                        this.permissions.showDiscount = true;
                        break;

                    case RightAltum.showInquiries:
                        this.permissions.showInquiries = true;
                        break;

                    case RightAltum.showOrders:
                        this.permissions.showOrders = true;
                        break;

                    case RightAltum.showPayments:
                        this.permissions.showPayments = true;
                        break;

                    case RightAltum.showProducts:
                        this.permissions.showProducts = true;
                        break;

                    case RightAltum.showPromotions:
                        this.permissions.showPromotions = true;
                        break;

                    case RightAltum.showQuotes:
                        this.permissions.showQuotes = true;
                        break;

                    case RightAltum.canChangeDefaultWarehouse:
                        this.permissions.canChangeDefaultWarehouseCart = true;
                        this.permissions.canChangeDefaultWarehouse = true;
                        break;

                    case RightAltum.showPending:
                        this.permissions.showPending = true;
                        break;

                    default:
                        break;
                }
            }

        });

        this.permissions.showProfile = this.permissions.showComplaints
            || this.permissions.showCustomerData
            || this.permissions.showDeliveries
            || this.permissions.showInquiries
            || this.permissions.showOrders
            || this.permissions.showPayments
            || this.permissions.showQuotes;

        this.permissionsPromiseResolver({ set3: permissionsArray });
    }


    handlePermissionsError(err: HttpErrorResponse) {
        this.permissionsPromiseReject(err);
    }


    flattenRoutes(routes: b2b.RouteWithKey[], moduleParentPathKey?: string, pathRoot?) {

        let routesArray = {};

        routes.forEach((route) => {
            if (!route.key) {
                return;
            }

            if (route.key && route.redirectTo) {
                routesArray[route.key] = '/' + route.redirectTo;
                return;
            }

            let currentRoutePath = route.path || route.redirectTo || '';

            if (route.path.includes('/')) {
                currentRoutePath = route.path.split('/')[0];
            }

            if (currentRoutePath.includes(':')) {
                return;
            }

            if (moduleParentPathKey) {
                currentRoutePath = `${moduleParentPathKey}/${currentRoutePath}`;
            }

            routesArray[route.key] = `${pathRoot ? '/' + pathRoot : ''}/${currentRoutePath}`;

            if (!route.children) {
                return;
            }

            const subroutesArray = this.flattenRoutes(<b2b.RouteWithKey[]>route.children, null, `${pathRoot ? pathRoot + '/' : ''}${currentRoutePath}`);
            routesArray = Object.assign(routesArray, subroutesArray);
        });


        return routesArray;
    }


    configureRoutePaths(routes: b2b.RouteWithKey[], moduleParentPathKey?: string) {

        this.routePaths = Object.assign(this.routePaths, this.flattenRoutes(routes, moduleParentPathKey));
    }

}
