import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule, PreloadAllModules } from '@angular/router';
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
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { CartsService } from './model/carts.service';
import { ProductsService } from './model/products.service';
import { AccountService } from './model/account.service';
import { GroupsService } from './model/groups.service';
import { ConfigService } from './model/config.service';
import { AccountComponent } from './components/account/account.component';
import { ProductFlagsComponent } from './components/product-flags/product-flags.component';
import { SharedModule } from './shared.module';
import { b2b } from '../b2b';
import { OrderDetailsService } from './model/order-details.service';
import { ImportCartResultsViewComponent } from './components/import-cart-results-view/import-cart-results-view.component';
import { environment } from 'src/environments/environment.prod';
import { LazyImageComponent } from './controls/lazy-image/lazy-image.component';
import { of, Observable } from 'rxjs';
import { CommonModalService } from './model/shared/common-modal.service';
import { CommonAvailableCartsService } from './model/shared/common-available-carts.service';
import { PrintHandlerService } from './model/shared/printhandler.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContactComponent } from './components/contact/contact.component';


const routes: b2b.RouteWithKey[] = [

    { path: '', key: 'home', component: HomeComponent, canActivate: [AccountService] },

    {
        path: 'items', key: 'items', canActivate: [AccountService], children: [
            { path: '', redirectTo: '0', pathMatch: 'full' },
            { path: ':id', component: ProductsComponent },
        ]
    },

    { path: 'itemdetails/:id', key: 'itemDetails', component: ProductDetailsComponent, canActivate: [AccountService] },

    { path: 'carts', key: 'cart', canActivate: [AccountService], loadChildren: () => import('./cart.module').then(m => m.CartModule) },

    { path: 'contact', key: 'contact', component: ContactComponent, canActivate: [AccountService] },
    { path: 'login', key: 'login', component: AccountComponent, canActivate: [AccountService] },
    { path: 'remind', key: 'remindPassword', component: AccountComponent, canActivate: [AccountService] },
    {
        path: 'remindpassword', key: 'resetPassword', canActivate: [AccountService], children: [
            { path: 'passwordreminder', key: 'resetPassword', component: AccountComponent },
        ]
    },

    { path: 'fileImportResult', key: 'fileImportResult', component: ImportCartResultsViewComponent, canActivate: [AccountService] },

    { path: 'profile', key: 'profile', canActivate: [AccountService], loadChildren: () => import('./customer-profile.module').then(m => m.CustomerProfileModule) },

    { path: '**', redirectTo: '', pathMatch: 'full' }

];

//const initialkeysForLazyModules: b2b.RouteWithKey[] = [
//    { key: 'employees', redirectTo: 'profile/employees' },
//    { key: 'files', redirectTo: 'profile/files' },
//    { key: 'inquiries', redirectTo: 'profile/inquiries' },
//    { key: 'pending', redirectTo: 'profile/pending' },
//    { key: 'orders', redirectTo: 'profile/orders' },
//    { key: 'promotions', redirectTo: 'profile/promotions' }
//];


export function registerSW() {
    return new Observable<unknown>(
        (observer) => {
            if (!(<any>window).dMode) {
                observer.next(true);
            }
            observer.complete();
        });
}

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        HeaderComponent,
        FooterComponent,
        ProductsComponent,
        ProductDetailsComponent,
        AccountComponent,
        ProductFlagsComponent,
        ContactComponent,
    ],
    entryComponents: [SliderComponent, LazyImageComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
        ServiceWorkerModule.register('/ngsw-worker.js', { registrationStrategy: registerSW })
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    providers: [
        ConfigService,
        AccountService,
        ResourcesService,
        CustomerService,
        MenuService,
        GroupsService,
        ProductsService,
        CartsService,
        OrderDetailsService,
        CommonModalService,
        CommonAvailableCartsService,
        PrintHandlerService
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor(menuService: MenuService) {
        menuService.configureRoutePaths(routes);
    }
}


