import { HttpClient, HttpResponse } from '@angular/common/http';
import { b2b } from '../../../b2b';
import { WarehousesService } from '../warehouses.service';
import { ConvertingUtils } from 'src/app/helpers/converting-utils';
import { ArrayUtils } from 'src/app/helpers/array-utils';
import { ConfigService } from '../config.service';

/**
 *  A base product object containing product features that are common to the product details, products list, and cart products
 */
export abstract class ProductBase {


    protected constructor(
        protected httpClient: HttpClient,
        public warehousesService: WarehousesService,
        protected configService: ConfigService
    ) { }


    /**
     * Makes request for unit conversion, returns promise with converted product data
     */
    protected unitConverterRequest(item: b2b.UnitConvertRequest): Promise<HttpResponse<b2b.UnitData>> {

        const params: any = {
            id: item.id,
            unitNo: item.unitNo,
            features: item.features,
            warehouseId: item.warehouseId
        };

        return this.httpClient.get<b2b.UnitDataResponse>('/api/items/unitconverter', { params: params, observe: 'response' }).toPromise().then(res => {

            if (res.body) {
                const convertedData = this.convertProductPropertiesDifferences(res.body[0]);

                const body = Object.assign(res.body[0], convertedData);

                return res.clone({ body: body });
            }

            return res;
        }).catch(err => {
            return Promise.reject(err);
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

    protected requestUnitsForMany(ids: number[]): Promise<b2b.UnitResponse[]> {
        const idsSeparatedString = ids.join('-');
        return this.httpClient.get<b2b.UnitResponse[]>(`/api/items/units?ids=${idsSeparatedString}`).toPromise();
    }


    protected requestUnitsForManyAndGroupById(ids: number[]): Promise<b2b.Collection<b2b.UnitResponse[]>> {
        return this.requestUnitsForMany(ids).then(res => {
            return ArrayUtils.groupBy(res, 'id');
        });
    }


    /**
     * Sets given units in product with given index.
     */
    fillUnits<T>(index: number, units: b2b.UnitResponse[], products: T) {

        if (!products[index].units) {
            products[index].units = new Map<number, b2b.UnitMapElement>();
        }

        units.forEach(item => {

            if (!products[index].units.has(item.no)) {

                products[index].units.set(item.no, {
                    auxiliaryUnit: item.unit
                });
            }

        });

        products[index].unitsLoaded = true;
    }


    /**
     * Fill unit map element with lazy loaded unit data
     */
    fillUnitMapElement<T>(productIndex: number, unitId: number, unitData: b2b.UnitMapElement, products: T): b2b.UnitMapElement {

        if (!products[productIndex].units.has(unitId)) {

            products[productIndex].units.set(unitId, {
                auxiliaryUnit: unitData.auxiliaryUnit || unitData.basicUnit,
            });
        }

        const unitMapElement = products[productIndex].units.get(unitId);

        products[productIndex].units.set(unitId, Object.assign(unitMapElement, unitData));

        if (unitMapElement.stockLevel !== undefined) {
            unitMapElement.max = ConvertingUtils.stringToNum(unitData.stockLevel);
        }

        if (unitMapElement.auxiliaryUnit && unitMapElement.denominator && unitId !== products[productIndex].basicUnitNo) {
            unitMapElement.converter = ConvertingUtils.unitConverterString(unitMapElement.denominator, unitMapElement.auxiliaryUnit, unitMapElement.numerator, unitMapElement.basicUnit);
        } else {
            unitMapElement.converter = null;
        }

        return Object.assign({}, unitMapElement);
    }


    /**
    * Converts units, updates model
    */
    unitConverter<T>(index: number, params: b2b.UnitConvertRequest, products: T): Promise<number> {


        let unitElement = products[index].units.get(params.unitNo);

        //if unit data never loaded
        if (unitElement === undefined || unitElement.stockLevel === undefined) {

            //load unit and change unit data

            products[index].unitsLoaded = false;

            return this.unitConverterRequest(params).then(res => {

                

                const unitsRes = res.body;

                const newUnitData = this.fillUnitMapElement(index, products[index].unitId, unitsRes, products);

                products[index] = Object.assign(products[index], newUnitData);

                products[index].unitsLoaded = true;

                return index;
            }).catch(err => {

                if (err.status === 204) {
                    if (products[index].units) {
                        products[index].units.delete(params.unitNo);
                    }

                    unitElement = products[index].units.get(products[index].defaultUnitNo);

                    products[index].unitId = products[index].defaultUnitNo;

                    products[index] = Object.assign(products[index], unitElement);

                    products[index].unitsLoaded = true;

                    return Promise.resolve(index);
                }

                return Promise.reject(err);
            });

        } else {

            //change unit data 
            products[index].unitId = params.unitNo;

            products[index] = Object.assign(products[index], unitElement);

            return Promise.resolve(index);
        }


    }



    protected convertProductPropertiesDifferences(dataToConvert: b2b.ProductPropertiesDifferencesToConvert): b2b.ProductPropertiesDifferencesConverted {

        const convertedData: b2b.ProductPropertiesDifferencesConverted = {
            baseGrossPrice: ConvertingUtils.stringToNum(dataToConvert.baseGrossPrice),
            baseNetPrice: ConvertingUtils.stringToNum(dataToConvert.baseNetPrice),
            netPrice: ConvertingUtils.stringToNum(dataToConvert.netPrice),
            grossPrice: ConvertingUtils.stringToNum(dataToConvert.grossPrice),
            unitLockChange: this.configService.applicationId ? dataToConvert.unitChangeBlocked : !!dataToConvert.unitLockChange
        };

        if (dataToConvert.unitGrossPrice) {
            convertedData.unitGrossPrice = ConvertingUtils.stringToNum(dataToConvert.unitGrossPrice);
        }

        if (dataToConvert.unitNetPrice) {
            convertedData.unitNetPrice = ConvertingUtils.stringToNum(dataToConvert.unitNetPrice);
        }

        return convertedData;
    }
}
