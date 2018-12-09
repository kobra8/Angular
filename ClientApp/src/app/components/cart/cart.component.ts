import { Component, OnInit, OnDestroy, ViewEncapsulation, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { CartOptionType } from '../../model/enums/cart-option-type.enum';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import { CartDocumentType } from '../../model/enums/cart-document-type.enum';
import { CartsService } from '../../model/carts.service';
import { CartService } from '../../model/cart.service';
import { MenuService } from '../../model/menu.service';
import { NgForm, FormGroup } from '@angular/forms';
import { ConfigService } from '../../model/config.service';
import { DateHelper } from '../../helpers/date-helper';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
    host: { 'class': 'app-cart' },
    providers: [CartService],
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
    documentAdding: boolean;

    error: any;

    @ViewChild('cartForm')
    cartForm: NgForm;

    @ViewChild('dueDate')
    dueDateInput: ElementRef;

    @ViewChild('receiptDate')
    receiptDateInput: ElementRef;


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

        this.documentAdding = false;
        this.savingData = false;
        this.noteFormDisplay = false;
        this.collapsedOptions = true;
        this.keys = Object.keys;

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((res: any) => {

            this.id = Number(res.id);
            this.cart.deliveryLoaded = false;
            this.cart.paymentsLoaded = false;
            this.cart.warehousesLoaded = false;
            this.cart.loadProducts(this.id).then(() => {
                //cart config options are in both objects, but table component requires single config object
                this.productTableConfig = Object.assign(this.cart.config, this.cart.headerData);
            });

            this.cart.getItemsWithExceededStates();

        });

        this.backMenuItem = this.menuService.defaultBackItem;


        //setting watchers with debounce timers

        this.quantitySub = this.quantitySubject.debounceTime(1000).subscribe(() => {

            const quantityRequests = [];

            this.cart.products.forEach((item, i) => {

                if (item.quantityChanged) {

                    quantityRequests.push(this.cart.changeItemQuantity(i, item.quantity).then((res) => {

                        item.quantityChanged = false;
                        this.savingData = false;
                        this.cartsService.updateSpecificCart(this.id, this.cart.summaries);

                    }));
                }
            });

            //checking states must wait for all unit changes.
            Promise.all(quantityRequests).then(() => {
                this.cart.getItemsWithExceededStates();
            });


        });

        this.attributesSub = this.attributesSubject.debounceTime(1000).subscribe((index) => {

            this.cart.updateHeaderAttribute(index).then(res => {

                this.savingData = false;

            });
        });

        this.cartOptionsSub = this.cartOptionsSubject.debounceTime(1000).subscribe(type => {
            this.updateHeader(type);
        });


    }


    changeNoteDisplay() {
        this.noteFormDisplay = !this.noteFormDisplay;
    }


    updateHeader(optionType: CartOptionType) {

        this.savingData = true;
        this.cart.updateHeader(optionType, this.cart.headerData).then(() => {

            this.savingData = false;

        });
    }


    selectDelivery() {

        const selectedDelivery: b2b.DeliveryMethod = this.cart.deliveryMethods.find((item: b2b.DeliveryMethod) => {
            return item.name === this.cart.headerData.deliveryMethod;
        });

        this.cart.setOptions(<b2b.CartOptions>{ deliveryMethod: selectedDelivery });

        this.updateHeader(CartOptionType.deliveryMethod);
    }

    selectPayment() {

        const selectedPayment: b2b.Option2 = this.cart.paymentForms.find((item: b2b.Option2) => {
            return item.id === this.cart.headerData.paymentFormId;
        });

        this.cart.setOptions(<b2b.CartOptions>{ paymentForm: selectedPayment });

        this.cart.headerData.paymentForm = selectedPayment.name;

        this.updateHeader(CartOptionType.paymentForm);
    }

    selectWarehouse() {

        let warehouse = this.cart.warehousesRepo.warehouses.find(item => this.cart.headerData.warehouseId === item.id);

        if (warehouse === undefined) {
            warehouse = { id: '0', text: '' };
        }

        this.cart.setOptions(<b2b.CartOptions>{ warehouse: warehouse });

        //this.cart.headerData.warehouseName = warehouse.text;

        this.updateHeader(CartOptionType.warehouse);

    }


    selectShippingAddress() {

        const shippingAddress: b2b.Option = this.cart.shippingAddresses.find((item: b2b.Option) => {
            return item.id === this.cart.headerData.addressId;
        });

        this.cart.setOptions(<b2b.CartOptions>{ shippingAddress: shippingAddress });

        this.cart.headerData.address = shippingAddress.text;

        this.updateHeader(CartOptionType.shippingAddress);
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

    removeItem(itemId: number) {

        this.savingData = true;
        this.cart.removeItem(itemId, this.id).then((productsAmount) => {

            this.savingData = false;

            if (productsAmount === 0) {
                this.cartsService.carts.delete(this.id);
                this.cartsService.recalculateSummary();

                //Map refference must be changed to rebind data. Deleting map item doesn't rebind data.
                this.cartsService.carts = new Map(this.cartsService.carts);

                this.router.navigate(['/Items']);
                return;
            }

            this.cartsService.updateSpecificCart(this.cart.cartId, this.cart.summaries);
        });
    }

    changePage(currentPage) {
        this.cart.paginationRepo.changePage(currentPage);
        this.cart.loadProducts(this.id);
    }

    addDocument() {

        this.documentAdding = true;

        this.cart.addDocument().then((res: b2b.AddDocumentSuccess & b2b.AddDocumentFailture) => {

            this.documentAdding = false;

            if (res.error) {
                this.error = res.error;
            } else {

                this.cartsService.carts.delete(this.id);

                //Map refference must be changed to rebind data. Deleting map item doesn't rebind data.
                this.cartsService.carts = new Map(this.cartsService.carts);

                this.cartsService.recalculateSummary();

                switch (this.cart.selectedDocumentId) {
                    //there will be more types in the future

                    case CartDocumentType.order:
                        this.router.navigate(['Profile/Orders', res.ids.id]);
                        break;

                    case CartDocumentType.inquiry:
                        this.router.navigate(['Profile/Inquiries', res.ids.id]);
                        break;

                    default:
                        this.router.navigate(['Items']);
                        break;

                }

            }
        });


    }

    changeCart(key: number) {
        this.cart.products = undefined;
        this.router.navigate(['/Carts', key]);
    }

    trackByFn(index, item: b2b.CartProduct) {
        return item.itemId;

    }

    clearErrors() {
        this.error = null;
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
        this.cartOptionsSubject.unsubscribe();
        this.quantitySubject.unsubscribe();
        this.quantitySub.unsubscribe();
        this.attributesSub.unsubscribe();
        this.cartOptionsSub.unsubscribe();
    }


}
