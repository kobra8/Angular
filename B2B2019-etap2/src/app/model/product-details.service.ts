import { Injectable } from '@angular/core';
import { ProductBase } from './shared/products-repo';
import { b2b } from '../../b2b';
import { HttpClient } from '@angular/common/http';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { WarehousesService } from './warehouses.service';
import { ToPricePipe } from '../helpers/pipes/to-price.pipe';

@Injectable()
export class ProductDetailsService extends ProductBase {

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

    /**
     * key as warehouseId|unitId
     */
    stockLevels: b2b.Collection<string>;

    changeWarehouseLocal: boolean;

    constructor(httpClient: HttpClient, private configService: ConfigService, warehousesService: WarehousesService) {
        super(httpClient, warehousesService);

        this.stockLevels = {};
    }

    /**
     * Makes request for loading product.
     */
    private loadProductRequest(id: number, cartId = '1', unitNo = '0', warehouseId = '0', features = ''): Promise<b2b.ProductResponse> {

        const productRequestParams: b2b.ProductRequestParams = {
            cartId: cartId,
            unitNo: unitNo,
            warehouseId: warehouseId,
            features: features
        };

        return this.httpClient.get<b2b.ProductResponse>('/api/items/' + id, { params: productRequestParams }).toPromise();
    }

    /**
     * Makes request for loading product, updates model.
     */
    loadProduct(id: number, warehouseId?: string): Promise<void | number> {


        return this.configService.configPromise.then(() => {
            console.log('--------------------------- Request ------------------------------');

            console.log('Warehouse ID argument', warehouseId);
           // console.log('Warehouse ID product service', this.config.warehouseId);

            return this.loadProductRequest(id, '1', '0', warehouseId ? warehouseId : this.configService.config.warehouseId + '');

        }).then((res) => {

            const productRes = res;

            console.log('Product net Price:', productRes.set1[0].netPrice);
            console.log('Product stock level:', productRes.set1[0].stockLevel);
            this.details = this.calculateValues(<any>productRes.set1[0]);
            this.details.id = id;

            this.config = productRes.set2[0];
            this.config.showHowMany = !!productRes.set2[0].applicationId;
            this.config.warehouseId = warehouseId ? warehouseId + '' : productRes.set2[0].warehouseId + '';
            this.config.warehouseName = productRes.set2[0].warehouseName + '';

            if (this.config.cartCount !== undefined && !(this.config.cartCount instanceof Array)) {
                this.config.cartCount = ArrayUtils.toRangeArray<number>(this.config.cartCount, true);
            }

            this.stockLevels[this.config.warehouseId + '|' + this.details.unitId] = this.details.stockLevel;

            this.attributes = productRes.set4;
            this.attachments = productRes.set5;

            this.replacements = productRes.set7.map((item) => this.calculateValues(<any>item));

            this.sets = productRes.set8;
            this.images = productRes.set6;

            if (this.configService.applicationId === 0) {
                this.changeWarehouseLocal = productRes.set12[0].changeWarehouseEnabled;
            } else {
                this.changeWarehouseLocal = productRes.set11[0].changeWarehouseEnabled;
            }

        });



    }

    calculateValues(item: b2b.ProductDetailsInfo & b2b.ProductReplacement, applicationId = this.configService.applicationId): any {

        const copy = Object.assign({}, item);



        const unitId: number = item.unitId || item.defaultUnitNo || 0;

        copy.cartId = 1;
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

        if (copy.unitId === undefined) {

            copy.unitId = unitId;

            if (copy.auxiliaryUnit && copy.denominator) {

                copy.converter = ConvertingUtils.unitConverterString(copy.denominator, copy.auxiliaryUnit, copy.numerator, copy.basicUnit);

                const subPrice = ConvertingUtils.stringToNum(copy.netPrice);
                const totPrice = ConvertingUtils.stringToNum(copy.grossPrice);

                copy.subtotalBasicPrice = ConvertingUtils.calculateBasicPrice(subPrice, copy.denominator, copy.numerator);
                copy.totalBasicPrice = ConvertingUtils.calculateBasicPrice(totPrice, copy.denominator, copy.numerator);
            } else {

                copy.converter = '';
                copy.auxiliaryUnit = copy.basicUnit;

            }

        }

        if (!copy.units) {

            copy.units = new Map<number, b2b.UnitMapElement>();

            copy.units.set(copy.unitId, {
                basicUnit: copy.basicUnit,
            });
        }

        const unitData = copy.units.get(copy.unitId);

        unitData.isUnitTotal = copy.isUnitTotal;
        unitData.auxiliaryUnit = copy.auxiliaryUnit;
        unitData.type = copy.type;
        unitData.denominator = copy.denominator;
        unitData.numerator = copy.numerator;
        unitData.converter = (copy.denominator && copy.auxiliaryUnit) ? ConvertingUtils.unitConverterString(copy.denominator, copy.auxiliaryUnit, copy.numerator, copy.basicUnit) : '';
        unitData.stockLevel = copy.stockLevel;
        unitData.unitPrecision = copy.unitPrecision;
        unitData.currency = copy.currency;
        unitData.max = copy.max;
        unitData.netPrice = copy.netPrice;
        unitData.grossPrice = copy.grossPrice;
        unitData.subtotalBasicPrice = copy.subtotalBasicPrice;
        unitData.totalBasicPrice = copy.totalBasicPrice;
        unitData.volume = copy.volume;
        unitData.bruttoWeight = copy.bruttoWeight;
        unitData.volumeSymbolResourceKey = copy.volumeSymbolResourceKey;
        unitData.weightSymbolResourceKey = copy.weightSymbolResourceKey;


        copy.unitChange = copy.unitLockChange === 1 && !!copy.units;
        copy.unitsLoaded = copy.unitLockChange === 1;


        if (applicationId === 1) {
            //override availability for altum - always available
            copy.status = 1;
        }

        return copy;
    }

    unitConverter(unitId: number, index = -1, warehouseId = this.config.warehouseId): Promise<number> {

        unitId = Number(unitId); //temp and to check where string appears
        let unitElement;

        if (index > -1) {
            //replacement

            this.replacements[index].unitId = unitId;

            unitElement = this.replacements[index].units.get(unitId);

        } else {
            //product details

            this.details.unitId = unitId;

            unitElement = this.details.units.get(unitId);

        }

        if (!unitElement
            || !unitElement.basicUnit
            || (index < 0 && !this.stockLevels[warehouseId + '|' + unitId])) {

            if (index !== undefined && index !== null && index > -1) {
                //replacement
                this.replacements[index].unitsLoaded = false;

            } else {
                //product details
                this.details.unitsLoaded = false;
            }



            let params: b2b.UnitConvertRequest = {
                cartId: 0,
                id: this.details.id,
                unitNo: unitId || this.details.unitId || 0,
                features: '',
                warehouseId: warehouseId || this.config.warehouseId || '0'
            };

            if (index !== undefined && index !== null && index > -1) {

                params = {
                    cartId: 0,
                    id: this.replacements[index].id,
                    unitNo: unitId || this.replacements[index].unitId || 0,
                    features: '',
                    warehouseId: '0'
                };
            }



            return super.unitConverterRequest(params).then((res: b2b.UnitData) => {

                const totalPrice = ConvertingUtils.stringToNum(res.netPrice);
                const subtotalPrice = ConvertingUtils.stringToNum(res.grossPrice);

                const unitData = Object.assign(res, {
                    converter: (res.auxiliaryUnit && res.denominator) ? ConvertingUtils.unitConverterString(res.denominator, res.auxiliaryUnit, res.numerator, res.basicUnit) : null,
                    max: ConvertingUtils.stringToNum(res.stockLevel),
                    volumeSymbolResourceKey: res.volumeSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(res.volumeSymbolResourceKey) : null,
                    weightSymbolResourceKey: res.weightSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(res.weightSymbolResourceKey) : null,
                    subtotalBasicPrice: ConvertingUtils.calculateBasicPrice(totalPrice, res.denominator, res.numerator),
                    totalBasicPrice: ConvertingUtils.calculateBasicPrice(subtotalPrice, res.denominator, res.numerator)
                });

                if (this.configService.applicationId === 1) {
                    const toPricePipe = new ToPricePipe();
                    unitData.grossPrice = toPricePipe.transform(unitData.grossPrice);
                    unitData.netPrice = toPricePipe.transform(unitData.netPrice);
                }

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

                    this.stockLevels[warehouseId + '|' + unitId] = this.details.stockLevel;

                    this.details.unitsLoaded = true;

                    return -1;
                }

            });

        } else {

            if (index > -1) {
                //replacement

                this.replacements[index] = Object.assign(this.replacements[index], unitElement);

                return Promise.resolve(index);

            } else {
                //product details

                this.details = Object.assign(this.details, unitElement, { stockLevel: this.stockLevels[warehouseId + '|' + unitId] });

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

                if (index === undefined || index === null || index < 0) {

                    this.details.unitId = this.details.defaultUnitNo;

                    if (!this.details.units) {
                        this.details.units = new Map<number, b2b.UnitMapElement>();
                    }


                    res.forEach(item => {

                        const unitData = this.details.units.get(item.no);

                        if (unitData) {

                            this.details.units.set(item.no, Object.assign(unitData, {
                                auxiliaryUnit: item.unit
                            }));

                        } else {

                            this.details.units.set(item.no, {
                                auxiliaryUnit: item.unit
                            });
                        }

                    });


                    this.details.unitsLoaded = true;

                    return index;
                } else {

                    if (!this.replacements[index].units) {
                        this.replacements[index].units = new Map<number, b2b.UnitMapElement>();
                    }

                    this.replacements[index].unitId = 0;


                    res.forEach(item => {

                        if (!this.replacements[index].units.has(item.no)) {

                            this.replacements[index].units.set(item.no, {
                                auxiliaryUnit: item.unit
                            });
                        }
                    });

                    this.replacements[index].unitsLoaded = true;

                    return index;
                }
            });

        } else {

            return Promise.resolve(-2);
        }

    }



    selectWarehouse(warehouseId: string, unitId = this.details.unitId, warehouseName?: string) {

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
                this.stockLevels[warehouseId + '|' + unitId] = res.stockLevel;
                return res.stockLevel;
            });

        } else {

            levelPromise = Promise.resolve(this.stockLevels[warehouseId + '|' + unitId]);
        }

        return levelPromise.then(level => {

            this.details.stockLevel = level;
            this.details.max = ConvertingUtils.stringToNum(level);

            console.log('Warehouse chanaged: ', warehouseId);
            this.config.warehouseId = warehouseId;
            this.loadProduct(this.details.id, warehouseId);

            if (warehouseName) {
                this.config.warehouseName = warehouseName;

            } else if (this.warehousesService.warehouses) {

                this.config.warehouseName = this.warehousesService.getWarehouseName(warehouseId);
            }
        });


    }

}
