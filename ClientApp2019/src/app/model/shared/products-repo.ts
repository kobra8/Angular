import { HttpClient } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { WarehousesService } from '../warehouses.service';

/**
 *  A base product object containing product features that are common to the product details, products list, and cart products
 */
export abstract class ProductBase {


    protected constructor(protected httpClient: HttpClient, public warehousesService: WarehousesService) {}


    /**
     * Makes request for unit conversion, returns promise with converted product data
     */
    protected unitConverterRequest(item: b2b.UnitConvertRequest): Promise<b2b.UnitData> {

        return this.httpClient.get<b2b.UnitData>(`/api/items/unitconverter?cartId=${item.cartId}&id=${item.id}&unitNo=${item.unitNo}&features=${item.features}&warehouseId=${item.warehouseId}`).toPromise().then((res: b2b.UnitData) => {
            return res[0];
        });

    }

    /**
     * Makes request for units list, returns promise with array of units
     */
    protected requestUnits(itemId: number): Promise<b2b.Option[] | b2b.UnitResponse[]> {

        return this.httpClient.get(`/api/items/units/${itemId}`).toPromise().then((res: b2b.Option[] | b2b.UnitResponse[]) => {
            return res;
        });

    }
}
