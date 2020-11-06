import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, ViewContainerRef, ComponentRef, ComponentFactoryResolver } from '@angular/core';
import { NewsService } from 'src/app/model/news.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigService } from 'src/app/model/config.service';
import { ResourcesService } from 'src/app/model/resources.service';
import { LazyImageComponent } from 'src/app/controls/lazy-image/lazy-image.component';
import { UiUtils } from 'src/app/helpers/ui-utils';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuService } from 'src/app/model/menu.service';
import { b2b } from 'src/b2b';

@Component({
    selector: 'app-news-details',
    templateUrl: './news-details.component.html',
    styleUrls: ['./news-details.component.scss'],
    host: { class: 'app-news-details view-with-sidebar' },
    encapsulation: ViewEncapsulation.None
})
export class NewsDetailsComponent implements OnInit, OnDestroy {
    

    activatedRouteSub: Subscription;
    id: number;
    menuItems: b2b.MenuItem[];

    @ViewChild('contentContainer', { read: ViewContainerRef, static: false })
    container: ViewContainerRef;

    dynamicImages: ComponentRef<LazyImageComponent>[];

    error: string;

    constructor(
        public newsService: NewsService,
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        public r: ResourcesService,
        private componentFactoryResolver: ComponentFactoryResolver,
        public menuService: MenuService
    ) { }

    ngOnInit() {

        this.dynamicImages = [];

        


        this.activatedRouteSub = this.activatedRoute.params.subscribe(params => {
            
            if (this.id !== params.id) {

                this.id = params.id;

                this.configService.loaderSubj.next(true);


                if (this.configService.permissions.hasAccessToNews) {

                    this.menuService.loadFullMenuItems().then(() => {

                        const backItem = this.menuService.convertLabelToBack(
                            this.menuService.fullMenuItems.find(item => item.url === this.menuService.routePaths.news),
                            'back'
                        );

                        const currentItem = Object.assign(
                            {},
                            this.menuService.fullMenuItems.find(item => item.url === this.menuService.routePaths.news)
                        );
                        currentItem.url = `${this.menuService.routePaths.newsDetails}/${this.id}`;

                        this.menuItems = [backItem, currentItem];
                    });
                } else {
                    this.menuItems = [];
                }

                this.newsService.loadDetails(this.id).then(() => {
                    

                    window.setTimeout(() => {

                        const images = this.container.element.nativeElement.querySelectorAll('[applazyimage], [appLazyImage], [app-lazy-image]');

                        if (images.length > 0) {
                            images.forEach(image => {
                                this.dynamicImages.push(UiUtils.createDynamicComponent(image, this.container, LazyImageComponent, this.componentFactoryResolver));
                            });
                        }

                        this.configService.loaderSubj.next(false);

                    }, 0);

                }).catch((err: HttpErrorResponse) => {

                    this.configService.loaderSubj.next(false);

                    if (err.status === 403) {
                        this.error = this.r.translations.forbidden;
                    }

                    if (err.status === 404) {
                        this.error = this.r.translations.noNewsItem;
                    }
                });
            }
        });

    }

    ngOnDestroy(): void {
        this.activatedRouteSub.unsubscribe();

        this.dynamicImages.forEach(image => {
            UiUtils.destroyDynamicComponent(image);
        });
    }

}
