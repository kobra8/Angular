import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { ComplaintFormService } from '../../model/complaint-form.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { ConfigService } from '../../model/config.service';


@Component({
    selector: 'app-complaint-form',
    templateUrl: './complaint-form.component.html',
    styleUrls: ['./complaint-form.component.scss'],
    host: { class: 'app-complaint-form' },
    providers: [ComplaintFormService],
    encapsulation: ViewEncapsulation.None
})
export class ComplaintFormComponent implements OnInit, OnDestroy {

    complaintData: ComplaintFormService;
    activatedRouteSub: Subscription;
    r: ResourcesService;
    private requestsLoaded: boolean;
    noteFormDisplay: boolean;
    backMenuItem: b2b.MenuItem;

    keys: Function;


    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        resourcesService: ResourcesService,
        public configService: ConfigService,
        complaintFormService: ComplaintFormService
    ) {

        this.r = resourcesService;
        this.complaintData = complaintFormService;
    }

    ngOnInit() {
        this.configService.loaderSubj.next(true);
        this.keys = Object.keys;

        this.backMenuItem = {
            resourceKey: 'backToList',
            cssClass: 'back',
            url: '/profile/payments',
            position: 0
        };

        this.activatedRouteSub = this.activatedRoute.params.subscribe(res => {

            this.configService.loaderSubj.next(true);
            this.complaintData.loadProducts(res.itemsComplaint).then(() => {
                this.configService.loaderSubj.next(false);
            });
        });

    }



    loadRequests() {

        if (!this.requestsLoaded) {

            this.complaintData.loadRequests();
            this.requestsLoaded = true;
        }
    }

    changeQuantity(i, quantity) {
        this.complaintData.products[i].value = quantity;
    }

    changeNoteDisplay() {
        this.noteFormDisplay = !this.noteFormDisplay;
    }

    complain(data) {
        //application supports one product per complain, but method is prepared for many products (for the future)

        const req = <b2b.ComplainData>{
            products: []
        };

        for (const prop in data) {

            if (prop.indexOf('product') >= 0) {

                const i = prop.replace('product', '');

                req.products.push({
                    ArticleId: this.complaintData.products[i].itemId,
                    Quantity: this.complaintData.products[i].value || this.complaintData.products[i].quantity,
                    Reason: data[prop].reason,
                    Request: data[prop].request,
                    SourceDocumentId: this.complaintData.products[i].sourceDocumentId,
                    SourceDocumentNo: this.complaintData.products[i].sourceDocumentNo,
                    SourceDocumentTypeId: this.complaintData.products[i].sourceDocumentType,
                });

            } else {
                req[prop] = data[prop];
            }
        }

        this.complaintData.complain(req).then(res => {
            this.router.navigate([this.configService.routePaths.complaints, res.id]);
        });
    }

    ngOnDestroy(): void {

        this.activatedRouteSub.unsubscribe();
    }
}
