import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router, RoutesRecognized } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, pairwise } from 'rxjs/operators';

/**
 * Building menu
 */
@Injectable()
export class MenuService {

    private routerSub: Subscription;
    lastTwoRoutes: RoutesRecognized[];

    routePaths: { [route in b2b.RouteKey]: string; };

    /**
    * Main menu
    */
    defaultMenuItems: b2b.MenuItem[];

    /**
    * Sidebar menu in profile
    */
    profileSidebar: b2b.MenuItem[];

    defaultBackItem: b2b.MenuItem;


    /**
    * Full menu received from server
    */
    fullMenuItems: b2b.MenuItem[];
    private fullMenuItemsPromise: Promise<b2b.MenuItem[]>;

    cartImportedResponse: b2b.ImportFromCsvResponse;
    cartIdFormImported: number;

    refreshMenuItemsRequired: boolean;

    constructor(private http: HttpClient, private configService: ConfigService, private router: Router) {

        this.routePaths = <any>{};

        this.routerSub = this.router.events
            .pipe(filter(e => e instanceof RoutesRecognized), pairwise<RoutesRecognized>())
            .subscribe(e => {
                this.lastTwoRoutes = e;
            });

        this.defaultBackItem = this.convertLabelToBack(<b2b.MenuItem>{ url: '' });
        this.refreshMenuItemsRequired = true;
    }


    /**
      * Makes request for menu items
      */
    private requestMenuItems(): Promise<b2b.MenuItem[]> {
        return this.http.get<b2b.MenuItem[]>('/api/common/menuitems').toPromise();
    }

    /**
     * Loads all menu items available for user
     */
    loadFullMenuItems(): Promise<b2b.MenuItem[]> {


        if (!this.fullMenuItemsPromise) {

            this.fullMenuItemsPromise = Promise.all([this.requestMenuItems(), this.configService.permissionsPromise]).then((res) => {

                const menuRes: b2b.MenuItem[] = res[0];
                // JD
                menuRes.push({url: 'Businessterms', position: 2, resourceKey: 'warunki_handlowe', cssClass: 'navBar-businessterms', key: 'businessterms'});


                this.fullMenuItems = menuRes.map((item, i, arr) => {

                    item.url = item.url.toLowerCase();

                    const root = item.url.split('/')[0];

                    switch (root) {
                        case 'items':
                            item.cssClass = 'navBar-items';
                            item.key = 'items';
                            break;
                        case 'promotions':
                            item.cssClass = 'navBar-promotions';
                            item.key = 'promotions';
                            item.position = 5;
                            break;
                        case 'businessterms': // JD
                            item.cssClass = 'navBar-businessterms';
                            item.key = 'businessterms';
                            break;
                        case 'quotes':
                            item.cssClass = 'navBar-quotes';
                            item.key = 'quotes';
                            break;
                        case 'pending':
                            item.cssClass = 'navBar-pending';
                            item.key = 'pending';
                            break;
                        case 'carts':
                            item.cssClass = 'navBar-carts';
                            item.key = 'cart';
                            break;
                        case 'orders':
                            item.cssClass = 'navBar-orders';
                            item.key = 'orders';
                            break;
                        case 'inquiries':
                            item.cssClass = 'navBar-inquiries';
                            item.key = 'inquiries';
                            break;
                        case 'payments':
                            item.cssClass = 'navBar-payments';
                            item.key = 'payments';
                            break;
                        case 'delivery':
                            item.cssClass = 'navBar-delivery';
                            item.key = 'delivery';
                            break;
                        case 'complaints':
                            item.cssClass = 'navBar-complaints';
                            break;
                        case 'mydata':
                            item.cssClass = 'navBar-mydata';
                            item.key = 'myData';
                            break;
                        case 'files':
                            item.cssClass = 'files';
                            item.key = 'files';
                            break;
                        case 'news':
                            item.cssClass = 'news';
                            item.key = 'news';
                            item.position = arr.length + 4;
                            break;
                        default:
                            item.cssClass = 'ti-menu';
                            break;
                    }

                    if (root !== '' && root !== 'items' && root !== 'carts' && root !== 'businessterms') { // JD
                        item.url = this.routePaths.profile + '/' + item.url;
                    }


                    if (item.url[0] !== '/') {
                        //unify paths
                        item.url = '/' + item.url;
                    }

                    return item;

                });

                return this.refreshMenuItems();
            });
        }

        if (this.fullMenuItems && this.refreshMenuItemsRequired) {
            this.refreshMenuItems();
        }
        return this.fullMenuItemsPromise;
    }

    private refreshMenuItems() {
        if (this.configService.permissions.hasAccessToServiceJobs) {
            this.updateMenuItem('serviceJobs', 'service-jobs', this.routePaths.serviceJobs, 'serviceJobs', this.fullMenuItems.length - 2);
        }

        if (this.configService.permissions.hasAccessToEmployeesList) {
            this.updateMenuItem('employees', 'employees', this.routePaths.employees, 'employees', this.fullMenuItems.length);
        }

        if (this.configService.permissions.hasAccessToAttachmentsList) {
            this.updateMenuItem('filesToDownload', 'files', this.routePaths.files, 'files', this.fullMenuItems.length + 1);
        }

        this.fullMenuItems = this.fullMenuItems.sort((item1, item2) => item1.position - item2.position);

        this.defaultMenuItems = this.fullMenuItems.filter(
            item => item.key === 'quotes'
                || item.key === 'businessterms' // JD
                || item.key === 'promotions'
                || item.key === 'items'
        );

        this.profileSidebar = this.fullMenuItems.filter(
            item => item.key !== 'items'
                && item.key !== 'businessterms' // JD
                && item.key !== 'pending'
        );

        this.refreshMenuItemsRequired = false;
        return this.fullMenuItems;
    }

    private updateMenuItem(resourceKey: string, cssClass: string, url: string, key: b2b.RouteKey, position: number) {
        const newMenuItem = { resourceKey, cssClass, url, key, position } as b2b.MenuItem;

        const index = this.fullMenuItems.findIndex(item => item.key === key);
        if (index >= 0) {
            this.fullMenuItems[index] = newMenuItem;
        } else {
            this.fullMenuItems.push(newMenuItem);
        }
    }

    convertLabelToBack(item: b2b.MenuItem, backName = 'backToShopping'): b2b.MenuItem {

        item = Object.assign({}, item);

        item.cssClass = 'back';
        item.resourceKey = backName;
        return item;
    }

    configureRoutePaths(routes: b2b.RouteWithKey[], moduleParentPathKey?: string) {
        this.routePaths = Object.assign(this.routePaths, this.flattenRoutes(routes, moduleParentPathKey));
        this.refreshMenuItemsRequired = true;
    }

    flattenRoutes(routes: b2b.RouteWithKey[], moduleParentPathKey?: string, pathRoot?) {

        let routesArray = {};

        routes.forEach((route) => {
            if (!route.key) {
                return;
            }

            if (route.key && route.redirectTo) {
                routesArray[route.key] = '/' + route.redirectTo;
                return;
            }

            let currentRoutePath = route.path || route.redirectTo || '';

            if (route.path.includes('/')) {
                currentRoutePath = route.path.split('/')[0];
            }

            if (currentRoutePath.includes(':')) {
                return;
            }

            if (moduleParentPathKey) {
                currentRoutePath = `${moduleParentPathKey}/${currentRoutePath}`;
            }

            routesArray[route.key] = `${pathRoot ? '/' + pathRoot : ''}/${currentRoutePath}`;

            if (!route.children) {
                return;
            }

            const subroutesArray = this.flattenRoutes(<b2b.RouteWithKey[]>route.children, null, `${pathRoot ? pathRoot + '/' : ''}${currentRoutePath}`);
            routesArray = Object.assign(routesArray, subroutesArray);
        });


        return routesArray;
    }

    clearMenu() {
        this.defaultMenuItems = undefined;
        this.profileSidebar = undefined;
        this.fullMenuItems = undefined;
        this.fullMenuItemsPromise = undefined;
    }

}
