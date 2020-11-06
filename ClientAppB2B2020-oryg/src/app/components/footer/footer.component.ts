import { Component, OnInit, ViewEncapsulation, OnDestroy, HostBinding } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { ResourcesService } from '../../model/resources.service';
import { filter } from 'rxjs/operators';
import { MenuService } from 'src/app/model/menu.service';
import { ConfigService } from 'src/app/model/config.service';

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
        private menuService: MenuService,
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
        return path === this.menuService.routePaths.home && this.configService.permissions.hasAccessToArticleList
            || path.includes(this.menuService.routePaths.items)
            || path.includes(this.menuService.routePaths.news)
            || path.includes(this.menuService.routePaths.newsDetails)
            || path.includes(this.menuService.routePaths.profile) && path !== this.menuService.routePaths.pending && path !== this.menuService.routePaths.store && !path.match(/[0-9]+/);
    }

    ngOnDestroy(): void {
        this.routerSub.unsubscribe();
    }
}
