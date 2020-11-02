import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { AccountService } from './account.service';
import { Subscription } from 'rxjs';

/**
 * Object for managing warehouses.
 */
@Injectable({
    providedIn: 'root'
})
export class WarehousesService {

    /**
      * Array of warehouses
      */
    warehouses: b2b.Warehouse[];

    /**
     * Property applies to list and details. Does not apply to the cart.
     */
    lastSelectedForProducts: b2b.Warehouse;

    logOutSub: Subscription;

    constructor(private httpClient: HttpClient, private accountService: AccountService) {
        this.lastSelectedForProducts = <b2b.Warehouse>{};

        this.logOutSub = this.accountService.logOutSubj.subscribe(() => {
            this.warehouses = undefined;
            this.lastSelectedForProducts = <b2b.Warehouse>{};
        });
    }

    /**
     * Makes request for warehouses
     */
    private requestWarehouses(): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>('/api/items/warehouses').toPromise();
    }


    /**
     * Loads warehouses, updates model, returns promise with warehouses.
     */
    loadWarehouses(): Promise<b2b.Warehouse[]> {

        if (!this.warehouses) {

            return this.requestWarehouses().then((res: b2b.Option2[]) => {

                if (res && res.length > 0) {
                    this.warehouses = res.map(item => {
                        return { id: item.id, text: item.name };
                    });
                }

                return this.warehouses;
            });
        }

        return Promise.resolve(this.warehouses);
    }

    getWarehouseName(id: number) {
        const selected = this.warehouses.find(w => w.id === id);
        return selected ? selected.text : '';
    }

}
