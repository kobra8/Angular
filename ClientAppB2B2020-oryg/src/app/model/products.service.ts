import { Injectable } from '@angular/core';
import { ProductBase } from './shared/products-repo';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { b2b } from '../../b2b';
import { b2bShared } from 'src/integration/b2b-shared';
import { b2bProducts } from 'src/integration/products/b2b-products';
import { DisplayType } from './enums/display-type.enum';
import { Pagination } from './shared/pagination';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ConfigService } from './config.service';
import { PriceMode } from './enums/price-mode.enum';
import { WarehousesService } from './warehouses.service';
import { ProductStatus } from './enums/product-status.enum';
import { AccountService } from './account.service';
import { Subscription } from 'rxjs';
import { ApplicationType } from './enums/application-type.enum';
import { ProductsRequestsService } from './product/products-requests.service';
import { Subject } from 'rxjs';
import { MenuService } from './menu.service';

/**
 * Service for product's list
 */
@Injectable()
export class ProductsService extends ProductBase {

    groupId: number;

    config: b2bShared.ProductListConfig;

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

    products: b2b.GenericCollection<number, b2b.ProductListElement>;

    get productsLength(): number {
        if (this.products) {
            return Object.keys(this.products).length;
        }
        return 0;
    }


    /**
    * Object for managing pagination
    */
    pagination: Pagination;

    unitsLoaded: boolean;

    logInSub: Subscription;
    logOutSub: Subscription;

    private pricesPromisesData: b2b.GenericCollection<number, b2b.PromiseData<b2b.Prices>>;
    private unitsPromise: Promise<b2b.Collection<b2b.UnitResponse[]>>;
    private unitsPromiseResolve: Function;
    private unitsPromiseReject: Function;

    private _suggestions: b2bProducts.SuggestionBase[];
    suggestionsChanged: Subject<b2bProducts.SuggestionBase[]>;

    constructor(
        httpClient: HttpClient,
        configService: ConfigService,
        warehousesService: WarehousesService,
        private accountService: AccountService,
        private productsRequestsService: ProductsRequestsService,
        private menuService: MenuService) {
        super(httpClient, warehousesService, configService);

        this.pagination = new Pagination();
        this.suggestionsChanged = new Subject();

        this.config = {
            displayType: Number(localStorage.getItem('displayType')) || DisplayType.quickShopping
        };

        this.logInSub = this.accountService.logInSubj.subscribe(() => {

            this.filters = {
                default: {
                    filter: '',
                    filterId: 0,
                    profileName: '',
                    onlyAvailable: false,
                    isGlobalFilter: false,
                    inGroup: false,
                    warehouse: {
                        id: this.configService.config.warehouseId,
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
            filter.warehouse = { id: filterRes.filter.warehouse.id, text: filterRes.filter.warehouse.text || '' };

            if (filter.warehouse.text === '' && filter.warehouse.id !== 0 && this.warehousesService.warehouses.length > 1) {
                filter.warehouse.text = this.warehousesService.warehouses.find(item => item.id === filter.warehouse.id).text;
            }

        }


        const parameters = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(0, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : new Map();
        const features = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(1, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : new Map();

        filter.parameters = parameters;
        filter.features = features;

        return filter;
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
    private requestProducts(groupId = 0): Promise<b2b.ProductsResponse> {

        //switched for request (i don't know why)
        const features = (this.filters.currentFilter.parameters && this.filters.currentFilter.parameters.size) > 0 ? encodeURIComponent(this.parametersToString(0)) : '';
        const attributes = (this.filters.currentFilter.features && this.filters.currentFilter.features.size) > 0 ? encodeURIComponent(this.parametersToString(1)) : '';

        const query: b2b.ItemsRequest = Object.assign(
            {
                groupId: groupId + '',
                filter: this.filters.currentFilter.filter || '',
                onlyAvailable: this.filters.currentFilter.onlyAvailable + '',
                isGlobalFilter: this.filters.currentFilter.isGlobalFilter + '',
                filterInGroup: this.filters.currentFilter.inGroup + '',
                features: features,
                attributes: attributes,
            },
            this.pagination.getRequestParams()
        );


        return this.httpClient.get<b2b.ProductsResponse>('/api/items/', { params: <any>query }).toPromise();
    }

    /**
     * Gets all products from given page and updates model.
     * If no page is given, gets first page.
     * Returns promise with product's amount.
     * waitForUnits property indicates whether to resolve the promise after receiving the products or after receiving the units. Default false.
     */
    loadProducts(groupId: number): Promise<number> {

        this.products = {};
        this.pricesPromisesData = {};

        this.unitsPromise = new Promise<b2b.Collection<b2b.UnitResponse[]>>((resolve, reject) => {
            this.unitsPromiseResolve = resolve;
            this.unitsPromiseReject = reject;
        });

        this.unitsLoaded = false;

        return this.requestProducts(groupId).then(res => {

            this.groupId = groupId;
            const productsRes = res.products;

            if (productsRes && productsRes.length > 0) {

                productsRes.forEach((product, i) => {

                    const pricesPromisesEl = <b2b.PromiseData<b2b.Prices>>{};
                    const promise = new Promise<b2b.Prices>((resolve, reject) => {
                        pricesPromisesEl.promiseResolve = resolve;
                        pricesPromisesEl.promiseReject = reject;
                    });
                    pricesPromisesEl.promise = promise;

                    this.pricesPromisesData[product.id] = pricesPromisesEl;
                    this.products[product.id] = this.calculateProductValues(product);
                    this.fillPricesAndUnitsData(product.id);
                });
            }

            this.pagination.changeParams(res.paging);
            return this.productsLength;

        }).catch(err => {
            return Promise.reject(err);
        });
    }


    /**
     * Gets units for many products and updates service
     */
    loadUnitsForMany(ids: number[]): Promise<b2b.Collection<b2b.UnitResponse[]>> {

        if (this.unitsLoaded) {

            const ids: b2b.UnitResponse[] = [];
            Object.values(this.products).forEach(product => {
                product.units.forEach((unit, unitNo) => {
                    ids.push({ id: product.id, no: unitNo, unit: unit.auxiliaryUnit });
                });
            });

            this.unitsPromiseResolve(ids);
            return this.unitsPromise;
        }

        return this.requestUnitsForManyAndGroupById(ids).then(res => {

            this.unitsPromiseResolve(res);
            return this.unitsPromise;

        }).catch((err: HttpErrorResponse) => {

            this.unitsLoaded = true;
            this.unitsPromiseReject(err);
            return Promise.reject(err);
        });
    }


    /**
     * Fill unit map element with lazy loaded unit data
     */

    fillUnitMapElement(productId: number, unitId: number, unitData: b2b.UnitMapElement): b2b.UnitMapElement {
        return super.fillUnitMapElement(productId, unitId, unitData, this.products);
    }


    calculateProductValues(product: b2b.ProductListElementResponse): b2b.ProductListElement {

        const calculatedProduct: b2b.ProductListElement = Object.assign({}, <any>product);

        calculatedProduct.pricesLoaded = !this.configService.permissions.hasAccessToPriceList;

        calculatedProduct.imageLoaded = !this.configService.config.showImages || calculatedProduct.imageId === null;

        calculatedProduct.quantityChanged = false;

        calculatedProduct.noLink = false;


        if (calculatedProduct.stockLevel === undefined) {
            calculatedProduct.max = -1;
        } else {
            calculatedProduct.max = ConvertingUtils.stringToNum(calculatedProduct.stockLevel);
        }


        if (!calculatedProduct.fromBinary) {
            calculatedProduct.fromBinary = '';
        }

        calculatedProduct.quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;

        calculatedProduct.min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

        if (this.configService.applicationId === 1) {
            //override availability for altum - always available
            calculatedProduct.status = ProductStatus.available;
        }

        return calculatedProduct;
    }


    /**
    * Converts units, updates model
    */

    unitConverter(productId: number): Promise<number> {

        const params: b2b.UnitConvertRequest = {
            id: productId,
            unitNo: this.products[productId].unitId || 0,
            features: this.parametersToString(0) || '',
            warehouseId: this.filters.currentFilter.warehouse.id || 0
        };

        return super.unitConverter(productId, params, this.products);
    }

    private requestPricesAsyncXl(productId: number): Promise<HttpResponse<b2b.ConvertedAsyncPricesResponse>> {

        const item = this.products[productId];

        const query: b2bShared.AsyncPricesRequestXL = {
            articleId: item.id,
            warehouseId: Number(this.filters.currentFilter.warehouse.id) || 0,
            features: this.parametersToString(0)
        };

        return this.httpClient
            .get<b2b.PricesResponse>('/api/items/pricesasync/', { params: <any>query, observe: 'response' })
            .toPromise()
            .then(res => {
                const convertedPrices = this.convertProductPropertiesDifferences(res.body.items.set1[0]);
                res.body.items.set1[0] = Object.assign(res.body.items.set1[0], convertedPrices, { basicUnitNo: 0 });

                return res;
            }).catch(err => {
                return Promise.reject(err);
            }) as any;

    }

    private requestPricesAsyncAltum(productId: number): Promise<HttpResponse<b2b.ConvertedAsyncPricesResponse>> {

        const item = this.products[productId];

        const query: b2bShared.AsyncPricesRequestAltum = {
            articleId: item.id,
            warehouseId: Number(this.filters.currentFilter.warehouse.id) || 0,
            features: this.parametersToString(0)
        };

        return this.httpClient
            .get<b2b.PricesResponse>('/api/items/pricesasyncaltum/', { params: <any>query, observe: 'response' })
            .toPromise()
            .then(res => {
                const convertedPrices = this.convertProductPropertiesDifferences(res.body.items.set1[0]);
                res.body.items.set1[0] = Object.assign(res.body.items.set1[0], convertedPrices);

                return res;
            }).catch(err => {
                return Promise.reject(err);
            }) as any;
    }

    pricesAsync(productId: number): Promise<b2b.Prices> {

        let pricesPromise: Promise<HttpResponse<b2b.ConvertedAsyncPricesResponse>> = null;

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                pricesPromise = this.requestPricesAsyncXl(productId);
                break;

            case ApplicationType.ForAltum:
                pricesPromise = this.requestPricesAsyncAltum(productId);
                break;
        }

        if (pricesPromise === null) {
            const message = 'Not implemented action for application type: ' + this.configService.applicationId;
            console.error('pricesAsync(ERROR): ' + message);
            return Promise.reject(message);
        }


        return pricesPromise.then(res => {

            const pricesResponse = res.body.items.set1[0];

            if (pricesResponse) {

                if (this.configService.config.priceMode === PriceMode.subtotal) {
                    pricesResponse.grossPrice = null;
                    pricesResponse.baseGrossPrice = null;
                    pricesResponse.unitGrossPrice = null;
                }

                if (this.configService.config.priceMode === PriceMode.total) {
                    pricesResponse.netPrice = null;
                    pricesResponse.baseNetPrice = null;
                    pricesResponse.unitNetPrice = null;
                }
            }

            if (!this.pricesPromisesData[productId]) {
                return Promise.resolve({ prices: pricesResponse, index: productId });
            }

            this.pricesPromisesData[productId].promiseResolve({ prices: pricesResponse, index: productId, thresholdPriceLists: res.body.thresholdPriceLists });
            return this.pricesPromisesData[productId].promise;

        }).catch(err => {

            if (err.status === 204) {
                this.products[productId].status = ProductStatus.unavaliable;
                this.products[productId].units = null;
                this.products[productId].unitId = null;
                this.products[productId].noLink = true;
                this.products[productId].pricesLoaded = true;
                this.products[productId].unitsLoaded = true;
                this.products[productId].itemExistsInCurrentPriceList = false;

                return Promise.resolve(err);
            }

            this.pricesPromisesData[productId].promiseReject({ prices: err, index: productId });
            return Promise.reject(err);
        });
    }

    fillPricesAndUnitsData(productId: number) {

        Promise.all([this.unitsPromise, this.pricesPromisesData[productId].promise]).then(res => {
            const groupedUnits = res[0];
            this.fillUnits(productId, groupedUnits[productId], this.products);

            const pricesResponse = res[1].prices;
            const thresholdPriceLists = res[1].thresholdPriceLists;

            let newUnitData = {};

            if (!this.products[productId].units) {
                this.products[productId].units = new Map<number, b2b.UnitMapElement>();
            }

            const defaultUnitData: b2b.UnitMapElement = {
                auxiliaryUnit: pricesResponse.auxiliaryUnit || pricesResponse.basicUnit,
                grossPrice: pricesResponse.grossPrice,
                netPrice: pricesResponse.netPrice,
                baseGrossPrice: pricesResponse.baseGrossPrice,
                baseNetPrice: pricesResponse.baseNetPrice,
                currency: pricesResponse.currency,
                stockLevel: pricesResponse.stockLevel,
                max: ConvertingUtils.stringToNum(pricesResponse.stockLevel),
                unitPrecision: pricesResponse.precision,
                denominator: pricesResponse.denominator,
                numerator: pricesResponse.numerator,
                isUnitTotal: pricesResponse.isUnitTotal,
                basicUnit: pricesResponse.basicUnit,
                unitNetPrice: pricesResponse.unitNetPrice,
                unitGrossPrice: pricesResponse.unitGrossPrice
            };

            this.products[productId].unitId = pricesResponse.defaultUnitNo;
            //if (this.configService.applicationId === 0) {
            //    this.products[productId].unitId = pricesResponse.defaultUnitNo;
            //} else {
            //    this.products[productId].unitId = this.products[productId].basicUnitNo;
            //}


            newUnitData = this.fillUnitMapElement(productId, this.products[productId].unitId, defaultUnitData);

            this.unitsLoaded = true;

            Object.assign(this.products[productId], pricesResponse, newUnitData);
            this.products[productId].thresholdPriceLists = thresholdPriceLists;
            this.products[productId].pricesLoaded = true;

        }).catch(err => {

            this.unitsLoaded = true;
            this.products[productId].pricesLoaded = true;
            return Promise.reject(err);
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
        this.pagination.goToStart();

    }

    changeQuantity(productId, quantity) {
        this.products[productId].quantity = quantity;
        this.products[productId].quantityChanged = true;
    }

    changeView(type: DisplayType) {

        this.config.displayType = type;
        localStorage.setItem('displayType', type + '');

        Object.values(this.products).forEach(product => {
            product.min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

            if (!product.quantityChanged) {
                product.quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;
            }
        });
    }

    getSuggestions(searchValue: string) {
        switch (this.configService.applicationId) {
        case ApplicationType.ForXL:
                return this.getSuggestionsXl(searchValue);

        case ApplicationType.ForAltum:
                return this.getSuggestionsAltum(searchValue);

        default:
                console.error(`getSuggestions(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
        }
    }

    private getSuggestionsXl(searchValue: string) {
        const request = this.prepareGetSuggestionsBaseRequest(searchValue);
        this.productsRequestsService.getSuggestionsXlRequest(request).subscribe(res => {
            this.inCaseSuccessGetSuggestionsBase(res);
        });
    }

    private getSuggestionsAltum(searchValue: string) {
        const request = this.prepareGetSuggestionsBaseRequest(searchValue);
        this.productsRequestsService.getSuggestionsAltumRequest(request).subscribe(res => {
            this.inCaseSuccessGetSuggestionsBase(res);
        });
    }

    private prepareGetSuggestionsBaseRequest(searchValue: string): b2bProducts.GetSuggestionsBaseRequest {
        const groupId = location.href.includes(this.menuService.routePaths.items) ? this.groupId : 0;
        return {
            filter: searchValue,
            groupId
        };
    }

    private inCaseSuccessGetSuggestionsBase(response: b2bProducts.GetSuggestionsBaseResponse) {
        this._suggestions = response.suggestions;
        this.suggestionsChanged.next(this._suggestions.slice());
    }
}
