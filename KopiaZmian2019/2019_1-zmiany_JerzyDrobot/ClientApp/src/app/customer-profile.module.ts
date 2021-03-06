import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentsListComponent } from './components/documents-list/documents-list.component';
import { CustomerDataComponent } from './components/customer-data/customer-data.component';
import { OrdersService } from './model/orders.service';
import { QuotesService } from './model/quotes.service';
import { InquiriesService } from './model/inquiries.service';
import { PaymentsService } from './model/payments.service';
import { ComplaintsService } from './model/complaints.service';
import { DeliveryService } from './model/delivery.service';
import { OrderDetailsService } from './model/order-details.service';
import { DocumentDetailsComponent } from './components/document-details/document-details.component';
import { PaymentDetailsService } from './model/payment-details.service';
import { QuoteDetailsService } from './model/quote-details.service';
import { InquiryDetailsService } from './model/inquiry-details.service';
import { ComplaintProductsService } from './model/complaint-products.service';
import { ComplaintFormComponent } from './components/complaint-form/complaint-form.component';
import { ComplaintDetailsService } from './model/complaint-details.service';
import { DeliveryDetailsService } from './model/delivery-details.service';
import { SharedModule } from './shared.module';
import { ConfigService } from './model/config.service';
import { b2b } from '../b2b';
import { PendingService } from './model/pending.service';
import { PromotionDetailsService } from './model/promotion-details.service';



const routes: b2b.RouteWithKey[] = [
    { path: '', redirectTo: 'orders', pathMatch: 'full' },
    { path: 'orders', key: 'orders', component: DocumentsListComponent, resolve: { listContext: OrdersService } },
    { path: 'mydata', key: 'myData', component: CustomerDataComponent },
    { path: 'quotes', key: 'quotes', component: DocumentsListComponent, resolve: { listContext: QuotesService } },
    { path: 'inquiries', key: 'inquiries', component: DocumentsListComponent, resolve: { listContext: InquiriesService } },
    { path: 'payments', key: 'payments', component: DocumentsListComponent, resolve: { listContext: PaymentsService } },
    { path: 'complaints', key: 'complaints', component: DocumentsListComponent, resolve: { listContext: ComplaintsService } },
    { path: 'delivery', key: 'delivery', component: DocumentsListComponent, resolve: { listContext: DeliveryService } },
    { path: 'orders/:id', key: 'orderDetails', component: DocumentDetailsComponent, resolve: { detailsContext: OrderDetailsService } },
    { path: 'payments/:id/:type', key: 'paymentDetails', component: DocumentDetailsComponent, resolve: { detailsContext: PaymentDetailsService } },
    { path: 'quotes/:id', key: 'quoteDetails', component: DocumentDetailsComponent, resolve: { detailsContext: QuoteDetailsService } },
    { path: 'inquiries/:id', key: 'inquiryDetails', component: DocumentDetailsComponent, resolve: { detailsContext: InquiryDetailsService } },
    {
        path: 'complaints', key: 'complaints', children: [
            { path: 'itemscomplaint', key: 'complaintItems', component: DocumentsListComponent, resolve: { listContext: ComplaintProductsService } },
            { path: 'complaintsubmission/:itemsComplaint', key: 'complaintForm', component: ComplaintFormComponent },
            { path: ':id', component: DocumentDetailsComponent, key: 'complaintDetails', resolve: { detailsContext: ComplaintDetailsService } },
        ]
    },
    
    { path: 'delivery/:id', component: DocumentDetailsComponent, key: 'deliveryDetails', resolve: { detailsContext: DeliveryDetailsService } },
    { path: 'employees', component: CustomerDataComponent, key: 'employees' },
    { path: 'pending', key: 'pending', component: DocumentsListComponent, resolve: { listContext: PendingService } },
    // JD
    { path: 'promotions/:id', key: 'promotionDetails', component: DocumentDetailsComponent, resolve: { detailsContext: PromotionDetailsService } },

];


@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        RouterModule.forChild(routes)
        
    ],
    declarations: [
        CustomerDataComponent,
        ComplaintFormComponent,
        DocumentDetailsComponent,
        DocumentsListComponent
    ],
    providers: [
        InquiriesService,
        QuotesService,
        PaymentsService,
        ComplaintsService,
        ComplaintProductsService,
        DeliveryService,
        InquiryDetailsService,
        QuoteDetailsService,
        PaymentDetailsService,
        DeliveryDetailsService,
        ComplaintDetailsService,
        PendingService,
        OrdersService,
        PromotionDetailsService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class CustomerProfileModule {
    constructor(configService: ConfigService) {
        configService.configureRoutePaths(routes, 'profile');
    }
}
