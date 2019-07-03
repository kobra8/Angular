import { Injectable } from '@angular/core';
import { ProductsRepo } from './shared/products-repo';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { PermissionHelper } from '../helpers/permission-helper';
import { DisplayType } from './enums/display-type.enum';
import { FiltersObjectType } from './enums/filters-object-type.enum';
import { Subject } from 'rxjs/Subject';
import { WarehousesRepo } from './shared/warehouses-repo';
import { PaginationRepo } from './shared/pagination-repo';
import { FormattingUtils } from '../helpers/formatting-utils';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { PriceMode } from './enums/price-mode.enum';

/**
 * Service for product's list
 */
@Injectable()
export class ProductsService extends ProductsRepo {

    /**
     * 0 when XL
     * 1 when Altum
     */
    applicationId: number;

    groupId: number;

    config: b2b.ItemsDisplayConfig;

    filters: {
        config: b2b.FiltersConfig;

        /**
        * current filter options
        */
        currentFilter?: b2b.CurrentFilter,

        /**
        * filter profiles (saved filters)
        */
        filterProfiles?: b2b.FilterProfile[] // 

        /**
        * product's attributes
        */
        features: b2b.Collection<b2b.FilterParameter>;
    };

    products: b2b.ListProduct[];

    /**
    * Object for managing warehouses
    */
    warehousesRepo: WarehousesRepo;

    /**
    * Object for managing pagination
    */
    paginationRepo: PaginationRepo;


    cartNumbers: string[];


    /**
    * Search form submit event.
    */
    searchEvent: Subject<{ searchPhrase: string }>;

    constructor(httpClient: HttpClient, private configService: ConfigService) {
        super(httpClient);


        this.warehousesRepo = new WarehousesRepo(httpClient);

        //this.groupsRepo = new GroupsRepo(httpClient);

        this.paginationRepo = new PaginationRepo();


        this.searchEvent = new Subject<{ searchPhrase: string }>();

        this.config = {
            showImages: false,
            showCode: false,
            showState: false,
            showFeatures: false,
            calculateDiscount: true,
            precision: 2,
            stateMode: false,
            displayType: Number(localStorage.getItem('displayType')) || DisplayType.quickShopping
        };

        this.filters = {

            config: {
                filterByWarehouse: true,
            },

            currentFilter: this.getClearingFiltersObject(),
            features: {},
            filterProfiles: []
        };


    }

    /**
       * Default filters object. Used for init or clearing filters.
       */
    getClearingFiltersObject(): b2b.CurrentFilter {

        return {
            filter: '',
            filterId: 0,
            profileName: '',
            onlyAvailable: false,
            isGlobalFilter: false,
            inGroup: false,
            warehouse: { id: '0', text: '' },
            parameters: [],
            features: [],
            articlesGroups: null
        };
    }

    /**
     * Setter for display settings.
     * Merging given object with settings.
     * Doesn't remove parameters missed in given object.
     */
    setConfig(config: b2b.ItemsDisplayConfig): void {

        this.config = Object.assign(this.config, config);

        //always true, regardless of configuration
        this.config.showFeatures = true;


    }

    /**
     * Setter for current filter params.
     * Merging given object with current filtering options.
     * Doesn't remove parameters missed in given object.
     */
    setCurrentFilter(filter: b2b.CurrentFilter): b2b.CurrentFilter {


        this.filters.currentFilter = Object.assign(this.filters.currentFilter, filter);

        if (filter.articlesGroups !== undefined && filter.articlesGroups !== null) {

            //is it history? temporarly added to both
            this.filters.currentFilter.articlesGroups = filter.articlesGroups;
            //this.groupsRepo.groups.history = filter.articlesGroups;
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
            filter.warehouse = { id: filterRes.filter.warehouse.id.toString(), text: filterRes.filter.warehouse.text || '' };

            if (filter.warehouse.text === '' && filter.warehouse.id !== '0' && this.warehousesRepo.warehouses.length > 1) {
                filter.warehouse.text = this.warehousesRepo.warehouses.find(item => item.id.toString() === filter.warehouse.id).text;
            }

        }


        const parameters = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(0, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : [];
        const features = (filterRes.filter.parameters) ? this.convertParametersToClientStructure(1, <b2b.FilterParameterRequest[]>filterRes.filter.parameters) : [];

        filter.parameters = parameters;
        filter.features = features;

        return filter;
    }

    getPaginationParams(): b2b.PaginationConfig {
        return this.paginationRepo.pagination;
    }

    /**
     * Setter for current pagination params.
     * Merging given object with current pagination settings.
     * Doesn't remove parameters missed in given object.
     */
    setPaginationParams(paginationConfig: b2b.PaginationConfig): void {

        this.paginationRepo.pagination = Object.assign(this.paginationRepo.pagination, paginationConfig);
    }


    private requestDefaultFilter(): Promise<b2b.FilterResponse> {

        return this.httpClient.get<b2b.FilterResponse>('api/items/filters/default').toPromise();

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

        return this.httpClient.get<b2b.FilterProfile[]>('api/items/filters').toPromise();

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

        return this.httpClient.post<number>('api/items/filters', filterProfile).toPromise();

    }

    /**
     * Convert filtering option's values structure to request stucture
     */
    convertParametersToSave(type?: number, parameters?: b2b.FilterParameter[]): b2b.FilterParameterRequest[] {

        const converted: b2b.FilterParameterRequest[] = [];

        if (parameters === undefined || parameters === null) {
            parameters = this.getParameters(type);
        }

        for (const i in parameters) {

            converted.push({ classItem: null, items: null });
            converted[i].classItem = { id: parameters[i].id.toString(), type: parameters[i].type.toString(), text: parameters[i].name };
            converted[i].items = [{ id: parameters[i].valueId.toString(), text: parameters[i].value.toString(), value: parameters[i].value }];
        }

        return converted;
    }

    /**
     * Simplify filtering options values received from server to UI friendly structure, unified with filtering options request stucture.
     */
    convertParametersToClientStructure(type?: number, parameters?: b2b.FilterParameterRequest[]): b2b.FilterParameter[] {

        const converted: b2b.FilterParameter[] = [];

        if (parameters === undefined || parameters === null) {
            return this.getParameters(type);
        }

        for (let i = 0; i < parameters.length; i++) {

            if (parameters[i].classItem.type === undefined || parameters[i].classItem.type === null || Number(parameters[i].classItem.type) === type) {
                converted.push({
                    id: Number(parameters[i].classItem.id),
                    name: parameters[i].classItem.text,
                    type: Number(parameters[i].classItem.type),
                    value: parameters[i].items[0].value,
                    valueId: Number(parameters[i].items[0].id)
                });
            }
        }

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


        const features: b2b.FilterParameterRequest[] = (this.filters.currentFilter.features !== null || this.filters.currentFilter.features.length) > 0 ? this.convertParametersToSave(1) : null;
        const parameters: b2b.FilterParameterRequest[] = (this.filters.currentFilter.parameters !== null || this.filters.currentFilter.parameters.length > 0) ? this.convertParametersToSave(0) : null;

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

        return this.httpClient.get<b2b.FilterResponse>(`api/items/filters/${id}/${0}`).toPromise();

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


            //filter name comes empty even when exists - bug?
            //quickfix - searching filter in filter profiles and getting the name
            const profileName = this.filters.filterProfiles.find(el => el.id === id).name;


            this.setCurrentFilter(filter);
            this.updateAllSelectedFeatures();

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

        return this.httpClient.get<b2b.FilterResponse>(`api/items/filters/${id}/${1}`).toPromise();

    }

    loadGlobalFilter(id: number): Promise<b2b.CurrentFilter> {

        return this.requestLoadGlobalFilter(id).then(res => {

            //const ifGetGroups = this.groupsRepo.groups.currentGorupId !== res.filter.groupId;

            this.filters.config.isGlobalDefaultFilter = true;

            const filter = this.convertFilterStructure(res);

            this.setCurrentFilter(filter);
            this.filters.currentFilter.isGlobalFilter = false; //why reset here?

            return this.filters.currentFilter;
        });

    }

    /**
     * Makes request for remove saved filter. Returns promise with boolean.
     */
    private requestRemoveFilterProfile(id: number): Promise<boolean> {

        return this.httpClient.delete<boolean>('api/items/filters/remove/' + id).toPromise();

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
    getParameters(type?: number, parameters?: b2b.FilterParameter[]): b2b.FilterParameter[] {

        let newParams: b2b.FilterParameter[] = Object.assign({}, parameters);

        if (parameters === undefined || parameters === null) {

            if (type === 1) {
                newParams = this.filters.currentFilter.features;
            } else if (type === 0) {
                newParams = this.filters.currentFilter.parameters;
            } else {
                newParams = this.filters.currentFilter.features.concat(this.filters.currentFilter.parameters);
            }

        } else {

            if (type === 0 || type === 1) {
                newParams = newParams.filter(item => item.type === type);
            }

        }

        return newParams;
    }

    /**
     * Convert model parameters (or given parameters) to string format required by requests.
     */
    parametersToString(type?: number, parameters?: b2b.FilterParameter[]): string {


        if (parameters === undefined || parameters === null) {

            parameters = this.getParameters(type, parameters);
        }

        let str = '';

        parameters.forEach((el, i) => {
            str += `${parameters[i].id}:${parameters[i].value};`;
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
        const features = (this.filters.currentFilter.parameters && this.filters.currentFilter.parameters.length) > 0 ? this.parametersToString(0) : '';
        const attributes = (this.filters.currentFilter.features && this.filters.currentFilter.features.length) > 0 ? this.parametersToString(1) : '';

        const query: b2b.ItemsRequest = {
            cartId: cartId.toString(),
            groupId: groupId.toString(),
            filter: this.filters.currentFilter.filter || '',
            warehouseId: this.filters.currentFilter.warehouse.id || '0',
            onlyAvailable: this.filters.currentFilter.onlyAvailable.toString(),
            isGlobalFilter: this.filters.currentFilter.isGlobalFilter.toString(),
            filterInGroup: this.filters.currentFilter.inGroup.toString(),
            features: features,
            attributes: attributes,
            skip: paginationParams.skip,
            top: paginationParams.top !== '0' ? paginationParams.top : ''
        };


        return this.httpClient.get<b2b.ProductsResponse>('api/items/', { params: <any>query }).toPromise();
    }

    /**
     * Gets all products from given page and updates model.
     * If no page is given, gets first page.
     * Returns promise with product's amount.
     */
    loadProducts(groupId: number, cartId?: number): Promise<number> {

        this.groupId = groupId;

        return this.requestProducts(groupId, cartId).then(res => {

            //products
            if (res.items.set1 && res.items.set1.length > 0) {

                this.products = res.items.set1;

                this.products.forEach((item, i) => {
                    this.products[i].quantityChanged = false;
                    this.calculateValues(i);
                    this.products[i].min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;
                });

            } else {
                this.products = [];
            }



            if (this.products.length > 0) {

                //listConfig


                this.cartNumbers = <string[]>ArrayUtils.toRangeArray(res.items.set2[0].cartCount, true);

                this.applicationId = res.items.set2[0].applicationId;

                this.setConfig(res.items.set2[0]);

                this.setPaginationParams({
                    pageSize: res.items.set2[0].pageSize,
                    isNextPage: res.hasMore
                });

                this.filters.config.filterByWarehouse = true; //why allways true?


            }

            return this.products.length;
        });




    }

    /**
     * Gets product's units from server and updates model.
     * Returns promise with index of product.
     */
    loadUnits(index: number): Promise<number> {

        if (this.products[index].unitsLoaded) {
            return Promise.resolve(index);
        }

        return this.requestUnits(this.products[index].id).then((res: b2b.UnitResponse[]) => {

            if (!this.products[index].units) {
                this.products[index].units = new Map<number, b2b.UnitMapElement>();
            }

            res.forEach(item => {

                if (!this.products[index].units.has(item.no)) {

                    this.products[index].units.set(item.no, {
                        auxiliaryUnit: item.unit
                    });
                }
            });

            this.products[index].unitsLoaded = true;

            return index;

        });

    }


    calculateValues(index: number) {

        this.products[index].cartId = 1;


        if (this.products[index].unitId === undefined) {

            this.products[index].unitId = this.products[index].defaultUnitNo;

            if (this.products[index].auxiliaryUnit) {

                this.products[index].converter = FormattingUtils.unitConverterString(this.products[index].denominator, this.products[index].auxiliaryUnit, this.products[index].numerator, this.products[index].basicUnit);

            } else {

                this.products[index].auxiliaryUnit = this.products[index].basicUnit;

            }


        }

        if (!this.products[index].units) {

            this.products[index].units = new Map<number, b2b.UnitMapElement>();

            this.products[index].units.set(this.products[index].unitId, {
                basicUnit: this.products[index].basicUnit,
                auxiliaryUnit: this.products[index].auxiliaryUnit
            });
        }

        if (this.products[index].stockLevel) {
            this.products[index].max = FormattingUtils.stringToNum(this.products[index].stockLevel);
        } else {
            this.products[index].max = -1;
        }


        const unitData = this.products[index].units.get(this.products[index].unitId);

        unitData.isUnitTotal = this.products[index].isUnitTotal;
        unitData.type = this.products[index].type;
        unitData.denominator = this.products[index].denominator;
        unitData.numerator = this.products[index].numerator;
        unitData.stockLevel = this.products[index].stockLevel;
        unitData.unitPrecision = this.products[index].unitPrecision;
        unitData.currency = this.products[index].currency;
        unitData.converter = (this.products[index].auxiliaryUnit && this.products[index].denominator) ? FormattingUtils.unitConverterString(this.products[index].denominator, this.products[index].auxiliaryUnit, this.products[index].numerator, this.products[index].basicUnit) : null;
        unitData.max = this.products[index].max;


        let quantityPrecision;
        if (this.products[index].unitPrecision) {
            quantityPrecision = this.products[index].unitPrecision;
        } else {
            quantityPrecision = this.products[index].isUnitTotal ? 0 : 4;
        }


        if (!this.products[index].fromBinary) {
            this.products[index].fromBinary = '';
        }



        this.products[index].quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;


    }


    /**
    * Converts units, updates model
    */
    unitConverter(index: number): Promise<number> {


        const unitElement = this.products[index].units.get(this.products[index].unitId);

        //if unit never loaded
        if (unitElement === undefined || unitElement.basicUnit === undefined) {

            //load unit and change unit data

            this.products[index].unitsLoaded = false;

            const params: b2b.UnitConvertRequest = {
                cartId: this.products[index].cartId.toString() || '1',
                id: this.products[index].id.toString(),
                unitNo: this.products[index].unitId.toString() || '0',
                features: this.parametersToString(0) || '',
                warehouseId: this.filters.currentFilter.warehouse.id || '0'
            };


            return this.unitConverterRequest(params).then(res => {

                const unitData = Object.assign(res, {
                    converter: (res.auxiliaryUnit) ? FormattingUtils.unitConverterString(res.denominator, res.auxiliaryUnit, res.numerator, res.basicUnit) : null,
                    max: FormattingUtils.stringToNum(res.stockLevel)
                });

                this.products[index].units.set(this.products[index].unitId, unitData);

                this.products[index] = Object.assign(this.products[index], unitData);

                this.products[index].unitsLoaded = true;

                return index;
            });

        } else {

            //change unit data 

            this.products[index] = Object.assign(this.products[index], unitElement);

            return Promise.resolve(index);
        }


    }

    private requestPricesAsync(index: number, quantity?: number): Promise<b2b.PricesResponse> {

        const item = this.products[index];

        const query = {
            articleId: item.id,
            quantity: quantity || item.quantity,
            currency: item.currency,
            basePriceNo: item.basePriceNo || 0,
            deliveryMethodId: this.config.deliveryMethodId || 0,
            paymentFormId: this.config.paymentFormId || 0,
            paymentDate: this.config.paymentDate || 0,
            vatExport: this.config.vatExport || 0,
            purchasePrice: this.config.purchasePrice || 0,
            companyUnitPath: this.config.companyUnitPath || '',
            withoutKgo: this.config.withoutKgo || 0,
            warehouseId: this.filters.currentFilter.warehouse.id || 0,
            reverseCharge: this.config.reverseCharge || 0,
            vatDirection: this.config.vatDirection || 0,
            precision: this.config.precision || 0,
            quantityPriceValue: this.config.quantityPriceValue || 0,
            priceCalculatedDiscount: this.config.priceCalculatedDiscount || 0

        };


        return this.httpClient.get<b2b.PricesResponse>('api/items/pricesAsync/', { params: <any>query }).toPromise();

    }

    private requestPricesAsyncAltum(index: number): Promise<b2b.PricesResponse> {

        const item = this.products[index];

        const query = {
            articleId: item.id,
            unit: item.unitId,
            features: this.parametersToString(0)
        };

        return this.httpClient.get<b2b.PricesResponse>('api/items/pricesAsyncAltum/', { params: <any>query }).toPromise();
    }


    pricesAsync(index: number): Promise<number> {

        let pricesPromise: Promise<b2b.PricesResponse> = null;

        if (this.applicationId === 0) {

            if (this.config.calculateDiscount) {

                const quantity = (Number(this.products[index].defaultUnitNo) === 0) ? 1 : (this.products[index].numerator / this.products[index].denominator);

                pricesPromise = this.requestPricesAsync(index, quantity);

            }

        } else if (this.applicationId === 1) {

            pricesPromise = this.requestPricesAsyncAltum(index);

        }

        if (pricesPromise === null) {

            pricesPromise = Promise.resolve({
                grossPrice: this.products[index].grossPrice,
                netPrice: this.products[index].netPrice
            });

        }


        return pricesPromise.then(res => {

            if (res) {

                if (this.configService.permissions.pricesVisibility) {

                    if (this.config.priceMode !== PriceMode.total) {
                        this.products[index].netPrice = res.netPrice;
                    }

                    if (this.config.priceMode !== PriceMode.subtotal) {
                        this.products[index].grossPrice = res.grossPrice;
                    }
                }

                if (!this.products[index].units) {

                    this.products[index].units = new Map<number, b2b.UnitMapElement>();

                    this.products[index].units.set(this.products[index].unitId, {
                        basicUnit: this.products[index].basicUnit,
                        auxiliaryUnit: this.products[index].auxiliaryUnit
                    });

                }

                const unitData = this.products[index].units.get(this.products[index].unitId);
                unitData.grossPrice = res.grossPrice;
                unitData.netPrice = res.netPrice;

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

        return this.httpClient.get<b2b.FilterParameterResponse[]>('api/items/classesParameters?onlyAvailable=' + this.filters.currentFilter.onlyAvailable).toPromise();

    }

    /**
     * Loads filtering options without values.
     * Filtering values are lazy loaded.
     * Updates model and returns Promise with filtering options collection.
     */
    loadClassesParameters(): Promise<b2b.Collection<b2b.FilterParameter>> {

        let itemClasses = [];

        return this.requestClassesParameters().then(res => {

            if (this.applicationId === 0) {

                for (const i in res) {

                    if (!res[i].value || !res[i].value.classItem || (res[i].value.classItem && res[i].value.classItem.type === 1)) {

                        itemClasses.push(res[i]);
                    }
                }
            } else {

                itemClasses = res;
            }


            for (const i in itemClasses) {

                this.filters.features[itemClasses[i].id] = { id: itemClasses[i].id, name: itemClasses[i].name, type: itemClasses[i].type };

                if (itemClasses[i].value) { //this was in source code, but i haven't seen this in res
                    this.filters.features[itemClasses[i].id.toString()].value = itemClasses[i].value;
                }
            }

            return this.filters.features;

        });


    }

    private requestParameterValues(id: number, type: number): Promise<b2b.FilterValue[]> {

        return this.httpClient.get<b2b.FilterValue[]>(`api/items/valuesParameter?type=${type}&classId=${id}`).toPromise();

    }

    /**
     * Loads values of given filtering option.
     * Returns promise with values.
     */
    loadParameterValues(id: number, type: number): Promise<b2b.FilterValue[]> {

        return this.requestParameterValues(id, type).then(res => {

            this.filters.features[id].values = res.map(item => {
                return { name: item.name, checked: false };
            });

            this.updateAllSelectedFeatures();

            return this.filters.features[id].values;

        });


    }

    /**
     * Grabs all selected values from filters.features, converts them and puts in filters.currentFilter.features.
     * Returns filters.currentFilter.features.
     * 
     * [notice] filters.features  is lazy, it may have empty values. When it's not, it contains all filtering options: selected and unselected.
     * filters.currentFilter.features includes only selected options and it's allways available.
     */
    updateCurrentSelectedFeatures(): b2b.FilterParameter[] {

        const parameters = this.filters.features;
        this.filters.currentFilter.features = [];

        for (const i in parameters) {

            const parameter = parameters[i];

            for (const j in parameters[i].values) {

                const value = parameters[i].values[j];

                if (value.checked === true) {

                    const feature: b2b.FilterParameter = { id: Number(i), name: parameter.name, type: parameter.type, value: value.name, valueId: Number(j) };
                    this.filters.currentFilter.features.push(feature);

                }
            }
        }

        return this.filters.currentFilter.features;
    }


    /**
     * Grabs all values from filters.currentFilter.features object and checks them as selected in filters.features object.
     * Returns filters.features object with new selected values.
     *
     * [notice] filters.features object is lazy, it may have empty values. When it's not, it contains all filtering options: selected and unselected.
     * filters.currentFilter.features includes only selected options and it's allways available.
     */
    updateAllSelectedFeatures(): b2b.Collection<b2b.FilterParameter> {

        for (const i in this.filters.features) {

            if (this.filters.features[i] && this.filters.features[i].values) {
                this.filters.features[i].values.forEach(item => {
                    item.checked = false;
                });
            }
        }

        if (this.filters.currentFilter.features.length > 0) {

            this.filters.currentFilter.features.forEach(item => {

                if (this.filters.features[item.id] && this.filters.features[item.id].values) {
                    this.filters.features[item.id].values[item.valueId].checked = true;
                }

            });

        }

        return this.filters.features;
    }


    /**
     * Updates given value of given filtering option.
     * If current filters section triggers the change, updates all filters and returns them.
     * If all filters section triggers the change, updates current filters and returns them.
     */
    updateParameterValue(key, valueKey, triggeringSection: FiltersObjectType): b2b.FilterParameter[] | b2b.Collection<b2b.FilterParameter> {



        this.filters.currentFilter.filterId = 0;

        if (triggeringSection === FiltersObjectType.current) {

            if (this.filters.currentFilter.features.length === 1) {

                this.filters.currentFilter.features = [];

            } else {

                const index = this.filters.currentFilter.features.findIndex(item => (item.id === key && item.valueId === valueKey));
                this.filters.currentFilter.features.splice(index, 1);

            }

            return this.updateAllSelectedFeatures();

        } else {

            this.filters.features[key].values[valueKey].checked = !this.filters.features[key].values[valueKey].checked;
            return this.updateCurrentSelectedFeatures();

        }
    }

    /**
     * Checks if there are any choosen filters by comparing current filter options with default values.
     */
    areNoFilters(): boolean {

        const currentFilter = Object.assign({}, this.filters.currentFilter, { isGlobalFilter: false });

        return JSON.stringify(currentFilter) === JSON.stringify(this.getClearingFiltersObject());
    }

    /**
     * Resets all filtering options.
     * Overwrites filtering options with default values and loads new product list according to new settins.
     */
    resetAllFilters(): void {

        this.setCurrentFilter(this.getClearingFiltersObject());
        this.updateAllSelectedFeatures();
        this.paginationRepo.changePage(0);

    }

    /**
     * Calculates min validator and default value for item. Handy during view change
     * */
    //calculateItemMinValue(index) {

    //    //negative min or max value resets stepper attribute to default validator
    //    this.products[index].min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

    //    if (!this.products[index].quantityChanged) {
    //        this.products[index].quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;
    //    }

    //}

    changeQuantity(index, quantity) {
        this.products[index].quantity = quantity;
        this.products[index].quantityChanged = true;
    }


    changeView(type: DisplayType) {


        this.config.displayType = type;
        localStorage.setItem('displayType', type.toString());


        this.products.forEach((item, i) => {
            this.products[i].min = (this.config.displayType === DisplayType.quickShopping) ? 0 : -1;

            if (!this.products[i].quantityChanged) {
                this.products[i].quantity = (this.config.displayType === DisplayType.quickShopping) ? 0 : 1;
            }
        });

    }

}
