import { Injectable } from '@angular/core';
import { ProductBase } from './shared/products-repo';
import { b2b } from '../../b2b';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { WarehousesService } from './warehouses.service';
import { ProductStatus } from './enums/product-status.enum';
import { ApplicationType } from './enums/application-type.enum';

@Injectable()
export class ProductDetailsService extends ProductBase {

    details: b2b.ProductDetailsInfo;
    config: b2b.ProductConfig;
    attributes: b2b.ProductAttribute[];
    attachments: b2b.Attachement[];
    replacements: b2b.ProductReplacement[];
    sets: any[];
    images: { id: number, default: 0 | 1 }[];


    /**
     * key as warehouseId|unitId
     */
    stockLevels: b2b.Collection<string>;

    changeWarehouseLocal: boolean;

    attributesPromise: Promise<void>;
    replacementsPromises: Promise<void>[];
    replacementsUnitsPromise: Promise<void>;

    allReplacementsCalled: boolean;

    constructor(httpClient: HttpClient, configService: ConfigService, warehousesService: WarehousesService) {
        super(httpClient, warehousesService, configService);

        this.stockLevels = {};
    }

    /**
     * Makes request for loading product.
     */
    private loadProductRequest(id: number, cartId = '1', warehouseId = 0): Promise<b2b.ProductResponseConverted> {

        const productRequestParams: b2b.ProductRequestParams = {
            cartId: cartId,
            warehouseId: warehouseId
        };

        return this.httpClient.get<b2b.ProductResponse>('/api/items/' + id, { params: <any>productRequestParams }).toPromise().then(res => {

            const convertedDetailsPrices = this.convertProductPropertiesDifferences(res.set1[0]);

            const newDetails = Object.assign(res.set1[0], convertedDetailsPrices);

            return <any>Object.assign(res, { set1: [newDetails] });
        });
    }

    /**
     * Makes request for loading product, updates model.
     */
    loadProduct(id: number): Promise<void | number> {

        const warehouseId = this.warehousesService.lastSelectedForProducts.id || this.configService.config.warehouseId;
        return this.loadProductRequest(id, '1', warehouseId)

            .then((res) => {

                const productRes = res;

                this.details = this.calculateValues(<any>productRes.set1[0]);
                this.details.id = id;

                this.config = productRes.set2[0];
                this.config.warehouseId = this.configService.config.warehouseId;
                this.config.warehouseName = this.configService.config.warehouseName + '';

                if (this.config.cartCount !== undefined && !(this.config.cartCount instanceof Array)) {
                    this.config.cartCount = ArrayUtils.toRangeArray<number>(this.config.cartCount, true);
                }

                this.stockLevels[this.config.warehouseId + '|' + this.details.unitId] = this.details.stockLevel;

                this.replacements = productRes.set3;

                this.replacementsPromises = [];


                this.changeWarehouseLocal = productRes.set6[0].changeWarehouseEnabled;


            });

    }

    calculateValues(item: b2b.ProductDetailsInfoResponse & b2b.ProductReplacementResponse): b2b.ProductDetailsInfo & b2b.ProductReplacementFilled {

        const copy: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled = Object.assign({}, <any>item);

        copy.quantity = 1;
        copy.manufacturer = copy.manufacturer ? copy.manufacturer.trim() : '';
        copy.manager = copy.manager ? copy.manager.trim() : '';

        if (copy.volumeSymbolResourceKey) {
            copy.volumeSymbolResourceKey = ConvertingUtils.lowercaseFirstLetter(copy.volumeSymbolResourceKey);
        }

        if (copy.weightSymbolResourceKey) {
            copy.weightSymbolResourceKey = ConvertingUtils.lowercaseFirstLetter(copy.weightSymbolResourceKey);
        }

        copy.max = ConvertingUtils.stringToNum(copy.stockLevel);

        copy.unitId = item.defaultUnitNo || 0;

        this.updateConverter(copy, copy);

        const currentUnitMapEl = this.fillUnitFromProduct(copy.unitId, copy);

        if (this.configService.applicationId === 0) {
            copy.unitLockChange = !!item.unitLockChange;
        } else {
            copy.unitLockChange = item.unitChangeBlocked;
            delete item.unitChangeBlocked;

            //override availability for altum - always available
            copy.status = 1;
        }

        if (copy.unitLockChange) {
            copy.basicUnitNo = copy.defaultUnitNo;
        }

        if (copy.unitsLoaded === undefined) {
            copy.unitsLoaded = !!copy.unitLockChange;
        }

        return copy;
    }


    fillUnitFromProduct(unitId, product: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled): b2b.UnitMapElement {

        if (!product.units) {
            product.units = new Map<number, b2b.UnitMapElement>();
        }

        if (!product.units.has(unitId)) {
            product.units.set(unitId, {
                auxiliaryUnit: product.auxiliaryUnit,
                basicUnit: product.basicUnit
            });
        }

        const unitData: b2b.FilledUnitMapElement = {
            isUnitTotal: product.isUnitTotal,
            auxiliaryUnit: product.auxiliaryUnit,
            type: product.type,
            denominator: product.denominator,
            numerator: product.numerator,
            stockLevel: product.stockLevel,
            max: ConvertingUtils.stringToNum(product.stockLevel),
            netPrice: product.netPrice,
            grossPrice: product.grossPrice,
            volume: product.volume,
            bruttoWeight: product.bruttoWeight,
            volumeSymbolResourceKey: product.volumeSymbolResourceKey,
            weightSymbolResourceKey: product.weightSymbolResourceKey,
            basicUnit: product.basicUnit,
            unitPrecision: product.unitPrecision,
            currency: product.currency,
            converter: ConvertingUtils.unitConverterString(product.denominator, product.auxiliaryUnit, product.numerator, product.basicUnit),
            nettoWeight: product.nettoWeight,
            baseNetPrice: product.baseNetPrice,
            baseGrossPrice: product.baseGrossPrice,
            unitNetPrice: product.unitNetPrice,
            unitGrossPrice: product.unitGrossPrice
        };


        const unit = product.units.get(unitId);

        Object.assign(unit, unitData);

        return Object.assign({}, unitData);

    }

    unitConverterDetails(unitId: number, index = -1, warehouseId = this.config.warehouseId): Promise<number> {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.unitConverterDetailsXl(unitId, index, warehouseId);

            case ApplicationType.ForAltum:
                return this.unitConverterDetailsAltum(unitId, index, warehouseId);

            default:
                const message = 'Not implemented action for application type: ' + this.configService.applicationId;
                console.error('unitConverterDetails(ERROR): ' + message);
                return Promise.reject(message);
        }
    }


    unitConverterDetailsXl(unitId: number, index = -1, warehouseId = this.config.warehouseId): Promise<number> {

        unitId = Number(unitId); //to check where string appears

        let unitElement: b2b.UnitMapElement;
        let requestParams: b2b.UnitConvertRequest;

        if (index > -1) {
            //replacement

            this.replacements[index].unitId = unitId;

            unitElement = this.replacements[index].units.get(unitId);

            //if unit was loaded
            if (unitElement && Number.isInteger(unitElement.type)) {

                this.replacements[index] = Object.assign(this.replacements[index], unitElement);

                this.updateConverter(unitElement, <any>this.replacements[index]);

                return Promise.resolve(index);
            }

        } else {
            //product details

            this.details.unitsLoaded = false;
            this.details.unitId = unitId;


            requestParams = {
                cartId: 0,
                id: this.details.id,
                unitNo: unitId || this.details.unitId || 0,
                features: '',
                warehouseId: warehouseId || this.config.warehouseId || 0
            };

            return this.loadUnit(index, requestParams);
        }

        //if unit wasn't loaded

        if (index !== undefined && index !== null && index > -1) {
            //replacement
            this.replacements[index].unitsLoaded = false;

            requestParams = {
                cartId: 0,
                id: this.replacements[index].id,
                unitNo: unitId || this.replacements[index].unitId || 0,
                features: '',
                warehouseId: 0
            };

        } else {
            //product details
            this.details.unitsLoaded = false;

            requestParams = {
                cartId: 0,
                id: this.details.id,
                unitNo: unitId || this.details.unitId || 0,
                features: '',
                warehouseId: warehouseId || this.config.warehouseId || 0
            };
        }

        return this.loadUnit(index, requestParams);


    }

    unitConverterDetailsAltum(unitId: number, index = -1, warehouseId = this.config.warehouseId): Promise<number> {

        unitId = Number(unitId); //to check where string appears

        let unitElement: b2b.UnitMapElement;

        if (index > -1) {
            //replacement

            this.replacements[index].unitId = unitId;

            unitElement = this.replacements[index].units.get(unitId);

            //if unit was loaded
            if (unitElement && Number.isInteger(unitElement.type)) {

                this.replacements[index] = Object.assign(this.replacements[index], unitElement);

                this.updateConverter(unitElement, <any>this.replacements[index]);

                return Promise.resolve(index);
            }

        } else {
            //product details

            this.details.unitId = unitId;

            unitElement = this.details.units.get(unitId);

            //if unit was loaded
            if (unitElement && Number.isInteger(unitElement.type) && this.stockLevels[warehouseId + '|' + unitId]) {

                this.details = Object.assign(this.details, unitElement, { stockLevel: this.stockLevels[warehouseId + '|' + unitId] });

                this.updateConverter(unitElement, <any>this.details);

                return Promise.resolve(-1);
            }
        }

        //if unit wasn't loaded

        let requestParams: b2b.UnitConvertRequest;

        if (index !== undefined && index !== null && index > -1) {
            //replacement
            this.replacements[index].unitsLoaded = false;

            requestParams = {
                cartId: 0,
                id: this.replacements[index].id,
                unitNo: unitId || this.replacements[index].unitId || 0,
                features: '',
                warehouseId: 0
            };

        } else {
            //product details
            this.details.unitsLoaded = false;

            requestParams = {
                cartId: 0,
                id: this.details.id,
                unitNo: unitId || this.details.unitId || 0,
                features: '',
                warehouseId: warehouseId || this.config.warehouseId || 0
            };
        }

        return this.loadUnit(index, requestParams);


    }


    loadUnit(index: number, requestParams: b2b.UnitConvertRequest): Promise<number> {

        return super.unitConverterRequest(requestParams).then(res => {

            const unitsRes = res.body;

            if (index !== undefined && index !== null && index > -1) {
                //replacement

                this.updateConverter(unitsRes, <any>this.replacements[index]);

                this.fillUnitFromResponse(requestParams.unitNo, unitsRes, <any>this.replacements[index]);

                this.replacements[index].unitsLoaded = true;

                return index;

            } else {
                //product details

                this.updateConverter(unitsRes, <any>this.details);

                this.fillUnitFromResponse(requestParams.unitNo, unitsRes, <any>this.details);

                this.stockLevels[requestParams.warehouseId + '|' + requestParams.unitNo] = unitsRes.stockLevel;

                this.details.unitsLoaded = true;

                return -1;
            }

        });
    }

    updateConverter(unitElement: b2b.UnitMapElement, product: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled) {

        if (product.unitId !== product.basicUnitNo && unitElement.auxiliaryUnit && unitElement.denominator) {
            product.converter = ConvertingUtils.unitConverterString(unitElement.denominator, unitElement.auxiliaryUnit, unitElement.numerator, unitElement.basicUnit);
        } else {
            product.converter = '';
            product.auxiliaryUnit = product.basicUnit;
        }
    }

    fillUnitFromResponse(unitId, unitRes: b2b.UnitData, product: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled) {

        const unitData: b2b.UnitMapElement = Object.assign(unitRes, {
            max: ConvertingUtils.stringToNum(unitRes.stockLevel),
            volumeSymbolResourceKey: unitRes.volumeSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(unitRes.volumeSymbolResourceKey) : null,
            weightSymbolResourceKey: unitRes.weightSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(unitRes.weightSymbolResourceKey) : null
        });

        product.units.set(unitId, unitData);

        product = Object.assign(product, unitData);
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

                if (index === undefined || index === null || index < 0) {

                    this.fillUnitMap(res, <any>this.details);

                    this.details.unitsLoaded = true;

                    return index;

                } else {


                    this.fillUnitMap(res, <any>this.replacements[index]);

                    this.replacements[index].unitsLoaded = true;

                    return index;
                }
            });


        }

        return Promise.resolve(-2);
    }


    fillUnitMap(units: b2b.UnitResponse[], product: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled) {

        if (!product.units) {
            product.units = new Map<number, b2b.UnitMapElement>();
        }

        if (this.configService.applicationId === 0) {
            product.basicUnitNo = 0;
        }

        units.forEach(item => {

            if (this.configService.applicationId === 1 && item.isDefault) {
                product.basicUnitNo = item.no;
            }

            const unitData = product.units.get(item.no);

            product.units.set(item.no,
                Object.assign(
                    unitData || {},
                    { auxiliaryUnit: item.unit }
                )
            );

        });

        product.unitId = product.defaultUnitNo || product.basicUnitNo || 0;

        const basicUnit = product.units.get(product.basicUnitNo);

        //this.fillBasicUnitPrices(product, basicUnit);

    }

    selectWarehouse(warehouseId: number, unitId = this.details.unitId, warehouseName?: string) {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.selectWarehouseXl(warehouseId, unitId, warehouseName);

            case ApplicationType.ForAltum:
                return this.selectWarehouseAltum(warehouseId, unitId, warehouseName);

            default:
                const message = 'Not implemented action for application type: ' + this.configService.applicationId;
                console.error('selectWarehouse(ERROR): ' + message);
                return Promise.reject(message);
        }
    }

    selectWarehouseXl(warehouseId: number, unitId = this.details.unitId, warehouseName?: string) {

        const params: b2b.UnitConvertRequest = {
            id: this.details.id,
            cartId: 0,
            warehouseId: warehouseId,
            unitNo: unitId,
            features: ''
        };

        return this.unitConverterRequest(params).then(res => {

            const unitsRes: b2b.UnitData = res.body;
            this.stockLevels[warehouseId + '|' + unitId] = unitsRes.stockLevel;
            this.updateProductAfterSelectWarehouse(this.details, unitsRes);


            this.config.warehouseId = warehouseId;

            if (warehouseName) {
                this.config.warehouseName = warehouseName;

            } else if (this.warehousesService.warehouses) {

                this.config.warehouseName = this.warehousesService.getWarehouseName(warehouseId);
            }

            return this.details.stockLevel;
        });
    }

    private updateProductAfterSelectWarehouse(product: b2b.ProductDetailsInfo, unitsRes: b2b.UnitData) {

        product.baseGrossPrice = unitsRes.baseGrossPrice;
        product.baseNetPrice = unitsRes.baseNetPrice;
        product.grossPrice = unitsRes.grossPrice;
        product.netPrice = unitsRes.netPrice;
        product.unitGrossPrice = unitsRes.unitGrossPrice;
        product.unitNetPrice = unitsRes.unitNetPrice;

        product.stockLevel = unitsRes.stockLevel;
        product.max = ConvertingUtils.stringToNum(this.details.stockLevel);
    }

    selectWarehouseAltum(warehouseId: number, unitId = this.details.unitId, warehouseName?: string) {

        let levelPromise = null;

        if (this.stockLevels[warehouseId + '|' + unitId] === undefined) {

            const params: b2b.UnitConvertRequest = {
                id: this.details.id,
                cartId: 0,
                warehouseId: warehouseId,
                unitNo: unitId,
                features: ''
            };

            levelPromise = this.unitConverterRequest(params).then(res => {

                const unitsRes = res.body;
                this.stockLevels[warehouseId + '|' + unitId] = unitsRes.stockLevel;
                return unitsRes.stockLevel;
            });

        } else {

            levelPromise = Promise.resolve(this.stockLevels[warehouseId + '|' + unitId]);
        }

        return levelPromise.then(level => {

            this.details.stockLevel = level;
            this.details.max = ConvertingUtils.stringToNum(level);

            this.config.warehouseId = warehouseId;

            if (warehouseName) {
                this.config.warehouseName = warehouseName;

            } else if (this.warehousesService.warehouses) {

                this.config.warehouseName = this.warehousesService.getWarehouseName(warehouseId);
            }
        });


    }


    requestAttributes(id = this.details.id) {

        return this.httpClient.get<b2b.ProductAttributesResponse>('/api/items/attributes/' + id).toPromise();
    }

    loadAttributes(id) {

        if (!this.attributesPromise) {
            this.attributesPromise = this.requestAttributes(id).then(res => {
                this.images = res.set3;
                this.attachments = res.set2;
                this.attributes = res.set1;
            });
        }

        return this.attributesPromise;
    }

    requestReplacement(substituteId, cartId = 1, warehouseId = '0'): Promise<HttpResponse<b2b.ProductReplacementResponse>> {
        const params = {
            cartId: cartId,
            warehouseId: warehouseId
        };
        return this.httpClient.get<b2b.ProductReplacementResponse[]>('/api/items/substitute/' + substituteId, { params: <any>params, observe: 'response' })
            .toPromise()
            .then(res => {

                const convertedReplacementPrices = {
                    netPrice: ConvertingUtils.stringToNum(res.body[0].netPrice),
                    grossPrice: ConvertingUtils.stringToNum(res.body[0].grossPrice),
                    baseNetPrice: ConvertingUtils.stringToNum(res.body[0].baseNetPrice),
                    baseGrossPrice: ConvertingUtils.stringToNum(res.body[0].baseGrossPrice),
                };

                const newBody = Object.assign(res.body[0], convertedReplacementPrices);

                return res.clone({
                    body: newBody
                });

            }).catch(err => {
                return Promise.resolve(err);
            });
    }

    loadReplacement(index) {

        if (index < this.replacements.length && !this.replacementsPromises[index]) {
            this.replacementsPromises[index] = this.requestReplacement(this.replacements[index].substituteId, this.details.cartId, '0').then(res => {

                this.replacements[index] = <any>this.calculateValues(Object.assign({}, this.replacements[index], <any>res.body));

            }).catch(err => {

                if (err.status === 403) {
                    this.replacements[index].availability = ProductStatus.unavaliable;
                    this.replacements[index].unitsLoaded = true;
                    return Promise.reject(err);
                }
            });
        }

        return this.replacementsPromises[index];
    }

    loadUnitsForReplacements(ids: number[]) {

        return this.requestUnitsForManyAndGroupById(ids).then(res => {

            for (const id in res) {

                const replIndex = this.replacements.findIndex(repl => repl.id === Number(id));
                this.fillUnits(replIndex, res[id], this.replacements);
            }
        });
    }


    loadReplacements(): Promise<void[]> {

        if (!this.replacements || this.replacements.length === 0) {
            return Promise.resolve([]);
        }


        const ids = this.replacements.map(repl => repl.id);

        const unitsPromise = this.loadUnitsForReplacements(ids);

        ids.forEach((el, i) => {
            this.replacementsPromises[i] = <any>Promise.all([this.loadReplacement(i), unitsPromise]);

        });

        return Promise.all(this.replacementsPromises);



    }

    loadVisibleReplacementsAndAllUnits(): Promise<void[]> {

        const ids = this.replacements.map(repl => repl.id);

        this.replacementsUnitsPromise = this.loadUnitsForReplacements(ids);

        const promises = [];

        ids.slice(0, 2).forEach((id, i) => {

            if (!this.replacementsPromises[i]) {
                this.replacementsPromises[i] = <any>Promise.all([this.loadReplacement(i), this.replacementsUnitsPromise]);
                promises.push(this.replacementsPromises[i]);
            }
        });

        return promises.length > 0 ? Promise.all(promises) : Promise.resolve([]);
    }

    loadUnvisibleReplacement(index): Promise<void[]> {

        if (!this.replacementsPromises[index]) {
            this.replacementsPromises[index] = <any>Promise.all([this.loadReplacement(index), this.replacementsUnitsPromise]);
        }

        return Promise.all(this.replacementsPromises);
    }
}
