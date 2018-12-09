import { HttpClient } from '@angular/common/http';
import { b2b } from '../../../b2b';

/**
 *  A base product object containing product features that are common to the product details, products list, and cart products
 */
export abstract class ProductsRepo {

    protected httpClient: HttpClient;


    protected constructor(httpClient: HttpClient) {

        this.httpClient = httpClient;

    }



    /**
     * Makes request for unit conversion, returns promise with converted product data
     */
    protected unitConverterRequest(item: b2b.UnitConvertRequest): Promise<b2b.UnitConvertResponse> {

        return this.httpClient.get<b2b.UnitConvertResponse>(`api/items/unitconverter?cartId=${item.cartId}&id=${item.id}&unitNo=${item.unitNo}&features=${item.features}&warehouseId=${item.warehouseId}`).toPromise().then((res: b2b.UnitConvertResponse) => {
            return res[0];
        });

    }

    /**
     * Makes request for units list, returns promise with array of units
     */
    protected requestUnits(itemId: number): Promise<b2b.Option[] | b2b.UnitResponse[]> {

        return this.httpClient.get(`api/items/units/${itemId}`).toPromise().then((res: b2b.Option[] | b2b.UnitResponse[]) => {
            return res;
        });

    }
}
