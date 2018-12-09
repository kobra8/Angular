import { Injectable } from '@angular/core';
import { RightXL } from './enums/right-xl.enum';
import { b2b } from '../../b2b';
import { RightAltum } from './enums/right-altum.enum';


@Injectable()
export class ConfigService {

    applicationId: number;

    isMobile: boolean;
    private mobileViewport: MediaQueryList;

    bodyRef: HTMLBodyElement;

    permissions: b2b.Permissions;
    permissionsPromise: Promise<b2b.CustomerHeaderResponse>;

    config: b2b.SiteConfig;

    private initialPromiseResolver: Function;

    now: Date;

    constructor() {

        this.applicationId = 0;

        this.now = new Date();

        //Correct permissionsPromise is assigned by CutomerService after CustomerService is created.
        //Till this time we need a replacement promise, which is resolved after assigning permissions.
        this.permissionsPromise = new Promise(resolver => {
            this.initialPromiseResolver = resolver;
        });

        this.isMobile = false;
        this.mobileViewport = window.matchMedia('(max-width: 1280px)');

        if (this.mobileViewport) {

            this.isMobile = this.mobileViewport.matches;

            this.mobileViewport.addListener((matchListener) => {
                this.isMobile = matchListener.matches;
            });
        }

        this.bodyRef = document.querySelector('body');
    }

    setPermissionsPromise(permissionsResponse: Promise<b2b.CustomerHeaderResponse>): void {

        this.permissionsPromise = permissionsResponse;
    }


    setConfig(permissionsArray: [{ rightId: RightXL | RightAltum }], config: b2b.SiteConfig, applicationId = 0): void {

        this.applicationId = applicationId;

        this.permissions = <b2b.Permissions>{};

        this.config = config;

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

                    case RightXL.warehouseChange:
                        this.permissions.warehouseChange = true;
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

                    case RightAltum.warehouseChange:
                        this.permissions.warehouseChange = true;
                        break;

                    case RightAltum.showPending:
                        this.permissions.showPending = true;
                        break;

                    default:
                        break;
                }
            }
        });

        this.initialPromiseResolver({ set3: permissionsArray });
    }





}
