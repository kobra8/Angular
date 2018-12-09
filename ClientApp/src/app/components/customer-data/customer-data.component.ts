import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { b2b } from '../../../b2b';
import { CustomerDataService } from '../../model/customer-data.service';
import { ResourcesService } from '../../model/resources.service';
import { MenuService } from '../../model/menu.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { ConfigService } from '../../model/config.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-customer-data',
    templateUrl: './customer-data.component.html',
    host: { 'class': 'app-customer-data' },
    styleUrls: ['./customer-data.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [CustomerDataService]
})
export class CustomerDataComponent implements OnInit, OnDestroy {


    r: any;
    customer: CustomerDataService;
    menuItems: b2b.MenuItem[];
    path: string;

    private paramsSub: Subscription;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        customerDataService: CustomerDataService,
        resourcesService: ResourcesService,
        private menuService: MenuService,
        private domSanitizer: DomSanitizer
    ) {
        this.r = resourcesService;
        this.customer = customerDataService;
    }

    ngOnInit() {

        this.paramsSub = this.activatedRoute.url.subscribe(res => {
            this.path = res[0].path.toLowerCase();


            this.menuService.loadFullMenuItems().then(() => {

                this.menuItems = [
                    this.menuService.defaultBackItem,
                    this.menuService.fullMenuItems.find(item => item.url.toLowerCase().includes(this.path.toLowerCase()))
                ];

            });
        });

        this.customer.loadFullData().then(() => {

            this.customer.employees.forEach(emp => {
                emp.skypeUrl = this.domSanitizer.bypassSecurityTrustUrl('skype:' + emp.skype);
            });
        });

    }



    ngOnDestroy(): void {
        this.paramsSub.unsubscribe();
    }

}
