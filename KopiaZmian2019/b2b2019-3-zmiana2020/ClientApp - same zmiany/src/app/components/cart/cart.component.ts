
import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';


import { CartDocumentType } from '../../model/enums/cart-document-type.enum';
import { CartsService } from '../../model/carts.service';
import { CartService } from '../../model/cart.service';
import { MenuService } from '../../model/menu.service';
import { NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { DateHelper } from '../../helpers/date-helper';
import { HttpErrorResponse } from '@angular/common/http';
import { UiUtils } from '../../helpers/ui-utils';
import { CartDetailType } from 'src/app/model/cart/enums/cart-detail-type.enum';
import { ApplicationType } from 'src/app/model/enums/application-type.enum';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
    host: { 'class': 'app-cart' },
    encapsulation: ViewEncapsulation.None
})
export class CartComponent implements OnInit, OnDestroy {


    id: number;
    private routeParamsSubscription: Subscription;

    backMenuItem: b2b.MenuItem;
    productTableConfig: b2b.CartHeader & b2b.CartConfig;

    cart: CartService;

    noteFormDisplay: boolean;
    collapsedOptions: boolean;

    selectedDocumentId: CartDocumentType;

    r: ResourcesService;

    keys: Function;

    savingData: boolean;

    message: string;

    @ViewChild('cartForm', { static: false })
    cartForm: NgForm;

    @ViewChild('dueDate', { static: false })
    dueDateInput: ElementRef<HTMLInputElement>;

    @ViewChild('receiptDate', { static: false })
    receiptDateInput: ElementRef<HTMLInputElement>;



    /**
    * Watcher and debounce timer for all header attributes (important becouse of input event on text fields)
    */
    private attributesSubject: Subject<{ index: number, value?: any }>;
    private attributesSub: Subscription;

    /**
    * Watcher and debounce timer for all cart options (important becouse of input event on text fields)
    * Now is used only for source number, but it will be nessesary for every text input added in future.
    */
    private cartDetailsSubject: Subject<CartDetailType>;
    private cartDetailsSub: Subscription;

    /**
    * Watcher and debounce timer for all steppers (important becouse of input and click events)
    */
    private quantitySubject: Subject<{ index: number, quantity: number }>;
    private quantitySub: Subscription;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        public cartsService: CartsService,
        cartService: CartService,
        private commonAvailableCartsService: CommonAvailableCartsService,
        private commonModalService: CommonModalService
    ) {

        this.r = resourcesService;
        this.cart = cartService;
        this.attributesSubject = new Subject<{ index: number, value?: any }>();
        this.cartDetailsSubject = new Subject<CartDetailType>();
        this.quantitySubject = new Subject<{ index: number, quantity: number }>();
    }


    ngOnInit() {
        this.cart.products = undefined;
        this.cart.orderNumber = null;
        this.configService.loaderSubj.next(false);
        this.configService.loaderSubj.next(false);
        this.savingData = false;
        this.noteFormDisplay = false;
        this.collapsedOptions = false;
        this.keys = Object.keys;
        this.configService.loaderSubj.next(true);

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((res: any) => {
            this.configService.loaderSubj.next(true);
            this.message = null;

            if (this.cart.cartId !== Number.parseInt(res.id)) {
                this.cart.pagination.goToStart();
            }

            this.id = Number.parseInt(res.id);
            this.cart.cartId = Number.parseInt(res.id);

            this.cart.loadProducts(this.id).then(() => {

                //cart config options are in both objects, but table component requires single config object
                this.productTableConfig = Object.assign({}, this.configService.config, this.cart.config, this.cart.headerData);
                this.configService.loaderSubj.next(false);
                //JD
                this.commonModalService.showModalCommercial(true);

            }).catch(() => {

                if (!this.configService.isOnline && this.cart.products === undefined) {
                    this.message = this.r.translations.noDataInOfflineMode;
                }

                this.configService.loaderSubj.next(false);
            });


            this.cart.getItemsWithExceededStates(); // used also for validate credit limit

        });

        this.backMenuItem = this.menuService.defaultBackItem;


        //setting watchers with debounce timers

        this.quantitySub = this.quantitySubject.pipe(debounceTime(1000)).subscribe(() => {

            const quantityRequests = [];

            this.cart.products.forEach((item, i) => {

                if (item.quantityChanged) {

                    if (this.cart.isCartFromQuote) {
                        quantityRequests.push(this.updateItemQuantityIfCartIsFromQuote(item));
                        return;
                    }

                    quantityRequests.push(this.cart.changeItemQuantity(i, item.quantity).then((res) => {
                        item.quantityChanged = false;
                        this.cartsService.updateSpecificCart(this.id, this.cart.summaries);
                    }));
                }
            });

            Promise.all(quantityRequests).then(() => {
                this.savingData = false;
                this.cart.getItemsWithExceededStates(); // used also for validate credit limit
            });


        });

        this.attributesSub = this.attributesSubject.pipe(debounceTime(1000)).subscribe((e) => {

            this.cart.updateHeaderAttribute(e.index, e.value).then(res => {

                this.savingData = false;

            });
        });

        this.cartDetailsSub = this.cartDetailsSubject.pipe(debounceTime(1000)).subscribe(this.inCaseCartDetailsSubscribe.bind(this));

    }

    private updateItemQuantityIfCartIsFromQuote(currentProduct: b2b.CartProduct): Promise<void> {
        return this.cart.updateItemQuantityInCartFromQuote(this.id, currentProduct.itemId, currentProduct.quantity).then(() => {
            currentProduct.quantityChanged = false;
            this.cart.loadProducts().then(() => {
                this.cartsService.updateSpecificCart(this.id, this.cart.summaries);
            });
        });
    }

    private inCaseCartDetailsSubscribe(type: CartDetailType) {
        switch (type) {
            case CartDetailType.sourceNumber:
                return this.inCaseUpdateSourceNumber();

            case CartDetailType.description:
                return this.inCaseUpdateDescription();
        }
    }

    private inCaseUpdateSourceNumber() {
        if (this.cart.isCartFromQuote) {
            this.cart.updateSourceNumberInCartFromQuote(this.id, this.cart.headerData.sourceNumber).then(() => { this.savingData = false; });
            return;
        }

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.cart.updateSourceNumberXl(this.id, this.cart.headerData.sourceNumber).then(() => { this.savingData = false; });
                break;

            case ApplicationType.ForAltum:
                this.cart.updateSourceNumberAltum(this.id, this.cart.headerData.sourceNumber).then(() => { this.savingData = false; });
                break;

            default:
                console.error('inCaseUpdateSourceNumber(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
        }
    }

    private inCaseUpdateDescription() {
        if (this.cart.isCartFromQuote) {
            this.cart.updateDescriptionInCartFromQuote(this.id, this.cart.headerData.description).then(() => { this.savingData = false; });
            return;
        }

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.cart.updateDescriptionXl(this.id, this.cart.headerData.description).then(() => { this.savingData = false; });
                break;

            case ApplicationType.ForAltum:
                this.cart.updateDescriptionAltum(this.id, this.cart.headerData.description).then(() => { this.savingData = false; });
                break;

            default:
                console.error('inCaseUpdateDescription(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
        }
    }


    changeNoteDisplay() {
        this.noteFormDisplay = !this.noteFormDisplay;
    }


    selectDelivery() {
        if (this.cart.deliveryLoaded) {
            const selectedDelivery = this.cart.deliveryMethods.find(item => item.name === this.cart.headerData.deliveryMethod);

            this.savingData = true;
            this.cart.headerData.deliveryMethod = selectedDelivery.name;
            this.cart.headerData.translationDeliveryMethod = selectedDelivery.translationName;

            if (this.cart.isCartFromQuote) {
                this.cart.updateDeliveryMethodInCartFromQuote(this.id, this.cart.headerData.deliveryMethod).then(() => { this.savingData = false; });
                return;
            }

            switch (this.configService.applicationId) {
                case ApplicationType.ForXL:
                    this.cart.updateDeliveryMethodXl(this.id, this.cart.headerData.deliveryMethod).then(() => { this.savingData = false; });
                    break;

                case ApplicationType.ForAltum:
                    const deliveryMethodNumber = Number(this.cart.headerData.deliveryMethod);
                    if (isNaN(deliveryMethodNumber)) {
                        console.error('selectDelivery(ERROR): Delivery method: (' + this.cart.headerData.deliveryMethod + ') is not a number, application type: ' + ApplicationType.ForAltum);
                        break;
                    }
                    this.cart.updateDeliveryMethodAltum(this.id, deliveryMethodNumber).then(() => { this.savingData = false; });
                    break;

                default:
                    console.error('selectDelivery(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
            }
        }
    }

    selectPayment() {

        if (this.cart.paymentsLoaded) {
            const selectedPayment: b2b.Option2 = this.cart.paymentForms.find((item: b2b.Option2) => {
                return item.id === this.cart.headerData.paymentFormId;
            });

            this.savingData = true;
            this.cart.headerData.paymentForm = selectedPayment.name;

            switch (this.configService.applicationId) {
                case ApplicationType.ForXL:
                    this.inCaseSelectPaymentInXl();
                    break;

                case ApplicationType.ForAltum:
                    this.inCaseSelectPaymentInAltum();
                    break;

                default:
                    console.error('selectPayment(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
            }
        }
    }

    private inCaseSelectPaymentInXl() {
        if (this.cart.isCartFromQuote) {
            this.cart.updatePaymentFormXlInCartFromQuote(this.id, this.cart.headerData.paymentFormId).then(() => { this.savingData = false; });
            return;
        }
        this.cart.updatePaymentFormXl(this.id, this.cart.headerData.paymentFormId).then(() => { this.savingData = false; });
    }

    private inCaseSelectPaymentInAltum() {
        if (this.cart.isCartFromQuote) {
            this.cart.updatePaymentFormAltumInCartFromQuote(this.id, this.cart.headerData.paymentFormId).then(() => { this.savingData = false; });
            return;
        }
        this.cart.updatePaymentFormAltum(this.id, this.cart.headerData.paymentFormId).then(() => { this.savingData = false; });
    }

    selectWarehouse() {

        if (this.cart.warehousesService.warehouses) {
            let warehouse = this.cart.warehousesService.warehouses.find(item => this.cart.headerData.warehouseId === item.id);

            if (warehouse === undefined) {
                warehouse = { id: 0, text: '' };
                this.cart.headerData.warehouseId = warehouse.id;
            }

            this.cart.headerData.warehouseName = warehouse.text;
            this.savingData = true;

            if (this.cart.isCartFromQuote) {
                this.cart.updateWarehouseInCartFromQuote(this.id, this.cart.headerData.warehouseId).then(() => {
                    this.savingData = false;
                    this.cart.products = this.cart.products.slice(); //old comment - update refference to onPush table detection
                });
                return;
            }

            switch (this.configService.applicationId) {
                case ApplicationType.ForXL:
                    this.cart.updateWarehouseXl(this.id, this.cart.headerData.warehouseId).then(() => {
                        this.savingData = false;
                        this.cart.products = this.cart.products.slice(); //old comment - update refference to onPush table detection
                    });
                    break;

                case ApplicationType.ForAltum:
                    this.cart.updateWarehouseAltum(this.id, this.cart.headerData.warehouseId).then(() => {
                        this.savingData = false;
                        this.cart.products = this.cart.products.slice(); //old comment - update refference to onPush table detection
                    });
                    break;

                default:
                    console.error('selectWarehouse(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
            }
        }
    }


    selectShippingAddress() {

        if (this.cart.adressesLoaded) {
            const shippingAddress: b2b.Option2 = this.cart.shippingAddresses.find((item: b2b.Option2) => {
                return item.id === this.cart.headerData.addressId;
            });

            this.cart.headerData.address = shippingAddress.name;
            this.savingData = true;

            if (this.cart.isCartFromQuote) {
                this.cart.updateAddressInCartFromQuote(this.id, this.cart.headerData.addressId).then(() => { this.savingData = false; });
                return;
            }

            switch (this.configService.applicationId) {
                case ApplicationType.ForXL:
                    this.cart.updateAddressXl(this.id, this.cart.headerData.addressId).then(() => { this.savingData = false; });
                    break;

                case ApplicationType.ForAltum:
                    this.cart.updateAddressAltum(this.id, this.cart.headerData.addressId).then(() => { this.savingData = false; });
                    break;

                default:
                    console.error('selectShippingAddress(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
            }
        }
    }


    selectComplection() {
        this.savingData = true;

        if (this.cart.isCartFromQuote) {
            this.cart.updateRealizationXlInCartFromQuote(this.id, this.cart.headerData.completionEntirely).then(() => { this.savingData = false; });
            return;
        }

        this.cart.updateRealizationXl(this.id, this.cart.headerData.completionEntirely).then(() => { this.savingData = false; });
    }


    changeItemQuantity(params) {
        this.savingData = true;
        this.cart.products[params.index].quantityChanged = true;
        this.quantitySubject.next({ index: params.index, quantity: params.quantity });
    }

    updateDetailTextField(type: CartDetailType) {
        this.savingData = true;
        this.cartDetailsSubject.next(type);
    }

    updateDetailDateField(type: CartDetailType) {
        this.savingData = true;
        switch (type) {
            case CartDetailType.realizationDate:
                return this.inCaseUpdateRealizationDate();

            case CartDetailType.paymentDate:
                return this.inCaseUpdatePaymentDate();

            default:
        }
    }

    private inCaseUpdateRealizationDate() {
        if (this.cart.isCartFromQuote) {
            this.cart.updateRealizationDateInCartFromQuote(this.id, this.cart.headerData.receiptDate).then(() => { this.savingData = false; });
            return;
        }

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.cart.updateRealizationDateXl(this.id, this.cart.headerData.receiptDate).then(() => { this.savingData = false; });
                break;

            case ApplicationType.ForAltum:
                this.cart.updateRealizationDateAltum(this.id, this.cart.headerData.receiptDate).then(() => { this.savingData = false; });
                break;

            default:
                console.error('inCaseUpdateRealizationDate(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
        }
    }

    private inCaseUpdatePaymentDate() {
        if (this.cart.isCartFromQuote) {
            this.cart.updatePaymentDateInCartFromQuote(this.id, this.cart.headerData.dueDate).then(() => { this.savingData = false; });
            return;
        }

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.cart.updatePaymentDateXl(this.id, this.cart.headerData.dueDate).then(() => { this.savingData = false; });
                break;

            case ApplicationType.ForAltum:
                this.cart.updatePaymentDateAltum(this.id, this.cart.headerData.dueDate).then(() => { this.savingData = false; });
                break;

            default:
                console.error('inCaseUpdatePaymentDate(ERROR): Not implemented action for application type: ' + this.configService.applicationId);
        }
    }

    updateHeaderAttribute(index, value) {
        this.savingData = true;
        this.attributesSubject.next({ index: index, value: value });
    }


    removeItem({ id, no }) {

        this.savingData = true;

        if (this.cart.products.length === 1) {
            this.configService.loaderSubj.next(true);
        }

        this.cart.removeItem(id, no, this.id).then((productsAmount) => {

            this.savingData = false;

            if (productsAmount === 0) {

                this.cartsService.carts.delete(this.id);
                this.cartsService.recalculateSummary();
                this.commonAvailableCartsService.refreshAvailableCarts();
                //Map refference must be changed to rebind data. Deleting map item doesn't rebind data.
                this.cartsService.carts = new Map(this.cartsService.carts);

                this.router.navigate([this.menuService.routePaths.home]);
                this.configService.loaderSubj.next(false);
                return;
            }


            this.cartsService.updateSpecificCart(this.cart.cartId, this.cart.summaries);
            this.configService.loaderSubj.next(false);
        });
    }

    changePage(currentPage) {
        this.configService.loaderSubj.next(true);
        this.cart.changePage(currentPage).then(() => {
            this.configService.loaderSubj.next(false);
        });
    }

    addDocument() {
        this.message = null;

        this.configService.loaderSubj.next(true);

        return this.cart.addDocument().then((res: b2b.AddDocumentSuccess) => {

            this.configService.loaderSubj.next(false);

            this.cartsService.carts.delete(this.id);

            //Map refference must be changed to rebind data. Deleting map item doesn't rebind data.
            this.cartsService.carts = new Map(this.cartsService.carts);

            this.cartsService.recalculateSummary();

            switch (this.cart.selectedDocumentId) {
                //there will be more types in the future

                case CartDocumentType.order:
                    this.router.navigate([this.menuService.routePaths.thankYou, this.id, res.ids.id]);
                    break;

                case CartDocumentType.inquiry:
                    this.router.navigate([this.menuService.routePaths.inquiries, res.ids.id]);
                    break;

                default:
                    this.router.navigate([this.menuService.routePaths.home]);
                    break;
            }

            return res;

        }).catch((err: HttpErrorResponse) => {


            if (err.error) {

                if (typeof err.error === 'string') {
                    this.message = err.error;
                }
            }

            if (err.error === 406) {
                this.message = this.r.translations.deliveryMethodOrPaymentFormIsEmpty;
            }

            this.configService.loaderSubj.next(false);
            UiUtils.scrollToTop();
        });


    }

    changeCart(key: number) {
        this.cart.products = undefined;
        this.router.navigate([this.menuService.routePaths.cart, key]);
    }

    clearErrors() {
        this.message = null;
    }

    /**
     * Fixing wrong validation of native date controls. They doesn't respect min, max and required values for direct input.
     * Validators respected only for datapicker. 
     */
    datesInputGuardian(value, dateInputType: 'receiptDate' | 'dueDate') {

        if (!DateHelper.isValid(value, new Date())) {

            if (dateInputType === 'receiptDate') {
                this.receiptDateInput.nativeElement.value = DateHelper.dateToString(this.cart.headerData.receiptDate);
            }

            if (dateInputType === 'dueDate') {
                this.dueDateInput.nativeElement.value = DateHelper.dateToString(this.cart.headerData.dueDate);
            }

            return;
        }


        if (dateInputType === 'receiptDate') {
            this.cart.headerData.receiptDate = new Date(value);
        }

        if (dateInputType === 'dueDate') {
            this.cart.headerData.dueDate = new Date(value);
        }

    }

    ngOnDestroy() {

        this.routeParamsSubscription.unsubscribe();
        this.attributesSubject.unsubscribe();
        this.cartDetailsSubject.unsubscribe();
        this.quantitySubject.unsubscribe();
        this.quantitySub.unsubscribe();
        this.attributesSub.unsubscribe();
        this.cartDetailsSub.unsubscribe();
    }
}
