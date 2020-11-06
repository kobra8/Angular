import { Injectable } from '@angular/core';
import { ProductBase } from './shared/products-repo';
import { b2b } from '../../b2b';
import { b2bShared } from 'src/integration/b2b-shared';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ConfigService } from './config.service';
import { WarehousesService } from './warehouses.service';
import { ProductStatus } from './enums/product-status.enum';
import { b2bProductDetails } from 'src/integration/b2b-product-details';
import { ProductDetailsRequestsService } from './product/product-details-requests.service';
import { Subject } from 'rxjs';
import { ApplicationType } from './enums/application-type.enum';

@Injectable()
export class ProductDetailsService extends ProductBase {

    details: b2b.ProductDetailsInfo;
    config: b2bShared.ProductDetailsConfig;
    attributes: b2b.ProductAttribute[];
    attachments: b2b.Attachement[];
    replacements: b2b.ProductReplacement[];
    images: { id: number, default: 0 | 1 }[];

    detailsCache: b2bShared.ProductDetailsCache;

    attributesPromise: Promise<void>;
    replacementsPromises: Promise<void>[];
    replacementsUnitsPromise: Promise<void>;

    lastOrderDetails: b2bProductDetails.LastOrderDetails;
    plannedDeliveries: b2bProductDetails.PlannedDelivery[];

    private thresholdPriceLists: b2bProductDetails.ThresholdPriceLists;
    thresholdPriceListsChanged: Subject<b2bProductDetails.ThresholdPriceLists>;

    constructor(httpClient: HttpClient,
        configService: ConfigService,
        warehousesService: WarehousesService,
        private productDetailsRequestsService: ProductDetailsRequestsService) {
        super(httpClient, warehousesService, configService);

        this.detailsCache = {};
        this.config = <b2bShared.ProductDetailsConfig>{};
        this.thresholdPriceListsChanged = new Subject();
    }

    /**
     * Makes request for loading product.
     */
    private loadProductRequest(id: number, warehouseId = 0, contextGroupId: number = null): Promise<b2b.ProductResponseConverted> {

        const productRequestParams: b2b.ProductRequestParams = {
            warehouseId: warehouseId,
            contextGroupId: contextGroupId
        };

        return this.httpClient.get<b2b.ProductResponse>('/api/items/' + id, { params: <any>productRequestParams }).toPromise().then(res => {

            const convertedDetailsPrices = this.convertProductPropertiesDifferences(res.productDetails);

            const newDetails = Object.assign(res.productDetails, convertedDetailsPrices);

            return <any>Object.assign(res, { productDetails: newDetails });
        });
    }

    /**
     * Makes request for loading product, updates model.
     */
    loadProduct(id: number, groupId: number): Promise<void> {

        const warehouseId = this.warehousesService.lastSelectedForProducts.id || this.configService.config.warehouseId;
        const warehouseName = this.warehousesService.lastSelectedForProducts.text || this.configService.config.warehouseName;

        return this.loadProductRequest(id, warehouseId, groupId).then((res) => {

            this.details = this.calculateProductValues(<any>res.productDetails);
            this.details.id = id;

            if (this.details.showLastOrder) {
                this.setLastOrderDetails(id);
            }

            if (this.details.showPlannedDeliveries) {
                this.setPlannedDeliveries(id);
            }

            this.config.warehouseId = warehouseId;
            this.config.warehouseName = warehouseName;
            this.fillProductDetailsCacheFromProduct(this.config.warehouseId, this.details.unitId, this.details);

            this.replacements = res.substitutes;
            this.replacementsPromises = [];

            if (this.details.unitLockChange) {
                this.details.unitsLength = 1;
                return Promise.resolve();
            }

            if (this.details.showArticleThresholdPrices) {
                this.getThresholdPriceList();
            }

            return this.loadProductUnits();
        });
    }

    private calculateProductValues(product: b2b.ProductDetailsInfoResponse): b2b.ProductDetailsInfo {
        product.manufacturer = product.manufacturer ? product.manufacturer.trim() : '';
        product.manager = product.manager ? product.manager.trim() : '';

        if (product.volumeSymbolResourceKey) {
            product.volumeSymbolResourceKey = ConvertingUtils.lowercaseFirstLetter(product.volumeSymbolResourceKey);
        }

        if (product.weightSymbolResourceKey) {
            product.weightSymbolResourceKey = ConvertingUtils.lowercaseFirstLetter(product.weightSymbolResourceKey);
        }

        return this.calculateCommonValues(product);
    }

    private calculateReplacementValues(replacement: b2b.ProductReplacementResponse): b2b.ProductReplacementFilled {
        const copy = this.calculateCommonValues(replacement);

        this.fillUnitFromReplacement(copy.unitId, copy);
        if (copy.unitsLoaded === undefined) {
            copy.unitsLoaded = !!copy.unitLockChange;
        }

        return copy;
    }

    private calculateCommonValues(item: b2b.ProductDetailsInfoResponse | b2b.ProductReplacementResponse): b2b.ProductDetailsInfo & b2b.ProductReplacementFilled {

        const copy: b2b.ProductDetailsInfo & b2b.ProductReplacementFilled = Object.assign({}, <any>item);

        copy.quantity = 1;
        copy.stockLevelNumber = ConvertingUtils.stringToNum(copy.stockLevel);

        copy.unitId = item.defaultUnitNo;
        copy.converter = this.getConverter(copy, copy);
        copy.auxiliaryUnit = copy.converter ? copy.auxiliaryUnit : copy.basicUnit;

        if (this.configService.applicationId === 0) {
            copy.unitLockChange = !!item.unitLockChange;
            copy.basicUnitNo = 0;
        } else {
            copy.unitLockChange = item.unitChangeBlocked;
            delete item.unitChangeBlocked;

            //override availability for altum - always available
            copy.status = 1;
        }

        return copy;
    }

    private fillUnitFromReplacement(unitId, replacement: b2b.ProductReplacementFilled) {

        if (!replacement.units) {
            replacement.units = new Map<number, b2b.UnitMapElement>();
        }

        const unitData: Partial<b2b.FilledUnitMapElement> = this.prepareCommonDetailsToCache(replacement);
        replacement.units.set(unitId, unitData);
    }

    private fillProductDetailsCacheFromProduct(warehouseId: number, unitId: number, product: b2b.ProductDetailsInfo) {

        const detailsToCache: b2bShared.ProductDetailsCacheElement = Object.assign({
            volume: product.volume,
            bruttoWeight: product.bruttoWeight,
            volumeSymbolResourceKey: product.volumeSymbolResourceKey,
            weightSymbolResourceKey: product.weightSymbolResourceKey,
            nettoWeight: product.nettoWeight,
        }, this.prepareCommonDetailsToCache(product));

        this.fillProductDetailsCache(warehouseId, unitId, detailsToCache);
    }

    private prepareCommonDetailsToCache(item: b2b.ProductDetailsInfo | b2b.ProductReplacementFilled): b2bShared.ProductDetailsCacheBaseElement {

        return {
            isUnitTotal: item.isUnitTotal,
            auxiliaryUnit: item.auxiliaryUnit,
            type: item.type,
            denominator: item.denominator,
            numerator: item.numerator,
            stockLevel: item.stockLevel,
            netPrice: item.netPrice,
            grossPrice: item.grossPrice,
            basicUnit: item.basicUnit,
            unitPrecision: item.unitPrecision,
            currency: item.currency,
            baseNetPrice: item.baseNetPrice,
            baseGrossPrice: item.baseGrossPrice,
            unitNetPrice: item.unitNetPrice,
            unitGrossPrice: item.unitGrossPrice,

            stockLevelNumber: item.stockLevelNumber,
            converter: item.converter
        };
    }

    private fillProductDetailsCache(warehouseId: number, unitId: number, detailsToCache: b2bShared.ProductDetailsCacheElement) {

        if (!this.detailsCache[warehouseId]) {
            this.detailsCache[warehouseId] = {};
        }

        this.detailsCache[warehouseId][unitId] = detailsToCache;
    }

    private haveProductDetailsCacheElement(warehouseId: number, unitId: number) {
        return this.detailsCache[warehouseId] && this.detailsCache[warehouseId][unitId];
    }

    private getProductDetailsCacheElement(warehouseId: number, unitId: number) {
        return this.detailsCache[warehouseId][unitId];
    }

    private loadProductUnits(): Promise<void> {
        return super.requestUnits(this.details.id).then((units: b2b.UnitResponse[]) => {

            this.details.units = {};

            units.forEach(item => {
                this.details.units[item.no] = item.unit;
            });

            this.details.unitId = this.details.defaultUnitNo || this.details.basicUnitNo || 0;
            this.details.unitsLength = Object.keys(this.details.units).length;
        });
    }

    changeProductUnit(unitId: number): Promise<void> {
        this.details.unitId = unitId;
        return this.changeProductDetails(this.config.warehouseId, unitId);
    }

    changeWarehouse(warehouseId: number) {
        return this.changeProductDetails(warehouseId, this.details.unitId).then(() => {
            this.config.warehouseId = warehouseId;
            this.config.warehouseName = this.warehousesService.getWarehouseName(warehouseId);
        });
    }

    private changeProductDetails(warehouseId: number, unitId: number): Promise<void> {

        if (this.haveProductDetailsCacheElement(warehouseId, unitId)) {
            const detailsCacheElement = this.getProductDetailsCacheElement(warehouseId, unitId);
            this.details = Object.assign(this.details, detailsCacheElement);

            return Promise.resolve();
        }

        return this.addProductDetailsToCache(warehouseId, unitId).then(detailsToCache => {
            this.details = Object.assign(this.details, detailsToCache);
        });
    }

    private addProductDetailsToCache(warehouseId: number, unitId: number): Promise<b2bShared.ProductDetailsCacheElement> {
        const requestParams: b2b.UnitConvertRequest = {
            id: this.details.id,
            unitNo: unitId,
            features: '',
            warehouseId: warehouseId
        };

        return super.unitConverterRequest(requestParams).then(res => {

            const unitRes = res.body;

            const detailsToCache: b2bShared.ProductDetailsCacheElement = this.prepareDetailsToCache(unitRes, this.details);
            this.fillProductDetailsCache(warehouseId, unitId, detailsToCache);
            return detailsToCache;
        });
    }

    private prepareDetailsToCache(unitResponse: b2b.UnitData, product: b2b.ProductDetailsInfo): b2bShared.ProductDetailsCacheElement {
        const converter = this.getConverter(unitResponse, product);

        return Object.assign(
            unitResponse,
            {
                stockLevelNumber: ConvertingUtils.stringToNum(unitResponse.stockLevel),
                converter: converter,
                auxiliaryUnit: converter ? unitResponse.auxiliaryUnit : product.basicUnit,
                volumeSymbolResourceKey: unitResponse.volumeSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(unitResponse.volumeSymbolResourceKey) : null,
                weightSymbolResourceKey: unitResponse.weightSymbolResourceKey ? ConvertingUtils.lowercaseFirstLetter(unitResponse.weightSymbolResourceKey) : null,
            });
    }

    private getConverter(unitElement: b2b.UnitMapElement, item: b2b.ProductDetailsInfo | b2b.ProductReplacementFilled) {

        if (item.unitId !== item.basicUnitNo && unitElement.auxiliaryUnit && unitElement.denominator) {
            return ConvertingUtils.unitConverterString(unitElement.denominator, unitElement.auxiliaryUnit, unitElement.numerator, unitElement.basicUnit);
        }
        return '';
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

    loadReplacement(index) {

        if (index < this.replacements.length && !this.replacementsPromises[index]) {
            this.replacementsPromises[index] = this.requestReplacement(this.replacements[index].substituteId).then(res => {

                this.replacements[index] = <any>this.calculateReplacementValues(Object.assign({}, this.replacements[index], <any>res.body));

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

    private requestReplacement(substituteId): Promise<HttpResponse<b2b.ProductReplacementResponse>> {
        const params = {
            warehouseId: this.config.warehouseId
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

    private loadUnitsForReplacements(ids: number[]) {

        return this.requestUnitsForManyAndGroupById(ids).then(res => {

            for (const id in res) {

                const replIndex = this.replacements.findIndex(repl => repl.id === Number(id));
                this.fillUnits(replIndex, res[id], this.replacements);
            }
        });
    }

    loadUnvisibleReplacement(index): Promise<void[]> {

        if (!this.replacementsPromises[index]) {
            this.replacementsPromises[index] = <any>Promise.all([this.loadReplacement(index), this.replacementsUnitsPromise]);
        }

        return Promise.all(this.replacementsPromises);
    }

    changeReplacementUnit(unitId: number, index: number): Promise<void> {

        unitId = Number(unitId);

        this.replacements[index].unitId = unitId;
        const unitElement: b2b.UnitMapElement = this.replacements[index].units.get(unitId);

        if (unitElement && Number.isInteger(unitElement.type)) {

            this.replacements[index] = Object.assign(this.replacements[index], unitElement);
            return Promise.resolve();
        }

        this.replacements[index].unitsLoaded = false;

        const requestParams: b2b.UnitConvertRequest = {
            id: this.replacements[index].id,
            unitNo: unitId || this.replacements[index].unitId || 0,
            features: '',
            warehouseId: 0
        };

        return super.unitConverterRequest(requestParams).then(res => {
            const unitsRes = res.body;

            this.fillReplacementUnitFromResponse(requestParams.unitNo, unitsRes, <any>this.replacements[index]);
            this.replacements[index].unitsLoaded = true;
        });
    }

    private fillReplacementUnitFromResponse(unitId, unitRes: b2b.UnitData, replacement: b2b.ProductReplacementFilled) {
        const converter = this.getConverter(unitRes, replacement);

        const unitData: b2b.UnitMapElement = Object.assign(unitRes, {
            stockLevelNumber: ConvertingUtils.stringToNum(unitRes.stockLevel),
            converter: converter,
            auxiliaryUnit: converter ? unitRes.auxiliaryUnit : replacement.basicUnit,
        });

        replacement.units.set(unitId, unitData);
        replacement = Object.assign(replacement, unitData);
    }

    private setLastOrderDetails(articleId: number) {
        const request = <b2bProductDetails.GetLastOrderRequest>{ articleId: articleId };

        this.productDetailsRequestsService.getLastOrderRequest(request).then((res) => {
            if (!res.isLastOrderPresent) {
                return;
            }
            this.lastOrderDetails = <any>res.lastOrderDetails;
            if (this.lastOrderDetails.isOrderInBasicUnit) {
                this.lastOrderDetails.unit = this.lastOrderDetails.basicUnit;
            } else {
                this.lastOrderDetails.unit = this.lastOrderDetails.auxiliaryUnit;
                this.lastOrderDetails.converter = ConvertingUtils.unitConverterString(this.lastOrderDetails.quantity, this.lastOrderDetails.auxiliaryUnit, this.lastOrderDetails.quantityInBasicUnit, this.lastOrderDetails.basicUnit);
            }
        });
    }

    private setPlannedDeliveries(articleId: number) {
        const request = <b2bProductDetails.GetPlannedDeliveriesRequest>{ articleId: articleId };
        this.productDetailsRequestsService.getPlannedDeliveriesRequest(request).then((res) => {
            if (!res.isPlannedDeliveriesListPresent) {
                return;
            }
            this.plannedDeliveries = res.plannedDeliveries;
        });
    }

    private getThresholdPriceList(): void {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.getThresholdPriceListXl();
                break;

            case ApplicationType.ForAltum:
                this.getThresholdPriceListAltum();
                break;

            default:
                console.error(`getThresholdPriceList(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private getThresholdPriceListXl(): void {
        const request = {
            articleId: this.details.id,
            warehouseId: this.config.warehouseId,
            currency: this.details.currency,
            vatValue: this.details.vatValue
        } as b2bProductDetails.GetThresholdPriceListXlRequest;

        this.productDetailsRequestsService.getThresholdPriceListXlRequest(request).subscribe((res) => {
            this.thresholdPriceLists = res;
            this.thresholdPriceListsChanged.next(this.thresholdPriceLists);
        });
    }

    private getThresholdPriceListAltum(): void {
        const request = {
            articleId: this.details.id,
        } as b2bProductDetails.GetThresholdPriceListAltumRequest;

        this.productDetailsRequestsService.getThresholdPriceListAltumRequest(request).subscribe((res) => {
            this.thresholdPriceLists = res;
            this.thresholdPriceListsChanged.next(this.thresholdPriceLists);
        });
    }
}
