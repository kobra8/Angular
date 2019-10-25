import { Injectable } from '@angular/core';
import { ProductBase } from './shared/products-repo';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { DisplayType } from './enums/display-type.enum';
import { PaginationRepo } from './shared/pagination-repo';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { PriceMode } from './enums/price-mode.enum';
import { WarehousesService } from './warehouses.service';
import { ProductStatus } from './enums/product-status.enum';
import { AccountService } from './account.service';
import { Subscription } from 'rxjs';
import { ToPricePipe } from '../helpers/pipes/to-price.pipe';

/**
 * Service for product's list
 */
@Injectable()
export class ProductsService extends ProductBase {


    groupId: number;

    config: b2b.ItemsDisplayConfig;

    filters: {
        default: b2b.CurrentFilter,

        config: b2b.FiltersConfig;

        /**
        * current filter options
        */
        currentFilter?: b2b.CurrentFilter,

        /**
        * filter profiles (saved filters)
        */
        filterProfiles?: b2b.FilterProfile[],

        /**
        * product's attributes
        */
        features?: Map<number, b2b.FilterParameter>
    };

    products: b2b.ProductListElement[];


    /**
    * Object for managing pagination
    */
    paginationRepo: PaginationRepo;

    cartNumbers: number[];

    unitsLoaded: boolean;

    logInSub: Subscription;
    logOutSub: Subscription;

    canChangeWarehouseLocal: boolean;

    constructor(httpClient: HttpClient, private configService: ConfigService, warehousesService: WarehousesService, private accountService: AccountService) {
        super(httpClient, warehousesService);

        this.paginationRepo = new PaginationRepo();

        this.config = {
            displayType: Number(localStorage.getItem('displayType')) || DisplayType.quickShopping
        };

        this.logInSub = this.accountService.logInSubj.subscribe(() => {

            this.configService.configPromise.then(() => {

                this.filters = {
                    default: {
                        filter: '',
                        filterId: 0,
                        profileName: '',
                        onlyAvailable: false,
                        isGlobalFilter: false,
                        inGroup: false,
                        warehouse: {
                            id: this.configService.config.warehouseId + '',
                            text: this.configService.config.warehouseName
                        },
                        parameters: new Map<string, b2b.FilterParameter>(),
                        features: new Map<string, b2b.FilterParameter>(),
                        articlesGroups: null
                    },
                    config: {
                        filterByWarehouse: true,
                    },
                };

                this.filters.currentFilter = this.getClearingFiltersObject();

            });
        });


        this.logOutSub = this.accountService.logOutSubj.subscribe(() => {
            this.products = undefined;
            if (this.filters) {
                this.filters.features = undefined;
                this.filters.filterProfiles = undefined;
            }

            this.groupId = undefined;
        });


    }

    /**
       * Default filters object. Used for init or clearing filters.
       */
    getClearingFiltersObject(): b2b.CurrentFilter {

        return Object.assign( //clearing all refferences
            {},
            this.filters.default,
            { parameters: new Map(this.filters.default.parameters) },
            { features: new Map(this.filters.default.features) },
            { warehouse: Object.assign({}, this.filters.default.warehouse) }
        );
    }


    /**
     * Setter for current filter params.
     * Merging given object with current filtering options.
     * Doesn't remove parameters missed in given object.
     */
    setCurrentFilter(filter: b2b.CurrentFilter): b2b.CurrentFilter {

        if (filter.features) {
            this.filters.currentFilter.features.forEach(el => {
                this.updateParameterValue(el.id, el.valueId, false, filter.filterId);
            });
        }

        this.filters.currentFilter = Object.assign(this.filters.currentFilter, filter);

        if (filter.articlesGroups !== undefined && filter.articlesGroups !== null) {
            this.filters.currentFilter.articlesGroups = filter.articlesGroups;
        }

        if (filter.features) {
            filter.features.forEach(el => {

                this.updateParameterValue(el.id, el.valueId, true, filter.filterId || 0, el.value);
            });
        }

        if (filter.warehouse) {
            this.warehousesService.lastSelectedForProducts = filter.warehouse;
        }

        return this.filters.currentFilter;

    }

    /**
     * Conversion of filter profile object from response structure to request structure
     * Filter profile's structure in response is different from request structure. Parametr names also differ.
     */
    convertFilterStructure(filterRes: b2b.FilterResponse): b2b.CurrentFilter {

        const filter: b2b.CurrentFilter = {};

        filter.filterId = filterRes.filterId;
        filter.profileName = filterRes.filter.filterName;
        filter.onlyAvailable = filterRes.filter.onlyAvailable;
        filter.isGlobalFilter = filterRes.filter.isGlobalFilter;
        filter.inGroup = filterRes.filter.inGroup;
        filter.articlesGroups = filterRes.filter.articlesGroups;

        if (filterRes.filter.warehouse === null || filterRes.filter.warehouse === undefined) {
            filter.warehouse = this.filters.currentFilter.warehouse;
        } else {
            filter.warehouse = { id: filterRes.filter.warehouse.id + '', text: filterRes.filter.warehouse.text || '' };

            if (filter.warehouse.text === '' && filter.warehouse.id !== '0' && this.warehousesService.warehouses.length > 1) {
                filter.warehouse.text = this.warehousesService.warehouses.find(item => item.id + '' === filter.warehouse.id).text;
            }

        }


        const parameters = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(0, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : new Map();
        const features = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(1, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : new Map();

        filter.parameters = parameters;
        filter.features = features;

        return filter;
    }

    getPaginationParams(): b2b.PaginationConfig {
        return this.paginationRepo.pagination;
    }


    private requestDefaultFilter(): Promise<b2b.FilterResponse> {

        return this.httpClient.get<b2b.FilterResponse>('/api/items/filters/default').toPromise();

    }

    /**
     * Gets default filter from server (or returns current filter if no filter is received)
     */
    getDefalutFilter(): Promise<b2b.CurrentFilter> {

        return this.requestDefaultFilter().then(res => {

            if (!res) {
                return this.filters.currentFilter;
            }

            const filter: b2b.CurrentFilter = this.convertFilterStructure(res);

            this.setCurrentFilter(filter);

            return this.filters.currentFilter;

        });

    }

    /**
    * Request for filter profiles
    */

    private requestFilterProfiles(): Promise<b2b.FilterProfile[]> {

        return this.httpClient.get<b2b.FilterProfile[]>('/api/items/filters').toPromise();

    }

    /**
     * Setter for filter profiles.
     */
    setFilterProfiles(filters: b2b.FilterProfile[]) {

        this.filters.filterProfiles = filters;
    }

    /**
     * Loads all filter profiles.
     * Updates model and returns filter profiles.
     */
    loadFilters(): Promise<b2b.FilterProfile[]> {

        if (this.filters.filterProfiles) {
            return Promise.resolve(this.filters.filterProfiles);
        }

        return this.requestFilterProfiles().then(res => {

            this.setFilterProfiles(res);

            return this.filters.filterProfiles;
        });

    }

    /**
     * Makes request for save filter. Returns promise with id of saved filter.
     */
    private requestAddFilterProfile(filterProfile?: b2b.CurrentFilter): Promise<number> {

        if (filterProfile === undefined) {
            filterProfile = this.filters.currentFilter;
        }

        return this.httpClient.post<number>('/api/items/filters', filterProfile).toPromise();

    }

    /**
     * Convert filtering option's values structure to request stucture
     */
    convertParametersToSave(type?: number, parameters?: Map<string, b2b.FilterParameter>): b2b.FilterParameterRequest[] {

        const converted: b2b.FilterParameterRequest[] = [];

        if (parameters === undefined || parameters === null) {
            parameters = this.getParameters(type);
        }

        parameters.forEach(el => {

            const convertedElIndex = converted.findIndex(item => Number(item.classItem.id) === el.id);

            if (convertedElIndex !== -1) {

                converted[convertedElIndex].items.push({ id: el.valueId + '', text: el.value + '', value: el.value });

            } else {

                const classItem = { id: el.id + '', type: el.type + '', text: el.name };
                const items: any = [{ id: el.valueId + '', text: el.value + '', value: el.value }];
                converted.push({ classItem: classItem, items: items });
            }

        });

        return converted;
    }

    /**
     * Simplify filtering options values received from server to UI friendly structure, unified with filtering options request stucture.
     */
    convertParametersToClientStructure(type?: number, parameters?: b2b.FilterParameterRequest[]): Map<string, b2b.FilterParameter> {

        if (parameters === undefined || parameters === null) {
            return this.getParameters(type);
        }

        const converted = new Map<string, b2b.FilterParameter>();

        parameters.forEach(parameter => {

            if (parameter.classItem.type === undefined || parameter.classItem.type === null || Number(parameter.classItem.type) === type) {

                parameter.items.forEach(item => {

                    converted.set(`${parameter.classItem.id}:${item.id}`, {
                        id: Number(parameter.classItem.id),
                        name: parameter.classItem.text,
                        type: Number(parameter.classItem.type),
                        value: item.value,
                        valueId: Number(item.id)
                    });
                });

            }
        });



        return converted;
    }

    /**
     * Saves filter. Returns promise with new filters list.
     */
    addFilterProfile(filterProfile?: b2b.CurrentFilter): Promise<b2b.FilterProfile[]> {

        if (this.filters.currentFilter.profileName === undefined || this.filters.currentFilter.profileName === '') {
            return Promise.resolve(this.filters.filterProfiles);
        }

        const filterToRequest: any = filterProfile || Object.assign({}, this.filters.currentFilter);


        const features: b2b.FilterParameterRequest[] = (this.filters.currentFilter.features !== null || this.filters.currentFilter.features.size) > 0 ? this.convertParametersToSave(1) : null;
        const parameters: b2b.FilterParameterRequest[] = (this.filters.currentFilter.parameters !== null || this.filters.currentFilter.parameters.size > 0) ? this.convertParametersToSave(0) : null;

        //switched for request (i don't know why)
        filterToRequest.features = parameters;
        filterToRequest.parameters = features;


        return this.requestAddFilterProfile(filterToRequest).then(res => {

            if (res !== 0) {
                this.filters.filterProfiles.unshift({ id: res, name: filterToRequest.profileName, isGlobal: filterToRequest.isGlobalFilter });
                this.filters.currentFilter.filterId = res;
            }

            return this.filters.filterProfiles;
        });



    }

    private requestSelectFilterProfile(id: number): Promise<b2b.FilterResponse> {

        return this.httpClient.get<b2b.FilterResponse>(`/api/items/filters/${id}/${0}`).toPromise();

    }

    /**
     * Gets all settings of given filter.
     * Returns promise with current filter object.
     */
    selectFilterProfile(id: number): Promise<b2b.CurrentFilter> {

        if (id === this.filters.currentFilter.filterId) {
            return Promise.resolve(this.filters.currentFilter);
        }

        return this.requestSelectFilterProfile(id).then(res => {

            this.filters.config.isGlobalDefaultFilter = null; // why reset here?

            const filter: b2b.CurrentFilter = this.convertFilterStructure(res);

            this.setCurrentFilter(filter);


            if (filter.articlesGroups !== undefined && filter.articlesGroups !== null) {

                if (filter.articlesGroups.length > 0 && filter.articlesGroups[0].id === 0) {
                    this.filters.currentFilter.articlesGroups = filter.articlesGroups;
                } else {
                    this.filters.currentFilter.articlesGroups.splice(0, 1).concat(filter.articlesGroups);
                }
            }

            return this.filters.currentFilter;
        });



    }


    private requestLoadGlobalFilter(id: number): Promise<b2b.FilterResponse> {

        return this.httpClient.get<b2b.FilterResponse>(`/api/items/filters/${id}/${1}`).toPromise();

    }

    loadGlobalFilter(id: number): Promise<b2b.CurrentFilter> {

        return this.requestLoadGlobalFilter(id).then(res => {

            this.filters.config.isGlobalDefaultFilter = true;

            const filter = this.convertFilterStructure(res);

            this.setCurrentFilter(filter);
            this.filters.currentFilter.isGlobalFilter = false;

            return this.filters.currentFilter;
        });

    }

    /**
     * Makes request for remove saved filter. Returns promise with boolean.
     */
    private requestRemoveFilterProfile(id: number): Promise<boolean> {

        return this.httpClient.delete<boolean>('/api/items/filters/remove/' + id).toPromise();

    }

    /**
     * Removes given filter from saved filters.
     * Returns promise with new list.
     */
    removeFilterProfile(id: number): Promise<b2b.FilterProfile[]> {

        return this.requestRemoveFilterProfile(id).then(res => {
            if (res) {

                for (const i in this.filters.filterProfiles) {

                    if (id === this.filters.filterProfiles[i].id) {
                        this.filters.filterProfiles.splice(Number(i), 1);
                        break;
                    }
                }
            }

            return this.filters.filterProfiles;
        });



    }


    /**
     * Gets parameters by type or filters given parameters by type
     */
    getParameters(type?: number, parameters?: Map<string, b2b.FilterParameter>): Map<string, b2b.FilterParameter> {

        let newParams: Map<string, b2b.FilterParameter>;

        if (parameters === undefined || parameters === null) {

            if (type === 1) {
                newParams = this.filters.currentFilter.features;
            } else if (type === 0) {
                newParams = this.filters.currentFilter.parameters;
            } else {

                if (this.filters.currentFilter.parameters.size === 0) {

                    newParams = this.filters.currentFilter.features;

                } else {

                    newParams = new Map(this.filters.currentFilter.features); //new reference

                    this.filters.currentFilter.parameters.forEach((el, i) => {
                        newParams.set(i, el);
                    });
                }

            }

        } else {

            if (type === 0 || type === 1) {

                newParams = new Map(parameters); //new reference

                newParams.forEach((el, i, map) => {
                    if (el.type !== type) {
                        map.delete(i);
                    }
                });

            }

        }

        return newParams;
    }

    /**
     * Convert model parameters (or given parameters) to string format required by requests.
     */
    parametersToString(type?: number, parameters?: Map<string, b2b.FilterParameter>): string {


        if (parameters === undefined || parameters === null) {

            parameters = this.getParameters(type, parameters);
        }

        let str = '';

        parameters.forEach(el => {
            str += `${el.id}:${el.value};`;
        });


        return str.slice(0, -1);
    }

    /**
     * Prepares request for all porducts from given page.
     * If no page is given, prepares first page.
     * Returns promise with server response.
     */
    private requestProducts(groupId = 0, cartId = 1): Promise<b2b.ProductsResponse> {

        const paginationParams = this.paginationRepo.getRequestParams();

        //switched for request (i don't know why)
        const features = (this.filters.currentFilter.parameters && this.filters.currentFilter.parameters.size) > 0 ? this.parametersToString(0) : '';
        const attributes = (this.filters.currentFilter.features && this.filters.currentFilter.features.size) > 0 ? this.parametersToString(1) : '';

        const query: b2b.ItemsRequest = {
            cartId: cartId + '',
            groupId: groupId + '',
            filter: this.filters.currentFilter.filter || '',
            warehouseId: this.filters.currentFilter.warehouse.id || '0',
            onlyAvailable: this.filters.currentFilter.onlyAvailable + '',
            isGlobalFilter: this.filters.currentFilter.isGlobalFilter + '',
            filterInGroup: this.filters.currentFilter.inGroup + '',
            features: features,
            attributes: attributes,
            skip: paginationParams.skip,
            top: paginationParams.top !== '0' ? paginationParams.top : ''
        };


        return this.httpClient.get<b2b.ProductsResponse>('/api/items/', { params: <any>query }).toPromise();
    }

    /**
     * Gets all products from given page and updates model.
     * If no page is given, gets first page.
     * Returns promise with product's amount.
     * waitForUnits property indicates whether to resolve the promise after receiving the products or after receiving the units. Default false.
     */
    loadProducts(groupId: number, cartId?: number): Promise<number> {

        this.unitsLoaded = false;

        return this.requestProducts(groupId, cartId).then(res => {

            this.groupId = groupId;

            const productsRes = res;

            // Products list viewed in product component
            if (productsRes.items && productsRes.items.set1 && productsRes.items.set1.length > 0) {
                // JD - filter non archived products
                this.products = productsRes.items.set1.filter(x => !x.archived).map(product =>  {
                    return  this.calculateProductValues(product);
                });
            } else {
                this.products = [];
            }

            if (this.products.length > 0) {

                //listConfig

                this.cartNumbers = ArrayUtils.toRangeArray<number>(productsRes.items.set2[0].cartCount, true);

                this.configService.applicationId = productsRes.items.set2[0].applicationId;

                this.config = Object.assign(this.config, productsRes.items.set2[0]);

                this.paginationRepo.pagination.isNextPage = productsRes.hasMore;

                if (this.configService.applicationId === 0) {
                    this.canChangeWarehouseLocal = productsRes.items.set4[0].changeWarehouseEnabled;
                } else {
                    this.canChangeWarehouseLocal = productsRes.items.set3[0].changeWarehouseEnabled;
                }

            }

            return this.products.length;

        });


    }

    private requestUnitsForMany(ids: number[]): Promise<b2b.UnitResponse[]> {
        return this.httpClient.post<b2b.UnitResponse[]>('/api/items/units', { ids: ids }).toPromise();
    }

    /**
     * Gets units for many products and updates service
     */
    loadUnitsForMany(ids: number[]): Promise<b2b.UnitResponse[] | HttpErrorResponse> {

        if (this.unitsLoaded) {

            const ids: b2b.UnitResponse[] = [];

            this.products.forEach(product => {

                product.units.forEach((unit, unitNo) => {
                    ids.push({ id: product.id, no: unitNo, unit: unit.auxiliaryUnit });
                });
            });

            return Promise.resolve(ids);
        }

        return this.requestUnitsForMany(ids).then(res => {

            const groupedUnits = ArrayUtils.groupBy(res, 'id');

            for (const id in groupedUnits) {
                const productIndex = this.products.findIndex(product => product.id === Number(id));
                this.fillUnits(productIndex, groupedUnits[id]);
            }

            this.unitsLoaded = true;

            return res;

        }).catch((err: HttpErrorResponse) => {

            this.unitsLoaded = true;

            return err;
        });
    }


    /**
     * Gets product's units from server and updates model.
     * Returns promise with index of product.
     */
    loadUnits(index: number): Promise<number | HttpErrorResponse> {

        if (this.products[index].unitsLoaded) {
            return Promise.resolve(index);
        }

        return this.requestUnits(this.products[index].id).then((res: b2b.UnitResponse[]) => {

            this.fillUnits(index, res);
            return index;

        });

    }

    /**
     * Sets given units in product with given index.
     */
    fillUnits(index: number, units: b2b.UnitResponse[]) {

        if (!this.products[index].units) {
            this.products[index].units = new Map<number, b2b.UnitMapElement>();
        }

        units.forEach(item => {

            if (!this.products[index].units.has(item.no)) {

                this.products[index].units.set(item.no, {
                    auxiliaryUnit: item.unit
                });
            }
        });



        this.products[index].unitsLoaded = true;
    }

    /**
     * Fill unit map element with lazy loaded unit data
     */
    fillUnitMapElement(productIndex: number, unitId: number, unitData: b2b.UnitMapElement): b2b.UnitMapElement {

        if (!this.products[productIndex].units.has(unitId)) {

            this.products[productIndex].units.set(unitId, {
                auxiliaryUnit: unitData.auxiliaryUnit,
            });
        }

        const unitMapElement = this.products[productIndex].units.get(unitId);

        this.products[productIndex].units.set(unitId, Object.assign(unitMapElement, unitData));

        if (unitMapElement.stockLevel !== undefined) {
            unitMapElement.max = ConvertingUtils.stringToNum(unitData.stockLevel);
        }

        if (unitMapElement.auxiliaryUnit && unitMapElement.denominator) {
            unitMapElement.converter = ConvertingUtils.unitConverterString(unitMapElement.denominator, unitMapElement.auxiliaryUnit, unitMapElement.numerator, unitMapElement.basicUnit);
        } else {
            unitMapElement.converter = null;
        }


        return Object.assign({}, unitMapElement);

    }


    fillBasicPrices(productIndex: number, unitData?: b2b.UnitMapElement) {

        const numericNetPrice = ConvertingUtils.stringToNum(unitData.netPrice);
        const numericGrossPrice = ConvertingUtils.stringToNum(unitData.grossPrice);

        const baseNetPrice = ConvertingUtils.calculateBasicPrice(numericNetPrice, unitData.denominator, unitData.numerator);
        const baseGrossPrice = ConvertingUtils.calculateBasicPrice(numericGrossPrice, unitData.denominator, unitData.numerator);

        const basicUnit = this.products[productIndex].units.get(0);

        const pricePipe = new ToPricePipe();
        basicUnit.netPrice = pricePipe.transform(baseNetPrice);
        basicUnit.grossPrice = pricePipe.transform(baseGrossPrice);
    }

    calculateProductValues(product: b2b.ProductListElement & b2b.ProductListElementResponse): b2b.ProductListElement {

        product.pricesLoaded = !this.configService.permissions.pricesVisibility;

        product.imageLoaded = !this.configService.config.showImages || product.imageId === null;

        product.unitsLoaded = !!product.unitLockChange;

        product.quantityChanged = false;

        product.noLink = false;

        product.cartId = 1;


        if (product.stockLevel === undefined) {
            product.max = -1;
        } else {
            product.max = ConvertingUtils.stringToNum(product.stockLevel);
        }


        if (!product.fromBinary) {
            product.fromBinary = '';
        }

        product.quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;

        product.min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

        if (this.configService.applicationId === 1) {
            //override availability for altum - always available
            product.status = ProductStatus.available;
        }

        return Object.assign({}, product);
    }


    /**
    * Converts units, updates model
    */
    unitConverter(index: number): Promise<number> {


        const unitElement = this.products[index].units.get(this.products[index].unitId);

        //if unit data never loaded
        if (unitElement === undefined || unitElement.stockLevel === undefined) {

            //load unit and change unit data

            this.products[index].unitsLoaded = false;

            const params: b2b.UnitConvertRequest = {
                cartId: this.products[index].cartId || 1,
                id: this.products[index].id,
                unitNo: this.products[index].unitId || 0,
                features: this.parametersToString(0) || '',
                warehouseId: this.filters.currentFilter.warehouse.id || '0'
            };


            return this.unitConverterRequest(params).then(res => {

                if (this.configService.applicationId === 1) {
                    const toPricePipe = new ToPricePipe();
                    res.grossPrice = toPricePipe.transform(res.grossPrice);
                    res.netPrice = toPricePipe.transform(res.netPrice);
                }

                if (res.auxiliaryUnit === null) {
                    res.auxiliaryUnit = res.basicUnit;
                    res.denominator = null;
                    res.numerator = null;
                }

                const newUnitData = this.fillUnitMapElement(index, this.products[index].unitId, res);

                this.products[index] = Object.assign(this.products[index], newUnitData);

                this.products[index].unitsLoaded = true;

                return index;
            });

        } else {

            //change unit data

            this.products[index] = Object.assign(this.products[index], unitElement);

            return Promise.resolve(index);
        }


    }

    private requestPricesAsync(index: number, quantity?: number): Promise<HttpResponse<b2b.PricesResponse>> {

        const item = this.products[index];

        const query: b2b.AsyncPricesRequestXL = {
            articleId: item.id,
            quantity: quantity || item.quantity || 1,
            deliveryMethodId: this.config.deliveryMethodId || 0,
            paymentFormId: this.config.paymentFormId || 0,
            paymentDate: this.config.paymentDate || 0,
            vatExport: this.config.vatExport || 0,
            companyUnitPath: this.configService.config.companyUnitPath || '',
            withoutKgo: this.configService.config.withoutKgo || 0,
            warehouseId: Number(this.filters.currentFilter.warehouse.id) || 0,
            reverseCharge: this.config.reverseCharge || 0,
            vatDirection: this.config.vatDirection || 0,
            precision: this.configService.config.precision || 0,
            quantityPriceValue: this.config.quantityPriceValue || 0,
            priceCalculatedDiscount: <0 | 1>Number(this.configService.config.priceCalculatedDiscount) || 0,
            features: this.parametersToString(0)

        };

        return this.httpClient.get<b2b.PricesResponse>('/api/items/pricesasync/', { params: <any>query, observe: 'response' }).toPromise();

    }

    private requestPricesAsyncAltum(index: number): Promise<HttpResponse<b2b.PricesResponse>> {

        const item = this.products[index];

        const query: b2b.AsyncPricesRequestAltum = {
            articleId: item.id,
            unit: item.unitId,
            warehouseId: Number(this.filters.currentFilter.warehouse.id) || 0,
            features: this.parametersToString(0)
        };

        return this.httpClient.get<b2b.PricesResponse>('/api/items/pricesasyncaltum/', { params: <any>query, observe: 'response' }).toPromise();
    }


    pricesAsync(index: number): Promise<number | HttpErrorResponse> {

        let pricesPromise: Promise<HttpResponse<b2b.PricesResponse>> = null;

        if (this.configService.applicationId === 0) {

            const quantity = (Number(this.products[index].defaultUnitNo) === 0) ? 1 : (this.products[index].numerator / this.products[index].denominator);

            pricesPromise = this.requestPricesAsync(index, quantity);


        } else if (this.configService.applicationId === 1) {

            pricesPromise = this.requestPricesAsyncAltum(index);

        }

        if (pricesPromise === null) {

            const fakeReponse = new HttpResponse<b2b.PricesResponse>({
                status: 200,
                body: {
                    set1: [{
                        grossPrice: this.products[index].grossPrice,
                        netPrice: this.products[index].netPrice,
                        currency: this.products[index].currency,
                        stockLevel: this.products[index].stockLevel,
                        type: this.products[index].type,
                        itemExistsInCurrentPriceList: this.products[index].itemExistsInCurrentPriceList,
                        baseGrossPrice: this.products[index].baseGrossPrice,
                        baseNetPrice: this.products[index].baseNetPrice,
                        basePriceNo: this.products[index].basePriceNo,
                        purchasePrice: this.products[index].purchasePrice,
                        precision: this.products[index].precision,
                        denominator: this.products[index].denominator,
                        numerator: this.products[index].numerator,
                        isUnitTotal: this.products[index].isUnitTotal,
                        defaultUnitNo: this.products[index].defaultUnitNo,
                        basicUnit: this.products[index].basicUnit
                    }]
                }
            });

            pricesPromise = Promise.resolve(fakeReponse);

        }


        return pricesPromise.then(res => {

            if (res.status === 204) {
                this.products[index].status = ProductStatus.unavaliable;
                this.products[index].units = null;
                this.products[index].unitId = null;
                this.products[index].noLink = true;
                return index;
            }

            const pricesResponse = res.body.set1[0];

            if (pricesResponse) {

                if (this.configService.config.priceMode === PriceMode.subtotal) {
                    pricesResponse.grossPrice = null;
                }

                if (this.configService.config.priceMode === PriceMode.total) {
                    pricesResponse.netPrice = null;
                }

                let newUnitData = {};

                if (this.products[index].unitsLoaded) {

                    const defaultUnitData: b2b.UnitMapElement = {
                        grossPrice: pricesResponse.grossPrice,
                        netPrice: pricesResponse.netPrice,
                        currency: pricesResponse.currency,
                        stockLevel: pricesResponse.stockLevel,
                        unitPrecision: pricesResponse.precision,
                        purchasePrice: pricesResponse.purchasePrice,
                        denominator: pricesResponse.denominator,
                        numerator: pricesResponse.numerator,
                        isUnitTotal: pricesResponse.isUnitTotal,
                        basicUnit: pricesResponse.basicUnit
                    };

                    this.products[index].unitId = pricesResponse.defaultUnitNo;
                    newUnitData = this.fillUnitMapElement(index, this.products[index].unitId, defaultUnitData);

                    if (pricesResponse.defaultUnitNo) {
                        this.fillBasicPrices(index, newUnitData);
                    }
                }

                Object.assign(this.products[index], pricesResponse, newUnitData);

                this.products[index].pricesLoaded = true;
            }

            return index;
        });

    }

    /**
     * Request for filtering options without values.
     * Filtering values are lazy loaded.
     */
    private requestClassesParameters(): Promise<b2b.FilterParameterResponse[]> {

        return this.httpClient.get<b2b.FilterParameterResponse[]>('/api/items/classesparameters?onlyavailable=' + this.filters.currentFilter.onlyAvailable).toPromise();

    }

    /**
     * Loads filtering options without values.
     * Filtering values are lazy loaded.
     * Updates model and returns Promise with filtering options collection.
     */
    loadClassesParameters(): Promise<Map<number, b2b.FilterParameter>> {

        if (this.filters.features) {
            return Promise.resolve(this.filters.features);
        }

        let itemClasses: b2b.FilterParameterResponse[] = [];

        return this.requestClassesParameters().then(res => {

            res = res.sort((el1, el2) => (el1.name < el2.name ? -1 : 1));

            if (this.configService.applicationId === 0) {

                for (const i in res) {

                    if (!res[i].value || !res[i].value.classItem || (res[i].value.classItem && res[i].value.classItem.type === 1)) {

                        itemClasses.push(res[i]);
                    }
                }
            } else {

                itemClasses = res;
            }

            this.filters.features = new Map();

            itemClasses.forEach((item) => {

                const filterObj: b2b.FilterParameter = { id: item.id, name: item.name, type: item.type };

                if (item.value) { //this was in source code, but i haven't seen this in res
                    filterObj.value = item.value;
                }

                this.filters.features.set(item.id, filterObj);

            });

            return this.filters.features;

        });


    }

    private requestParameterValues(id: number, type: number): Promise<b2b.FilterValue[]> {

        return this.httpClient.get<b2b.FilterValue[]>(`/api/items/valuesparameter?type=${type}&classid=${id}`).toPromise();

    }

    /**
     * Loads values of given filtering option.
     * Returns promise with values.
     */
    loadParameterValues(id: number, type: number): Promise<b2b.FilterValue[]> {

        return this.requestParameterValues(id, type).then(res => {

            this.filters.features.get(id).values = res.map((item, i) => {

                return { id: i, name: item.name, checked: this.filters.currentFilter.features.has(`${id}:${i}`) };
            });


            this.filters.features.set(id, this.filters.features.get(id));
            //this.filters.features = new Map(this.filters.features);

            return this.filters.features.get(id).values;

        });


    }

    /**
     * Updates given value of given filtering option.
     * If current filters section triggers the change, updates all filters and returns them.
     * If all filters section triggers the change, updates current filters and returns them.
     */
    updateParameterValue(key, valueKey, value?, filterId = 0, valueName?): void {

        this.filters.currentFilter.filterId = filterId;

        const fullFeature = this.filters.features.get(key);
        let valueObj = null;

        if (fullFeature.values) {
            valueObj = fullFeature.values[valueKey];
        }

        if (value === undefined) {

            if (!valueObj || fullFeature.values.length > 0) {
                value = !valueObj.checked;
            } else {
                value = false;
            }
        }

        if (fullFeature.values) {
            fullFeature.values[valueKey].checked = value;
            this.filters.features.set(key, fullFeature); //update refference to force rebinding
        }

        if (value) {

            if (!this.filters.currentFilter.features.has(`${key}:${valueKey}`)) {

                const feature: b2b.FilterParameter = {
                    id: key,
                    name: fullFeature.name,
                    type: fullFeature.type,
                    value: valueName || valueObj.name,
                    valueId: Number(valueKey)
                };


                this.filters.currentFilter.features.set(`${key}:${valueKey}`, feature);
            }


        } else {


            this.filters.currentFilter.features.delete(`${key}:${valueKey}`);


            if (fullFeature.values) {
                fullFeature.values[valueKey].checked = false;
            }

        }


        //set new reference to force rebinding
        this.filters.currentFilter.features = new Map(this.filters.currentFilter.features);

    }

    /**
     * Checks if there are any choosen filters by comparing current filter options with default values.
     */
    areNoFilters(): boolean {

        return (this.filters.currentFilter.filter === this.filters.default.filter
            && this.filters.currentFilter.profileName === this.filters.default.profileName
            && this.filters.currentFilter.onlyAvailable === this.filters.default.onlyAvailable
            && this.filters.currentFilter.isGlobalFilter === this.filters.default.isGlobalFilter
            && this.filters.currentFilter.inGroup === this.filters.default.inGroup
            && this.filters.currentFilter.warehouse.id === this.filters.default.warehouse.id
            && this.filters.currentFilter.parameters.size === this.filters.default.parameters.size
            && this.filters.currentFilter.features.size === this.filters.default.features.size);

    }

    /**
     * Resets all filtering options.
     * Overwrites filtering options with default values and loads new product list according to new settins.
     */
    resetAllFilters(): void {

        this.setCurrentFilter(this.getClearingFiltersObject());
        this.paginationRepo.changePage(0);

    }

    changeQuantity(index, quantity) {
        this.products[index].quantity = quantity;
        this.products[index].quantityChanged = true;
    }


    changeView(type: DisplayType) {


        this.config.displayType = type;
        localStorage.setItem('displayType', type + '');


        this.products.forEach((item, i) => {
            this.products[i].min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

            if (!this.products[i].quantityChanged) {
                this.products[i].quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;
            }
        });

    }

}
