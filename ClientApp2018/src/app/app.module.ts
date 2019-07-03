import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, LOCALE_ID } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { Route, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ResourcesService } from './model/resources.service';
import { CustomerService } from './model/customer.service';
import { FormatPipe } from './helpers/pipes/format.pipe';
import { LazySrcDirective } from './helpers/directives/lazy-src.directive';
import { AppComponent } from './app.component';
import { DropdownComponent } from './controls/dropdown/dropdown.component';
import { PagerComponent } from './controls/pager/pager.component';
import { StepperComponent } from './controls/stepper/stepper.component';
import { CheckboxComponent } from './controls/checkbox/checkbox.component';
import { RadioComponent } from './controls/radio/radio.component';
import { CollapserComponent } from './controls/collapser/collapser.component';
import { HeaderComponent } from './components/header/header.component';
import { MenuComponent } from './components/menu/menu.component';
import { MenuService } from './model/menu.service';
import { HomeComponent } from '../../assets/homePage/home.component';
import { SliderComponent } from './controls/slider/slider.component';
import { StickyComponent } from './controls/sticky/sticky.component';
import { LoadingComponent } from './controls/loading/loading.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { CartsService } from './model/carts.service';
import { ProductsService } from './model/products.service';
import { DocumentsListComponent } from './components/documents-list/documents-list.component';
import { OrdersService } from './model/orders.service';
import { InquiriesService } from './model/inquiries.service';
import { QuotesService } from './model/quotes.service';
import { PaymentsService } from './model/payments.service';
import { ComplaintsService } from './model/complaints.service';
import { DeliveryService } from './model/delivery.service';
import { PromotionsService } from './model/promotions.service';
import { PendingService } from './model/pending.service';
import { CustomerDataComponent } from './components/customer-data/customer-data.component';
import { ToPricePipe } from './helpers/pipes/to-price.pipe';
import { DocumentDetailsComponent } from './components/document-details/document-details.component';
import { InquiryDetailsService } from './model/inquiry-details.service';
import { QuoteDetailsService } from './model/quote-details.service';
import { ProductsTableComponent } from './components/products-table/products-table.component';
import { OrderDetailsService } from './model/order-details.service';
import { PaymentDetailsService } from './model/payment-details.service';
import { DeliveryDetailsService } from './model/delivery-details.service';
import { ComplaintDetailsService } from './model/complaint-details.service';
import { IterableToArrayPipe } from './helpers/pipes/iterable-to-array.pipe';
import { PromotionDetailsService } from './model/promotion-details.service';
import { ComplaintFormComponent } from './components/complaint-form/complaint-form.component';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';
import { LazyImageComponent } from './controls/lazy-image/lazy-image.component';
import { PromotionsComponent } from './components/promotions/promotions.component';
import { HighlightPipe } from './helpers/pipes/highlight.pipe';
import { ModalComponent } from './controls/modal/modal.component';
import { FloatingLabelInputComponent } from './controls/floating-label-input/floating-label-input.component';
import { SelectComponent } from './controls/select/select/select.component';
import { OptionComponent } from './controls/select/option/option.component';
import { AccountService } from './model/account.service';
import { GroupsService } from './model/groups.service';
import { GroupsComponent } from './components/groups/groups.component';
import { ConfigService } from './model/config.service';
// JD
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';

registerLocaleData(localePl, 'pl');

const routes: Route[] = [
    {
        path: '', children: [
            { path: '', component: HomeComponent },
            {
                path: 'Items', children: [
                    { path: '', redirectTo: '0', pathMatch: 'full' },
                    { path: ':id', component: ProductsComponent },
                ]
            },
            { path: 'ItemDetails/:id', component: ProductDetailsComponent },
            { path: 'Carts/:id', component: CartComponent },
            { path: 'Promotions', component: PromotionsComponent },
            { path: 'Promotions/:id', component: DocumentDetailsComponent, resolve: { detailsContext: PromotionDetailsService } },
            { path: 'Pending', component: DocumentsListComponent, resolve: { listContext: PendingService } },
        ]
    },
    {
        path: 'Profile', children: [
            { path: '', redirectTo: 'Orders', pathMatch: 'full' },
            { path: 'Orders', component: DocumentsListComponent, resolve: { listContext: OrdersService } },
            { path: 'MyData', component: CustomerDataComponent },
            { path: 'Quotes', component: DocumentsListComponent, resolve: { listContext: QuotesService } },
            { path: 'Inquiries', component: DocumentsListComponent, resolve: { listContext: InquiriesService } },
            { path: 'Payments', component: DocumentsListComponent, resolve: { listContext: PaymentsService } },
            { path: 'Complaints', component: DocumentsListComponent, resolve: { listContext: ComplaintsService } },
            { path: 'Delivery', component: DocumentsListComponent, resolve: { listContext: DeliveryService } },
            { path: 'Orders/:id', component: DocumentDetailsComponent, resolve: { detailsContext: OrderDetailsService } },
            { path: 'Payments/:id/:type', component: DocumentDetailsComponent, resolve: { detailsContext: PaymentDetailsService } },
            { path: 'Quotes/:id', component: DocumentDetailsComponent, resolve: { detailsContext: QuoteDetailsService } },
            { path: 'Inquiries/:id', component: DocumentDetailsComponent, resolve: { detailsContext: InquiryDetailsService } },
            { path: 'Complaints/ItemsComplaint', component: DocumentsListComponent, resolve: { listContext: ComplaintsService } },
            { path: 'Complaints/ComplaintSubmission/:itemsComplaint', component: ComplaintFormComponent },
            { path: 'Complaints/:id', component: DocumentDetailsComponent, resolve: { detailsContext: ComplaintDetailsService } },
            { path: 'Delivery/:id', component: DocumentDetailsComponent, resolve: { detailsContext: DeliveryDetailsService } },
            { path: 'Employees', component: CustomerDataComponent },
        ]
    },
    { path: '**', redirectTo: '', pathMatch: 'full' }

];


@NgModule({
    declarations: [
        FormatPipe,
        AppComponent,
        LazySrcDirective,
        ModalComponent,
        DropdownComponent,
        HomeComponent,
        LoadingComponent,
        HighlightPipe,
        HeaderComponent,
        FooterComponent,
        MenuComponent,
        ProductsComponent,
        FloatingLabelInputComponent,
        PagerComponent,
        StepperComponent,
        CheckboxComponent,
        RadioComponent,
        CollapserComponent,
        CartComponent,
        SliderComponent,
        ProductDetailsComponent,
        DocumentsListComponent,
        CustomerDataComponent,
        ToPricePipe,
        DocumentDetailsComponent,
        ProductsTableComponent,
        IterableToArrayPipe,
        ComplaintFormComponent,
        ProfileMenuComponent,
        StickyComponent,
        LazyImageComponent,
        PromotionsComponent,
        SelectComponent,
        OptionComponent,
        GroupsComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        RouterModule.forRoot(routes),
        FormsModule     
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
        OrdersService,
        InquiriesService,
        QuotesService,
        PaymentsService,
        ComplaintsService,
        DeliveryService,
        PromotionsService,
        PendingService,
        InquiryDetailsService,
        QuoteDetailsService,
        OrderDetailsService,
        PaymentDetailsService,
        DeliveryDetailsService,
        ComplaintDetailsService,
        PromotionDetailsService,
    // JD
        { provide: LOCALE_ID, useValue: 'pl' }
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }


