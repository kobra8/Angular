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



    constructor(private http: HttpClient, private configService: ConfigService) {

        this.defaultBackItem = this.convertLabelToBack(<b2b.MenuItem>{ url: '' });
    }


    /**
      * Makes request for menu items
      */
    private requestMenuItems(): Promise<b2b.MenuItem[]> {
        return this.http.get<b2b.MenuItem[]>('api/Common/menuItems').toPromise();
    }

    /**
     * Loads all menu items available for user
     */
    loadFullMenuItems(): Promise<b2b.MenuItem[]> {

        if (!this.fullMenuItemsPromise) {

            this.fullMenuItemsPromise = this.requestMenuItems().then((res: b2b.MenuItem[]) => {

                this.fullMenuItems = res.sort((item1, item2) => item1.position - item2.position).map(item => {

                    const root = item.url.toLowerCase().split('/')[0];

                    switch (root) {
                        case 'items':
                            item.cssClass = 'navBar-items';
                            break;
                        case 'promotions':
                            item.cssClass = 'navBar-promotions';
                            break;
                        case 'quotes':
                            item.cssClass = 'navBar-quotes';
                            break;
                        case 'pending':
                            item.cssClass = 'navBar-pending';
                            break;
                        case 'carts':
                            item.cssClass = 'navBar-carts';
                            break;
                        case 'orders':
                            item.cssClass = 'navBar-orders';
                            break;
                        case 'inquiries':
                            item.cssClass = 'navBar-inquiries';
                            break;
                        case 'payments':
                            item.cssClass = 'navBar-payments';
                            break;
                        case 'delivery':
                            item.cssClass = 'navBar-delivery';
                            break;
                        case 'complaints':
                            item.cssClass = 'navBar-complaints';
                            break;
                        case 'mydata':
                            item.cssClass = 'navBar-mydata';
                            break;
                        default:
                            item.cssClass = 'ti-menu';
                            break;
                    }

                    if (root !== '' && root !== 'items' && root !== 'carts' && root !== 'promotions' && root !== 'pending') {
                        item.url = 'Profile/' + item.url;
                    }
                    
                    return item;
                });

                if (this.fullMenuItems.find(item => item.url.toLowerCase().includes('mydata'))) {

                    this.fullMenuItems = ArrayUtils.insert(this.fullMenuItems, this.fullMenuItems.length - 1, {
                        displayNameResource: 'employees',
                        cssClass: 'employees',
                        url: 'Profile/Employees',
                        position: this.fullMenuItems.length - 1
                    });

                }

                this.defaultMenuItems = this.fullMenuItems.filter(item => (item.url.includes('Quotes') || item.url.includes('Promotions') || item.url.includes('Items')));

                this.profileSidebar = this.fullMenuItems.filter(item => (!item.url.includes('Items') && !item.url.includes('Promotions') && !item.url.includes('Pending')));

                if (this.profileSidebar.length > 0) {

                    this.configService.permissionsPromise.then(() => {
                        this.configService.permissions.showProfile = true;
                    });
                }

                return this.fullMenuItems;

            });

        }

        return this.fullMenuItemsPromise;
    }




    convertLabelToBack(item: b2b.MenuItem, backName = 'backToShopping'): b2b.MenuItem {

        item = Object.assign({}, item); //create new refference

        item.cssClass = 'back';
        item.displayNameResource = backName;
        item.displayName = null;
        return item;
    }


}
