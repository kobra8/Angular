import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

import { ResourcesService } from './model/resources.service';
import { CustomerService } from './model/customer.service';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { MenuService } from './model/menu.service';
import { HomeComponent } from '../../assets/homePage/home.component';
import { SliderComponent } from './controls/slider/slider.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { CartsService } from './model/carts.service';
import { ProductsService } from './model/products.service';
import { PromotionsService } from './model/promotions.service';
import { PromotionDetailsService } from './model/promotion-details.service';
import { PromotionsComponent } from './components/promotions/promotions.component';
import { AccountService } from './model/account.service';
import { GroupsService } from './model/groups.service';
import { ConfigService } from './model/config.service';
import { AccountComponent } from './components/account/account.component';
import { ProductFlagsComponent } from './components/product-flags/product-flags.component';
import { ThankYouComponent } from './components/thank-you/thank-you.component';
import { CartService } from './model/cart.service';
import { SharedModule } from './shared.module';
import { b2b } from '../b2b';
import { OrderDetailsService } from './model/order-details.service';
import { ImportCartResultsViewComponent } from './components/import-cart-results-view/import-cart-results-view.component';
import { ContactComponent } from './components/contact/contact.component';
import { BusinessTermsComponent } from './components/business-terms/business-terms.component';



const routes: b2b.RouteWithKey[] = [

    { path: '', key: 'home', component: HomeComponent, canActivate: [AccountService] },

    {
        path: 'items', key: 'items', canActivate: [AccountService], children: [
            { path: '', redirectTo: '0', pathMatch: 'full' },
            { path: ':id', component: ProductsComponent },

        ]
    },

    { path: 'itemdetails/:id', key: 'itemDetails', component: ProductDetailsComponent, canActivate: [AccountService] },

    {
        path: 'carts', key: 'cart', canActivate: [AccountService], children: [
            { path: ':id', component: CartComponent },
            { path: 'thankyou/:cartId/:orderId', key: 'thankYou', component: ThankYouComponent },
        ]
    },

    { path: 'promotions', key: 'promotions', component: PromotionsComponent, canActivate: [AccountService] },
    { path: 'contact', key: 'contact', component: ContactComponent, canActivate: [AccountService] },
    { path: 'businessterms', key: 'businessterms', component: BusinessTermsComponent, canActivate: [AccountService] },

    { path: 'login', key: 'login', component: AccountComponent, canActivate: [AccountService] },
    { path: 'remind', key: 'remindPassword', component: AccountComponent, canActivate: [AccountService] },
    {
        path: 'remindpassword', key: 'resetPassword', canActivate: [AccountService], children: [
            { path: 'passwordreminder', key: 'resetPassword', component: AccountComponent },
        ]
    },

    { path: 'fileImportResult', key: 'fileImportResult', component: ImportCartResultsViewComponent, canActivate: [AccountService] },

    { path: 'profile', key: 'profile', canActivate: [AccountService], loadChildren: './customer-profile.module#CustomerProfileModule' },

    { path: '**', redirectTo: '', pathMatch: 'full' }

];

const initialkeysForChildModules: b2b.RouteWithKey[] = [
    { key: 'inquiries', redirectTo: 'profile/inquiries' },
    { key: 'pending', redirectTo: 'profile/pending' },
    { key: 'orders', redirectTo: 'profile/orders' },
];


@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        HeaderComponent,
        FooterComponent,
        ProductsComponent,
        CartComponent,
        ProductDetailsComponent,
        PromotionsComponent,
        AccountComponent,
        ProductFlagsComponent,
        ThankYouComponent,
        ContactComponent,
        BusinessTermsComponent
    ],
    entryComponents: [SliderComponent],
    imports: [
        BrowserModule,
        SharedModule,
        RouterModule.forRoot(routes),
        ServiceWorkerModule.register('/ngsw-worker.js', { enabled: !(<any>window).dMode })
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    providers: [
        ConfigService,
        AccountService,
        ResourcesService,
        CartService,
        CustomerService,
        MenuService,
        GroupsService,
        ProductsService,
        CartsService,
        PromotionsService,
        PromotionDetailsService,
        OrderDetailsService

    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(configService: ConfigService) {
        configService.configureRoutePaths(routes.concat(initialkeysForChildModules));
    }
}


