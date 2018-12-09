import { Component, OnInit, Output, OnDestroy, ViewEncapsulation, ViewChild, PACKAGE_ROOT_URL } from '@angular/core';
import { b2b } from '../../../b2b';
import { HttpClient } from '@angular/common/http';
import { CustomerService } from '../../model/customer.service';
import { ResourcesService } from '../../model/resources.service';
import { Subscription } from 'rxjs/Subscription';
import { CartsService } from '../../model/carts.service';
import { ProductsService } from '../../model/products.service';
import { Router, NavigationEnd } from '@angular/router';
import { MenuService } from '../../model/menu.service';
import { NgForm } from '@angular/forms';
import { AccountService } from '../../model/account.service';
import { ConfigService } from '../../model/config.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    host: { 'class': 'app-header' },
    styleUrls: ['./header.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HeaderComponent implements OnInit, OnDestroy {


    carts: CartsService;
    r: ResourcesService;
    pendingMenuItem: b2b.MenuItem;

    routeSubscription: Subscription;

    @ViewChild('searchForm')
    searchForm: NgForm;

    fullCurrentUrl: string;

    private searchSub: Subscription;

    removeConfirmModal: {
        visibility: boolean;
        cartId: number;
    };

    constructor(
        private router: Router,
        resourcesService: ResourcesService,
        public accountService: AccountService,
        public customerService: CustomerService,
        public configService: ConfigService,
        cartsService: CartsService,
        private productsService: ProductsService,
        private menuService: MenuService
    ) {

        this.carts = cartsService;
        this.r = resourcesService;

        this.removeConfirmModal = {
            visibility: false,
            cartId: 0
        };
    }

    ngOnInit() {

        this.customerService.loadHeaderData();

        this.carts.loadList();

        this.menuService.loadFullMenuItems().then(res => {
            this.pendingMenuItem = this.menuService.fullMenuItems.find(item => item.url.toLocaleLowerCase().includes('pending'));
        });

        this.searchSub = this.productsService.searchEvent.subscribe((res) => {

            if (res.searchPhrase !== this.searchForm.controls.searchPhrase.value) {
                this.searchForm.controls.searchPhrase.setValue(res.searchPhrase);
            }
        });


        this.routeSubscription = this.router.events.filter(event => event instanceof NavigationEnd).subscribe(event => {
            this.fullCurrentUrl = this.router.url;
        });
    }




    search(formValid, formValue) {

        if (formValid) {


            this.productsService.filters.currentFilter.filter = formValue.searchPhrase;

            if (!this.fullCurrentUrl.toLocaleLowerCase().includes('items')) {

                this.router.navigateByUrl('/Items').then(() => {

                    this.productsService.searchEvent.next({ searchPhrase: formValue.searchPhrase });
                });

            } else {

                this.productsService.searchEvent.next({ searchPhrase: formValue.searchPhrase });
            }

        }
    }


    confirmModalVisibility(cartId: number, isVisible?: boolean) {

        this.removeConfirmModal.cartId = cartId;
        this.removeConfirmModal.visibility = (isVisible !== undefined) ? isVisible : !this.removeConfirmModal.visibility;
    }


    ngOnDestroy() {

        this.routeSubscription.unsubscribe();
        this.searchSub.unsubscribe();
    }

}
