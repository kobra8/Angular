import { Component, OnInit, ViewEncapsulation, OnDestroy, HostBinding } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { ConfigService } from '../../model/config.service';
import { ResourcesService } from '../../model/resources.service';


@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    host: { class: 'app-footer' },
    encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit, OnDestroy {

    @HostBinding('class.main-column')
    withSidebar: boolean;

    routerSub: Subscription;
    r: ResourcesService;

    constructor(
        private location: Location,
        private router: Router,
        private configService: ConfigService,
        resourcesService: ResourcesService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.withSidebar = false;

        this.routerSub = this.router.events.filter(event => event instanceof NavigationEnd).subscribe(event => {

            const path = this.location.path().toLowerCase();

            this.configService.permissionsPromise.then(() => {
                this.withSidebar = !!((path === '' && this.configService.permissions && this.configService.permissions.showProducts) || path.match(/items/gi) || location.href.match(/profile\/*[^\/]*$/gi));
            });
        });


    }

    ngOnDestroy(): void {
        this.routerSub.unsubscribe();
    }


}
