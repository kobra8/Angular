import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';

import { OrderDetailsService } from '../../model/order-details.service';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';
import { ConfigService } from '../../model/config.service';

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

    constructor(
        resourcesService: ResourcesService,
        private menuService: MenuService,
        public orderDetailsService: OrderDetailsService,
        public configService: ConfigService,
        private activatedRoute: ActivatedRoute
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {
        this.backMenuItem = this.menuService.defaultBackItem;

        this.routeParamsSubscription = this.activatedRoute.params.subscribe((params: Params) => {
            this.orderId = +params.orderId;
            this.cartId = +params.cartId;
        });

        this.orderDetailsService.loadDetails(this.orderId).then(() => {
            this.productsCount = this.orderDetailsService.products.length;
            this.configService.loaderSubj.next(false);
        });
    }


    ngOnDestroy() {
        this.routeParamsSubscription.unsubscribe();
    }

}
