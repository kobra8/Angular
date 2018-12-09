import { Injectable } from '@angular/core';
import { ProductsRepo } from './shared/products-repo';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { PermissionHelper } from '../helpers/permission-helper';
import { FormattingUtils } from '../helpers/formatting-utils';
import { ArrayUtils } from '../helpers/array-utils';

@Injectable()
export class ProductDetailsService extends ProductsRepo {

    details: b2b.ProductDetailsInfo;
    config: b2b.ProductConfig;
    attributes: b2b.ProductDetailsAttribute[];
    attachments: b2b.ProductAttachement[];
    replacements: b2b.ProductReplacement[];
    sets: any[];
    images: {

        id: number,
        /**
         * altum only
         * */
        fromBinary?: boolean
    }[];

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    /**
     * Makes request for loading product.
     */
    private loadProductRequest(id: number, params: any): Promise<b2b.ProductResponse> {

        const productRequestParams: b2b.ProductRequestParams = {
            cartId: params.cartId || '1',
            unitNo: params.unitNo || '0',
            warehouseId: params.warehouseId || '0',
            features: params.features || ''
        };

        return this.httpClient.get<b2b.ProductResponse>('api/items/' + id, { params: productRequestParams }).toPromise();
    }

    /**
     * Makes request for loading product, updates model.
     */
    loadProduct(id: number, params: b2b.ProductRequestParams): Promise<void> {

        return this.loadProductRequest(id, params).then<any>((res: b2b.ProductResponse) => {

            this.details = this.calculateValues(res.set1[0], params);
            this.details.id = id;

            this.config = res.set2[0];
            this.config.showHowMany = !!res.set2[0].applicationId;

            if (this.config.cartCount !== undefined && !(this.config.cartCount instanceof Array)) {
                this.config.cartCount = <string[]>ArrayUtils.toRangeArray(this.config.cartCount, true);
            }

            this.attributes = res.set4;
            this.attachments = res.set5;

            this.replacements = res.set7.map((item) => this.calculateValues(item, { cartId: params.cartId }));

            this.sets = res.set8;
            this.images = res.set6;

            if (this.details.units === undefined) {

                return this.unitConverter(Number(params.unitNo), -1);
            }

            return Promise.resolve();

        });

    }

    calculateValues(item, params: b2b.ProductRequestParams): any {

        const copy = Object.assign({}, item);

        let unitId: number = item.unitId || item.defaultUnitNo;

        if (params.unitNo !== undefined) {
            unitId = Number(params.unitNo);
        }


        copy.cartId = (params.cartId !== undefined) ? params.cartId : '1';
        copy.quantity = 1;


        if (copy.unitId === undefined) {

            copy.unitId = unitId;

            if (copy.auxiliaryUnit && copy.denominator) {

                copy.converter = FormattingUtils.unitConverterString(copy.denominator, copy.auxiliaryUnit, copy.numerator, copy.basicUnit);

            } else {

                copy.converter = '';
                copy.auxiliaryUnit = copy.basicUnit;

            }

        }

        if (!copy.units) {

            copy.units = new Map<number, b2b.UnitMapElement>();

            copy.units.set(copy.unitId, {
                basicUnit: copy.basicUnit,
                auxiliaryUnit: copy.auxiliaryUnit,
            });
        }

        if (copy.stockLevel) {
            copy.max = FormattingUtils.stringToNum(copy.stockLevel);
        } else {
            copy.max = -1;
        }

        const unitData = copy.units.get(copy.unitId);

        unitData.isUnitTotal = copy.isUnitTotal;
        unitData.type = copy.type;
        unitData.denominator = copy.denominator;
        unitData.numerator = copy.numerator;
        unitData.converter = (copy.denominator && copy.auxiliaryUnit) ? FormattingUtils.unitConverterString(copy.denominator, copy.auxiliaryUnit, copy.numerator, copy.basicUnit) : '';
        unitData.stockLevel = copy.stockLevel;
        unitData.unitPrecision = copy.unitPrecision;
        unitData.currency = copy.currency;
        unitData.max = copy.max;
        unitData.netPrice = copy.netPrice;
        unitData.grossPrice = copy.grossPrice;


        copy.unitChange = copy.unitLockChange === 1 && !!copy.units;


        copy.unitsLoaded = copy.unitLockChange === 1;

        copy.warehouseId = params.warehouseId || '0';
        copy.featuresParam = params.features || '';

        return copy;
    }

    unitConverter(unitId: number, index?: number): Promise<number> {

        unitId = Number(unitId); //temp and to check where string appears
        let unitElement;

        if (index !== undefined && index !== null && index > -1) {
            //replacement

            this.replacements[index].unitId = unitId;

            unitElement = this.replacements[index].units.get(unitId);

        } else {
            //product details

            this.details.unitId = unitId;

            unitElement = this.details.units.get(unitId);
            
        }

        if (unitElement === undefined || unitElement.basicUnit === undefined) {

            if (index !== undefined && index !== null && index > -1) {
                //replacement
                this.replacements[index].unitsLoaded = false;

            } else {
                //product details
                this.details.unitsLoaded = false;
            }



            let params: b2b.UnitConvertRequest = {
                cartId: this.details.cartId.toString() || '1',
                id: this.details.id.toString(),
                unitNo: unitId.toString() || this.details.unitId.toString() || '0',
                features: '',
                warehouseId: this.details.warehouseId || '0'
            };

            if (index !== undefined && index !== null && index > -1) {

                params = {
                    cartId: this.replacements[index].cartId.toString() || '1',
                    id: this.replacements[index].id.toString(),
                    unitNo: unitId.toString() || this.replacements[index].unitId.toString() || '0',
                    features: '',
                    warehouseId: this.details.warehouseId || '0'
                };
            }



            return super.unitConverterRequest(params).then((res: b2b.UnitConvertResponse) => {

                const unitData = Object.assign(res, {
                    converter: (res.auxiliaryUnit && res.denominator) ? FormattingUtils.unitConverterString(res.denominator, res.auxiliaryUnit, res.numerator, res.basicUnit) : null,
                    max: FormattingUtils.stringToNum(res.stockLevel)
                });

                if (index !== undefined && index !== null && index > -1) {
                    //replacement

                    this.replacements[index].units.set(unitId, unitData);

                    this.replacements[index] = Object.assign(this.replacements[index], unitData);

                    this.replacements[index].unitsLoaded = true;

                    return index;

                } else {
                    //product details

                    this.details.units.set(unitId, unitData);

                    this.details = Object.assign(this.details, unitData);


                    this.details.unitsLoaded = true;

                    return -1;
                }

            });

        } else {

            if (index !== undefined && index !== null && index > -1) {
                //replacement

                this.replacements[index] = Object.assign(this.replacements[index], unitElement);

                return Promise.resolve(index);

            } else {
                //product details

                this.details = Object.assign(this.details, unitElement);

                return Promise.resolve(-1);
            }



        }
    }

    loadUnits(index?: number): Promise<number> {

        let ifLoaded: boolean;
        let id: number;

        if (index === undefined || index === null || index < 0) {
            ifLoaded = this.details.unitsLoaded;
            id = this.details.id;
        } else {
            ifLoaded = this.replacements[index].unitsLoaded;
            id = this.replacements[index].id;
        }

        if (!ifLoaded) {

            return super.requestUnits(id).then((res: b2b.UnitResponse[]) => {

                let converterPromise: Promise<number> = null;

                if (index === undefined || index === null || index < 0) {

                    if (!this.details.units) {
                        this.details.units = new Map<number, b2b.UnitMapElement>();
                    }

                    
                    res.forEach(item => {

                        if (!this.details.units.has(item.no)) {

                            this.details.units.set(item.no, {
                                auxiliaryUnit: item.unit
                            });
                        }
                    });

                    if (this.details.defaultUnitNo !== 0) {
                        this.details.unitId = this.details.defaultUnitNo;
                        converterPromise = this.unitConverter(this.details.unitId, index);
                    } else {
                        converterPromise = Promise.resolve(index);
                    }
                    
                    this.details.unitsLoaded = true;

                    return converterPromise;

                } else {

                    if (!this.replacements[index].units) {
                        this.replacements[index].units = new Map<number, b2b.UnitMapElement>();
                    }

                    res.forEach(item => {

                        if (!this.replacements[index].units.has(item.no)) {

                            this.replacements[index].units.set(item.no, {
                                auxiliaryUnit: item.unit
                            });
                        }
                    });

                    if (this.replacements[index].defaultUnitNo !== 0) {
                        this.replacements[index].unitId = 0;
                        converterPromise = this.unitConverter(index, index);
                    } else {
                        converterPromise = Promise.resolve(index);
                    }

                    this.replacements[index].unitsLoaded = true;

                    return converterPromise;
                }
            });

        } else {

            return Promise.resolve(-2);
        }

    }

}
