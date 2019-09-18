import { Injectable } from '@angular/core';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';

/**
 * Building menu
 */
@Injectable()
export class MenuService {


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

    constructor(private http: HttpClient, private configService: ConfigService) {

        this.defaultBackItem = this.convertLabelToBack(<b2b.MenuItem>{ url: '' });
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

            this.fullMenuItemsPromise = this.requestMenuItems().then((res: b2b.MenuItem[]) => {

                res.push({url: '/businessterms', position: 2, resourceKey: 'warunki_handlowe', cssClass: 'navBar-businessterms', key: 'businessterms'});
                this.fullMenuItems = res.sort((item1, item2) => item1.position - item2.position).map(item => {

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
                            item.key = 'carts';
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
                        default:
                            item.cssClass = 'ti-menu';
                            break;
                    }
                    // JD
                    if (root !== '' && root !== 'items' && root !== 'carts' && root !== 'promotions' && root !== 'businessterms'/* && root !== 'pending'*/) {
                        item.url = this.configService.routePaths.profile + '/' + item.url;
                    }


                    if (item.url[0] !== '/') {
                        //unify paths
                        item.url = '/' + item.url;
                    }

                    return item;
                });

                if (this.fullMenuItems.find(item => item.key === 'myData')) {


                    this.fullMenuItems = ArrayUtils.insert(this.fullMenuItems, this.fullMenuItems.length - 1, {
                        resourceKey: 'employees',
                        cssClass: 'employees',
                        url: '/profile/employees',
                        key: 'employees',
                        position: this.fullMenuItems.length - 1
                    });

                }
                // JD
                this.defaultMenuItems = this.fullMenuItems.filter(
                    item => item.key === 'quotes'
                            || item.key === 'businessterms'
                            || item.key === 'promotions'
                            || item.key === 'items'
                );
                // JD
                this.profileSidebar = this.fullMenuItems.filter(
                    item => item.key !== 'items'
                            && item.key !== 'businessterms'
                            && item.key !== 'promotions'
                            && item.key !== 'pending'
                );

                return this.fullMenuItems;

            });

        }

        return this.fullMenuItemsPromise;
    }




    convertLabelToBack(item: b2b.MenuItem, backName = 'backToShopping'): b2b.MenuItem {

        item = Object.assign({}, item);

        item.cssClass = 'back';
        item.resourceKey = backName;
        return item;
    }


    clearMenu() {
        this.defaultMenuItems = undefined;
        this.profileSidebar = undefined;
        this.fullMenuItems = undefined;
        this.fullMenuItemsPromise = undefined;
    }

}
