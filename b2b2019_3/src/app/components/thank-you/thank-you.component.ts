import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { OrderDetailsService } from '../../model/order-details.service';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';
import { ConfigService } from '../../model/config.service';

import { CartsService } from 'src/app/model/carts.service';
import { CartService } from 'src/app/model/cart.service';
import { DateHelper } from 'src/app/helpers/date-helper';

@Component({
  selector: 'app-thank-you',
  templateUrl: './thank-you.component.html',
    styleUrls: ['./thank-you.component.scss'],
    host: { 'class': 'app-thank-you' },
  encapsulation: ViewEncapsulation.None
})

export class ThankYouComponent implements OnInit, OnDestroy {
    r: ResourcesService;
    backMenuItem: b2b.MenuItem;
    routeParamsSubscription: Subscription;
    orderId: number;
    cartId: number;
    productsCount: number;
    state: string;
    date: string;

    constructor(
        resourcesService: ResourcesService,
        private menuService: MenuService,
        public cartService: CartService,
        public configService: ConfigService,
        private activatedRoute: ActivatedRoute,
        private cartsService: CartsService,
        private router: Router,
        private orderDetailsService: OrderDetailsService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {
        this.backMenuItem = this.menuService.defaultBackItem;

        this.cartsService.loadList().then(() => {
            if (this.cartService.products === undefined) {
                if (this.cartsService.carts.size > 0) {
                    this.router.navigate([this.menuService.routePaths.cart, 1]);
                } else {
                    this.router.navigate([this.menuService.routePaths.home]);
                }
            }
        });
        

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((params: Params) => {

            if (this.cartService.products === undefined) {
                return;
            }

            this.orderId = +params.orderId;
            this.cartId = +params.cartId;
            this.productsCount = this.cartService.products.length;
            this.configService.loaderSubj.next(false);

            if (this.configService.permissions.hasAccessToOrdersList) {

                Promise.all([this.r.translationsPromise, this.orderDetailsService.loadDetails(this.orderId)]).then(() => {
                    this.state = this.r.translations[this.orderDetailsService.states.get(this.orderDetailsService.details.state)];
                    this.date = this.orderDetailsService.details.issueDate;
                });
            } else {
                this.date = DateHelper.dateToString(new Date());
            }

        });


    }


    ngOnDestroy() {
        this.routeParamsSubscription.unsubscribe();
    }

}
