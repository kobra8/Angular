
import { debounceTime } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { CartOptionType } from '../../model/enums/cart-option-type.enum';

import { CartDocumentType } from '../../model/enums/cart-document-type.enum';
import { CartsService } from '../../model/carts.service';
import { CartService } from '../../model/cart.service';
import { MenuService } from '../../model/menu.service';
import { NgForm } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { DateHelper } from '../../helpers/date-helper';
import { HttpErrorResponse } from '@angular/common/http';
import { UiUtils } from '../../helpers/ui-utils';

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

    @ViewChild('cartForm')
    cartForm: NgForm;

    @ViewChild('dueDate')
    dueDateInput: ElementRef<HTMLInputElement>;

    @ViewChild('receiptDate')
    receiptDateInput: ElementRef<HTMLInputElement>;



    /**
    * Watcher and debounce timer for all header attributes (important becouse of input event on text fields)
    */
    private attributesSubject: Subject<number>;
    private attributesSub: Subscription;

    /**
    * Watcher and debounce timer for all cart options (important becouse of input event on text fields)
    * Now is used only for source number, but it will be nessesary for every text input added in future.
    */
    private cartOptionsSubject: Subject<CartOptionType>;
    private cartOptionsSub: Subscription;

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
    ) {

        this.r = resourcesService;
        this.cart = cartService;
        this.attributesSubject = new Subject<number>();
        this.cartOptionsSubject = new Subject<CartOptionType>();
        this.quantitySubject = new Subject<{ index: number, quantity: number }>();
    }


    ngOnInit() {
        this.configService.loaderSubj.next(false);
        this.configService.loaderSubj.next(false);
        this.savingData = false;
        this.noteFormDisplay = false;
        this.collapsedOptions = true;
        this.keys = Object.keys;
        this.configService.loaderSubj.next(true);

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((res: any) => {
            this.configService.loaderSubj.next(true);
            this.message = null;

            this.id = Number(res.id);
            this.cart.cartId = Number(res.id);

            this.cart.loadProducts(this.id).then(() => {

                //cart config options are in both objects, but table component requires single config object
                this.productTableConfig = Object.assign({}, this.configService.config, this.cart.config, this.cart.headerData);
                this.configService.loaderSubj.next(false);

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

        this.attributesSub = this.attributesSubject.pipe(debounceTime(1000)).subscribe((index) => {

            this.cart.updateHeaderAttribute(index).then(res => {

                this.savingData = false;

            });
        });

        this.cartOptionsSub = this.cartOptionsSubject.pipe(debounceTime(1000)).subscribe(type => {
            this.updateHeader(type);
        });

    }


    changeNoteDisplay() {
        this.noteFormDisplay = !this.noteFormDisplay;
    }


    updateHeader(optionType: CartOptionType) {

        this.savingData = true;
        return this.cart.updateHeader(optionType).then(() => {

            this.savingData = false;

        });
    }


    selectDelivery() {
        if (this.cart.deliveryLoaded) {
            const selectedDelivery = this.cart.deliveryMethods.find(item => item.name === this.cart.headerData.deliveryMethod);

            this.cart.setOptions(<b2b.CartOptions>{ deliveryMethod: selectedDelivery });

            this.updateHeader(CartOptionType.deliveryMethod);
        }
    }

    selectPayment() {

        if (this.cart.paymentsLoaded) {
            const selectedPayment: b2b.Option2 = this.cart.paymentForms.find((item: b2b.Option2) => {
                return item.id === this.cart.headerData.paymentFormId;
            });

            this.cart.setOptions(<b2b.CartOptions>{ paymentForm: selectedPayment });

            this.cart.headerData.paymentForm = selectedPayment.name;

            this.updateHeader(CartOptionType.paymentForm);
        }
    }

    selectWarehouse() {

        if (this.cart.warehousesService.warehouses) {
            let warehouse = this.cart.warehousesService.warehouses.find(item => this.cart.headerData.warehouseId === item.id);

            if (warehouse === undefined) {
                warehouse = { id: '0', text: '' };
            }

            this.cart.setOptions(<b2b.CartOptions>{ warehouse: warehouse });

            this.updateHeader(CartOptionType.warehouse).then(() => {
                this.cart.products = this.cart.products.slice(); //update refference to onPush table detection
            });
        }
    }


    selectShippingAddress() {

        if (this.cart.adressesLoaded) {
            const shippingAddress: b2b.Option = this.cart.shippingAddresses.find((item: b2b.Option) => {
                return item.id === this.cart.headerData.addressId;
            });

            this.cart.setOptions(<b2b.CartOptions>{ shippingAddress: shippingAddress });

            this.cart.headerData.address = shippingAddress.text;

            this.updateHeader(CartOptionType.shippingAddress);
        }
    }


    selectComplection() {

        this.cart.setOptions(<b2b.CartOptions>{ completionEntirely: Number(this.cart.headerData.completionEntirely) });
        this.updateHeader(CartOptionType.completionEntirely);
    }


    changeItemQuantity(params) {
        this.savingData = true;
        this.cart.products[params.index].quantityChanged = true;
        this.quantitySubject.next({ index: params.index, quantity: params.quantity });
    }


    updateTextField(type: CartOptionType) {
        this.savingData = true;
        this.cartOptionsSubject.next(type);
    }


    updateHeaderAttribute(index) {
        this.savingData = true;
        this.attributesSubject.next(index);
    }


    collapseOptions = () => {
        this.collapsedOptions = !this.collapsedOptions;
    }

    removeItem({id, no}) {

        this.savingData = true;

        if (this.cart.products.length === 1) {
            this.configService.loaderSubj.next(true);
        }

        this.cart.removeItem(id, no, this.id).then((productsAmount) => {

            this.savingData = false;

            if (productsAmount === 0) {
                
                this.cartsService.carts.delete(this.id);
                this.cartsService.recalculateSummary();

                //Map refference must be changed to rebind data. Deleting map item doesn't rebind data.
                this.cartsService.carts = new Map(this.cartsService.carts);

                this.router.navigate([this.configService.routePaths.home]);
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
                    this.router.navigate([this.configService.routePaths.thankYou, this.id, res.ids.id]);
                    break;

                case CartDocumentType.inquiry:
                    this.router.navigate([this.configService.routePaths.inquiries, res.ids.id]);
                    break;

                default:
                    this.router.navigate([this.configService.routePaths.home]);
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
        this.router.navigate([this.configService.routePaths.cart, key]);
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
        this.cart.products = undefined;
        this.routeParamsSubscription.unsubscribe();
        this.attributesSubject.unsubscribe();
        this.cartOptionsSubject.unsubscribe();
        this.quantitySubject.unsubscribe();
        this.quantitySub.unsubscribe();
        this.attributesSub.unsubscribe();
        this.cartOptionsSub.unsubscribe();
    }


}
