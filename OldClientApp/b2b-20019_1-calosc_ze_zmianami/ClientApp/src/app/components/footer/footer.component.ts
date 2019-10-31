import { Component, OnInit, ViewEncapsulation, OnDestroy, HostBinding } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigService } from '../../model/config.service';
import { ResourcesService } from '../../model/resources.service';
import { filter } from 'rxjs/operators';

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
        private router: Router,
        private configService: ConfigService,
        resourcesService: ResourcesService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.withSidebar = false;

        
        this.routerSub = this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {

            this.withSidebar = this.configService.permissions && this.isSidebar(this.router.url);

            this.configService.allConfigsPromise.then(() => {
                this.withSidebar = this.isSidebar(this.router.url);
            });
        });

    }

    isSidebar(path) {
        return path === this.configService.routePaths.home && this.configService.permissions.showProducts
            || path.includes(this.configService.routePaths.items)
            || path.includes(this.configService.routePaths.profile) && path !== this.configService.routePaths.pending && !path.match(/[0-9]+/);
    }

    ngOnDestroy(): void {
        this.routerSub.unsubscribe();
    }


}
