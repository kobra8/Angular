import { b2b } from '../../../b2b';
import { HttpClient } from '@angular/common/http';

/**
 * Object for managing warehouses.
 */
export class WarehousesRepo {

    /**
    * Array of warehouses
    */
    warehouses: b2b.Warehouse[];


    constructor(private httpClient: HttpClient) {

    }


    /**
     * Makes request for warehouses
     */
    private requestWarehouses(): Promise<b2b.Option2[]> {

        return this.httpClient.get<b2b.Option2[]>('api/items/warehouses').toPromise();
    }


    /**
     * Loads warehouses, updates model, returns promise with warehouses.
     */
    loadWarehouses(): Promise<b2b.Warehouse[]> {

        if (!this.warehouses) {

            return this.requestWarehouses().then((res: b2b.Option2[]) => {

                this.warehouses = res.map(item => {
                    return { id: item.id.toString(), text: item.name };
                });

                return this.warehouses;
            });
        } else {

            return Promise.resolve(this.warehouses);
        }
    }

}
