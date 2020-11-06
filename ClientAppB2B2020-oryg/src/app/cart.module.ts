import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from './shared.module';
import { CartComponent } from './components/cart/cart.component';
import { CartService } from './model/cart.service';
import { ThankYouComponent } from './components/thank-you/thank-you.component';
import { RouterModule } from '@angular/router';
import { b2b } from 'src/b2b';
import { MenuService } from './model/menu.service';
import { CartHeaderService } from './model/cart/cart-header.service';
import { CartQuoteService } from './model/cart/cart-quote.service';
import { CartRequestsService } from './model/cart/cart-requests.service';
import { CartCheckService } from './model/cart/cart-check.service';
import { CartCommonService } from './model/cart/cart-common.service';
import { CountryService } from './model/shared/country.service';


const routes: b2b.RouteWithKey[] = [
    { path: ':id', component: CartComponent },
    { path: 'thankyou/:cartId/:orderId', key: 'thankYou', component: ThankYouComponent }
];

@NgModule({
    declarations: [
        CartComponent,
        ThankYouComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        RouterModule.forChild(routes),
    ],
    providers: [
        CartService,
        CartRequestsService,
        CartHeaderService,
        CartQuoteService,
        CartCheckService,
        CartCommonService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class CartModule {
    constructor(menuService: MenuService) {
        menuService.configureRoutePaths(routes, 'carts');
    }
}
