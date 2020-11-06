import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { b2b } from '../../../b2b';
import { CustomerService } from '../../model/customer.service';
import { ResourcesService } from '../../model/resources.service';
import { MenuService } from '../../model/menu.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigService } from '../../model/config.service';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-customer-data',
    templateUrl: './customer-data.component.html',
    host: { 'class': 'app-customer-data view-with-sidebar' },
    styleUrls: ['./customer-data.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class CustomerDataComponent implements OnInit, OnDestroy {


    r: any;
    customer: CustomerService;
    menuItems: b2b.MenuItem[];
    path: string;

    private paramsSub: Subscription;

    message: string;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        customerService: CustomerService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        private domSanitizer: DomSanitizer
    ) {
        this.r = resourcesService;
        this.customer = customerService;
    }

    ngOnInit() {

        let dataPromise: Promise<any> = null;

        this.paramsSub = this.activatedRoute.url.subscribe(res => {
            

            this.path = res[0].path;


            this.menuService.loadFullMenuItems().then(() => {

                this.menuItems = [
                    this.menuService.defaultBackItem,
                    this.menuService.fullMenuItems.find(item => item.url.includes(this.path))
                ];

            });

            if (this.path.includes('employees')) {

                if (this.customer.employees === undefined) {

                    this.configService.loaderSubj.next(true);
                    this.message = null;

                    dataPromise = this.customer.loadContacts().then(() => {

                        this.customer.employees.forEach(emp => {
                            emp.skypeUrl = this.domSanitizer.bypassSecurityTrustUrl('skype:' + emp.skype);
                        });
                    });
                }

            } else {

                if (this.customer.details === undefined) {

                    this.configService.loaderSubj.next(true);
                    this.message = null;

                     dataPromise = this.customer.loadCustomerData();
                }
            }

            if (dataPromise !== null) {

                dataPromise.then(() => {
                    this.configService.loaderSubj.next(false);
                }).catch((err: HttpErrorResponse) => {

                    this.configService.loaderSubj.next(false);
                    if (!this.configService.isOnline && (this.customer === undefined || this.customer.employees === undefined || this.customer.details === undefined)) {
                        this.message = this.r.translations.noDataInOfflineMode;
                    }

                });
            }
        });

    }



    ngOnDestroy(): void {
        this.paramsSub.unsubscribe();
    }

}
