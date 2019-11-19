import { AttributeType } from './app/model/enums/attribute-type.enum';
import { DisplayType } from './app/model/enums/display-type.enum';
import { OldPagination } from './app/model/shared/pagination';
import { RightXL } from './app/model/enums/right-xl.enum';
import { RightAltum } from './app/model/enums/right-altum.enum';
import { Route } from '@angular/router';
import { PriceMode } from './app/model/enums/price-mode.enum';
import { CsvLineErrorEnum } from './app/model/enums/csv-line-error-enum.enum';
import { CsvLineWarningEnum } from './app/model/enums/csv-line-warning-enum.enum';
import { CsvParserResponseEnum } from './app/model/enums/csv-parser-response-enum.enum';
import { CsvProductFinalEnum } from './app/model/enums/csv-product-final-enum.enum';
import { PromotionType } from './app/model/enums/promotion-type.enum';
import { SafeHtml } from '@angular/platform-browser';
import { CyclicityType } from './app/model/enums/cyclicity-type.enum';
import { ProductStatus } from './app/model/enums/product-status.enum';
import { PromotionTypeAltum } from './app/model/enums/promotion-type-altum.enum';
import { AddToCartResponseEnum } from './app/model/enums/add-to-cart-response-enum';

export module b2b {

    /**
    * Object acting like a dictionary/map/associative array.
    */
    interface Collection<T> {
        [Key: string]: T;
    }

    /**
    * Basic request object.
    * Request object may cause type-matching errors when is used as httpClient param and doesn't implements RequestParams interface (or similar).
    * Most request interfaces are extending RequestParams interface to avoid this error.
    */
    interface RequestParams {
        [param: string]: string | string[];
    }

    interface Supervisor {
        supervisor: string;
        supervisorEmail: string;
        supervisorTelephone: string;
    }

    /**
    * Customer header data received from server.
    * Object containes credit and currency infos.
    */
    interface CustomerHeaderResponse {

        outputs: {
            returN_VALUE: number
        };

        /**
         * One-element array of credit info and customer info (user name and company)
         **/
        set1: HeaderCustomerInfo[];

        /**
         * One-element array of supervisor data
         **/
        set2: Supervisor[];

        /**
         * Overdue payments per currency
         * */
        set3: OverduePayment[];

        /**
         * Array of all user permissions
         **/
        //set4: { rightId: RightXL & RightAltum }[];

    }

    interface Header {
        creditInfo: HeaderCustomerInfo;
        supervisor: Supervisor;
    }

    interface OverduePayment {
        currency: string;
        value: number;
    }

    /**
    * Credit and currency info.
    */
    interface HeaderCustomerInfo {

        customerCurrency: string;
        customerLimit: string;
        customer: string;
        contact: string;
        applicationId: number;
        priceMode: PriceMode;
    }

    /**
    * Single menu option in main menu.
    */
    interface MenuItem {
        cssClass: string;
        cssClassAlt?: string;
        resourceKey: string;
        params?: any;
        position: number;
        key?: RouteKey;

        /**
        * url path navigated via router (property [routerLink])
        */
        url?: string;

        /**
        * url path navigated via pure html (property [href])
        */
        href?: string;

        action?: string;
        withDataFilter?: boolean;
    }


    interface MenuLabels {
        backToShopping?: string;
        selectedCart?: string;
    }


    /**
    * Parameters for product list request.
    * Contains all filtering options, including search phrase and group id.
    */
    interface ItemsRequest {
        cartId: string;
        groupId: string;
        filter: string;
        warehouseId: number;
        onlyAvailable: string;
        isGlobalFilter: string;
        filterInGroup: string;
        features: string;
        attributes: string;
        pageNumber?: number;
    }

    interface Breadcrumb {
        id: number;
        name?: string;
    }

    /**
    * Category group object.
    */
    interface Group extends Breadcrumb {

        /**
        * 1 when group has children.
        * 0 when it doesn't.
        */
        isExpand?: 0 | 1;

        /**
        * True if group is selected.
        * Parameter is created on the client's side, it doesn't come with response.
        */
        isActive?: boolean;
    }

    interface GroupsResponse {
        outputs: { returN_VALUE: number };

        /**
         * child groups
         * */
        set1: Group[];

        /**
         * group path (breadcrumbs)
         * */
        set2: Breadcrumb[];
    }

    /**
    * Groups/categories and history infos.
    */
    interface GroupsData {

        currentGorupId: number;
        childGroups: Group[];
        history: Group[];

    }

    /**
    * Product's list display setiings.
    * Object is part of product's list.
    */
    interface ItemsDisplayConfig {

        applicationId?: number;
        cartCount?: number;
        deliveryMethodId?: number;
        paymentDate?: number;
        paymentFormId?: number;
        vatDirection?: 0 | 1;
        vatExport?: 0 | 1;
        warehouseId?: number;
        warehouseName?: string;
        displayType?: DisplayType;
        quantityPriceValue?: any;

        purchasePrice?: any;
        reverseCharge?: any;
    }

    /**
    * Product's list filters setiings.
    * Object is part of product's list.
    */
    interface FiltersConfig {
        filterByWarehouse?: boolean;
        isGlobalDefaultFilter?: boolean;
    }

    /**
    * Filter profile's preview.
    * Including basic info about saved filter.
    * Full info is received after selecting filter request.
    */
    interface FilterProfile {

        id: number;
        name: string;
        isDefault?: boolean;
        isGlobal: boolean;
    }

    /**
    * Basic select's option object
    */
    interface Option {
        id?: number;
        text?: string;
    }

    /**
    * Basic select's option object
    */
    interface Option2 {
        id?: number;
        name: string;
    }

    /**
    * Basic select's option object
    */
    interface Option3 {
        id: number;
        resourceKey: string;
    }

    interface Option4 {
        id: number;
        value: string;
    }

    interface NameValue {
        name: string;
        value: string;
    }

    /**
    * Warehouse option object
    */
    interface Warehouse {
        id: number;
        text: string;
    }

    /**
    * Full filter profile info.
    * Object is received with selecting filter profile response.
    */
    interface FilterResponse {

        filterId: number;
        filter: {
            warehouse?: Warehouse;
            onlyAvailable?: boolean;
            isGlobalFilter?: boolean;
            inGroup?: boolean;
            parameters?: FilterParameterRequest[] | string;
            features?: FilterParameterRequest[] | string;
            groupId?: number;
            articlesGroups?: any;
            filterName?: string;
        };

    }

    /**
    * Current selected filtering options
    * Object keeps all filtering params on the client side.
    * Also used in saving filter profile request.
    */
    interface CurrentFilter {

        globalDefaultFilter?: number;
        filterId?: number;
        profileName?: string;
        warehouse?: Warehouse;
        onlyAvailable?: boolean;
        isGlobalFilter?: boolean;
        inGroup?: boolean;
        parameters?: Map<string, FilterParameter>;
        filter?: string;

        /**
        * array containing info about filtering by products' attributes
        */
        features?: Map<string, FilterParameter>;

        /**
         * Map of selected filters. Map keys format: key:value.
         * */
        articlesGroups?: any;

    }

    /**
    * Filtering option received in response
    */
    interface FilterParameterResponse {
        id: number;
        name: string;
        type: number;
        value?: any;
    }

    /**
    * Filtering option for product's list.
    * Extended by filter values compared to response object.
    */
    interface FilterParameter extends FilterParameterResponse {

        value?: string;

        /**
        * d of selected value.
        * Filter values are lazy loaded. Values table is empty by default.
        * valueId contains selected value even when the table is empty.
        */
        valueId?: number;

        /**
        * Values of filter.
        * The table is lazy loaded. Empty by default.
        * To check selected value use valueId property.
        */
        values?: FilterValue[];
    }

    /**
    * Filtering by attributes data received after selecting filter response.
    */
    interface FilterParameterRequest {

        /**
        * Filter name.
        */
        classItem?: {
            id?: string;
            type?: string;
            text?: string;
        };
        /**
        * Selected filter values.
        */
        items?: [{
            id?: string;
            text?: string;
            value?: string;
        }];
    }

    /**
    * Values of given filtering option
    */
    interface FilterValue {
        name: string;
        checked?: boolean;
    }

    /**
    * Pagination params.
    * Object is used on every paged list
    */
    interface PaginationConfig {

        currentPage?: number;
        totalPages?: number;
        buildPager?: boolean;

    }

    interface OldPaginationConfig {
        currentPage?: number;
        pageSize?: number;
        hasMore?: boolean;
    }


    interface PaginationRequestParams {
        pageNumber?: number;
    }

    interface OldPaginationRequestParams {

        skip?: number;
        top?: number;
    }


    interface AsyncPricesRequestXL {
        articleId: number;
        quantity: number;
        deliveryMethodId: number;
        paymentFormId: number;
        paymentDate: number;
        vatExport: number;
        companyUnitPath: string;
        withoutKgo: 0 | 1;
        warehouseId: number;
        reverseCharge: number;
        vatDirection: 0 | 1;
        precision: number;
        quantityPriceValue: number;
        priceCalculatedDiscount: 0 | 1;
        features: string;
    }

    interface AsyncPricesRequestAltum {
        articleId: number;
        unit: number;
        features: string;
        warehouseId: number;
    }


    interface PaginationResponse {
        buildPager: boolean;
        currentPage: number;
        totalPages: number;
    }

    /**
    * Response received after getting product's list request.
    */
    interface ProductsResponse {

        /**
        * Product list's info.
        */
        items: {
            outputs: {
                returN_VALUE: number
            };

            /**
            * Product's preview.
            */
            set1: ProductListElementResponse[];

            /**
            * Product's list settings
            */
            set2: ItemsDisplayConfig[];

            /**
             * haveAccess - XL
             * changeWarehouseEnabled - Altum
             * */
            set3: { haveAccess: boolean }[] & { changeWarehouseEnabled: boolean }[];

            /**
             * XL only
             */
            set4: { changeWarehouseEnabled: boolean }[];
        };

        paging: PaginationResponse;

    }



    /**
    * Array of units received in response
    */
    interface UnitResponse {
        id: number;
        no: number;
        unit: string;

        /**
         * Altum only
         * */
        isLocked?: boolean | null;

        /**
         * Altum only
         * */
        isDefault?: 0 | 1;
    }

    /**
    * Response after async recalculation of single product prices
    */
    interface PricesResponse {
        outputs?: { returN_VALUE: number };
        set1: AsyncPricesResponse[];
    }

    interface ConvertedPricesResponse {
        outputs?: { returN_VALUE: number };
        set1: AsyncConvertedPrices[];
    }

    interface Prices {
        prices: AsyncConvertedPrices;
        index: number;
    }

    interface PromiseData<T> {
        promise: Promise<T>;
        promiseResolve: Function;
        promiseReject: Function;
    }

    interface AsyncPricesBase {
        /**
         * null for basic unit
         * */
        auxiliaryUnit?: string;
        currency: string;
        stockLevel: string;
        type: number;
        itemExistsInCurrentPriceList: boolean;
        denominator: number;
        numerator: number;
        defaultUnitNo: number;
        isUnitTotal: 0 | 1;
        basicUnit: string;
        basePriceNo: number;

        /*
         * XL only
         */
        purchasePrice?: number;

        /*
         * Altum only
         */
        precision?: number;
    }

    interface ProductPropertiesDifferencesToConvert {
        grossPrice: string;
        netPrice: string;
        baseGrossPrice: string;
        baseNetPrice: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: string;


        /**
         * XL only
         * For Altum: unitChangeBlocked?: boolean;
         * */
        unitLockChange?: 0 | 3;

        /**
         * Altum only.
         * For XL: unitLockChange?: 0 | 3;
         * */
        unitChangeBlocked?: boolean;
    }

    interface AsyncPricesResponse extends AsyncPricesBase, ProductPropertiesDifferencesToConvert {


    }


    interface ProductPropertiesDifferencesConverted {
        grossPrice: number;
        netPrice: number;
        baseGrossPrice: number;
        baseNetPrice: number;
        unitLockChange: boolean;


        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: number;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: number;
    }


    interface AsyncConvertedPrices extends AsyncPricesBase, ProductPropertiesDifferencesConverted {

    }

    /**
    * Base object for all products
    * It's base for product list's item, cart's list item and customer list's products.
    */
    interface BaseProduct {
        code: string;
        auxiliaryUnit?: string;
        id: number;
        imageId: number;
        name: string;
        quantity?: number;
        max?: number;
    }


    /**
    * Base object for products to buy.
    * It's base for product list's item and cart's list item.
    */
    interface ProductToBuy extends BaseProduct {

        basicUnit: string;

        //found in source code; don't come with response
        converter?: any;
        unitPrecision?: any;
        cartId?: number;
        fromBinary?: any;
        state?: any;

    }

    /**
    * Product's list item.
    */
    interface ProductListElementResponse extends ProductToBuy {


        discountAllowed: boolean;

        /**
         * Product promotional flags as bitwise flag
         * */
        flag: number;

        /**
         * XL only
         * */
        availability?: number;

        /**
         * XL only
         * */
        status?: ProductStatus;

        /**
         * XL only
         * */
        availableFrom?: string;
    }




    /**
    * Request params for unit conversion
    */
    interface UnitConvertRequest {

        cartId: number;

        /**
        * Product id.
        */
        id: number;

        unitNo: number;
        features: string;
        warehouseId: number;
    }

    interface UnitDataBase {
        basicUnit: string;
        auxiliaryUnit?: string;
        isUnitTotal: 0 | 1;
        type: number;
        denominator: number;
        numerator: number;
        stockLevel: string;
        unitPrecision: number;
        currency: string;
        volume: number;
        bruttoWeight: number;
        nettoWeight: number;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey?: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey?: string;
    }


    /**
    * Response received after unit conversion
    */
    interface UnitDataResponse extends UnitDataBase {
        netPrice: string;
        grossPrice: string;
        baseGrossPrice: string;
        baseNetPrice: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: string;
    }

    /**
    * Response received after unit conversion
    */
    interface UnitData extends UnitDataBase {
        netPrice: number;
        grossPrice: number;
        baseGrossPrice: number;
        baseNetPrice: number;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: number;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: number;
    }


    interface EmptyUnitMapElement {
        auxiliaryUnit?: string;
        basicUnit?: string;
    }

    interface FilledUnitMapElement {
        basicUnit: string;
        auxiliaryUnit: string;
        isUnitTotal: 0 | 1;
        netPrice: number;
        grossPrice: number;
        type: number;
        denominator: number;
        numerator: number;
        stockLevel: string;
        unitPrecision: number;
        currency: string;
        converter: string;
        max: number;
        volume: number;
        bruttoWeight: number;
        nettoWeight: number;
        //purchasePrice: number;
        baseNetPrice: number;
        baseGrossPrice: number;
        unitNetPrice: number;
        unitGrossPrice: number;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey: string;
    }

    interface UnitMapElement extends EmptyUnitMapElement, Partial<FilledUnitMapElement> {

    }

    interface ProductListElement extends Partial<ProductListElementResponse>, Partial<UnitMapElement>, Partial<AsyncConvertedPrices> {
        basePriceNo: number;
        precision: number;

        unitId?: number;
        units?: Map<number, UnitMapElement>;
        min?: number;

        unitChange?: any;
        quantityChanged?: boolean;
        noLink?: boolean;

        /**
         * False if some unit data are loading, eg. unit prices.
         */
        unitsLoaded?: boolean;

        /**
        * True when image is lodaded or showing images is forbidden or there is no image
        */
        imageLoaded?: boolean;

        /**
        * True when prices are loaded or showing prices is forbidden
        */
        pricesLoaded?: boolean;

        basicUnitNo: number;
        unitNetPrice?: number;
        unitGrossPrice?: number;
    }

    /**
    * Single cart preview.
    * Includes basic summary of cart.
    */
    interface CartPreviewItem {

        /**
        * Cost of cart products, grouped by currency.
        */
        groups: Collection<CartPreviewItemResponse>;

        /**
        * Products amount
        */
        productsAmount: number;
    }

    /**
    * Cart's preview.
    * Includes basic summary of all carts.
    */
    interface CartsPreview {
        carts: Map<number, { count: number, currencies: CartPreviewItemResponse[] }>;
        summariesByCurrency: Map<string, { totalNetAmount: number, totalGrossAmount: number }>;
        cartsAmount: number;
        totalProductsAmount: number;
    }

    /**
    * Response after getting carts preview from server.
    */
    interface CartPreviewItemResponse {
        count: number;
        currency: string;
        grossAmount: number;
        id: number;
        netAmount: number;
        vatValue?: number;
    }

    /**
    * Cart settings
    */
    interface CartConfig {
        applicationId: number;

        /**
         * XL only
         * */
        deliveryMethodId?: number;

        /**
         * XL only
         * */
        paymentDate?: number;

        /**
         * XL only
         * */
        paymentFormId?: number;

        /**
         * XL only
         * */
        quantityPriceValue?: number;

        /**
         * XL only
         * */
        vatDirection?: 0 | 1;

        /**
         * XL only
         * */
        vatExport?: number;

        /**
         * XL only
         * */
        warehouseId?: number;

        /**
         * XL only
         * */
        warehouseName?: string | null;
    }

    /**
    * Product in cart
    */
    interface CartProductBase extends ProductToBuy {

        defaultUnitNo: number;
        isUnitTotal: 0 | 1;
        denominator?: number;
        numerator?: number;
        discount: string;
        fromQuote: number;
        itemId: number;
        no: number;
        totalValue: string;
        subtotalValue: string;
        vatDirection: 'N' | 'B';
        unit: string;
        stockLevel: string;
        type: number;

        /** XL only
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exceededStates?: boolean;

        /** Altum only
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exeededStates?: boolean;

        index: number;

        setDocumentsType?: number;

        //????
        bundleId: number;
        bundleCode: string;
        bundleQuantity: number;

    }

    /**
    * Product in cart
    */
    interface CartProductResponse extends CartProductBase {

        totalPrice: string;
        subtotalPrice: string;

    }

    interface CartProductResponseConverted extends CartProductBase {

        totalPrice: number;
        subtotalPrice: number;

    }

    /**
    * Product in cart
    */
    interface CartProduct extends CartProductBase {

        totalPrice: number;
        subtotalPrice: number;
        quantityChanged: boolean;
        disabled: boolean;
        dontControl: boolean;
        basicUnitTotalPrice: number;
        basicUnitSubtotalPrice: number;
        forbidden: boolean;
        bundleId: number;
        alertedItems: number;
        warn: boolean;
        stockLevelNumber: number;
    }

    /**
    * Selected options info and few settings.
    */
    interface CartHeader {
        address?: string;
        addressId?: number;
        completionEntirely?: 0 | 1;
        creditLimitMode?: CreditLimitMode;

        /**
         * XL - name
         * Altum - id as string
         * */
        deliveryMethod?: string;

        description?: string;
        descriptionSI?: string;
        dueDate?: Date;
        headerId?: number;
        isConfirm?: 0 | 1;
        isDeliveryCost?: boolean;
        paymentForm?: string;
        paymentFormId?: number;
        receiptDate?: Date;
        showFeatures?: 0 | 1;
        sourceNumber?: string;
        sourceNumberSI?: string;
        stockLevelMode?: StockLevelMode;
        translationDeliveryMethod?: string;
        vatDirection?: 'N' | 'B';
        warehouseId?: number;
        warehouseName?: string;

        /**
         * XL only.
         * For Altum - set7
         * */
        //not used - to remove from backend
        warehouseChangeEnabled?: boolean;




    }

    /**
    * Summary of all cart products.
    * All pages included in calculations.
    */
    interface CartSummary {
        count: number;
        currency: string;
        grossAmount: string;
        netAmount: string;
        vatValue: string;
        id: number;
        fromQuote?: number;
    }

    /**
    * Weight and volume of all of products.
    * All pages iIncluded in calculations.
    */
    interface CartWeight { //??
        weightGross: number;
        volume: number;

        /**
         * Delivery cost (may not exist)
         */
        costValue?: string;
        gidService?: number;
    }

    interface CreditLimitInfo {
        creditLimitMode: CreditLimitMode;
        exceededCreditLimit: boolean;
    }

    /**
    * Delivery metchod option
    */
    interface DeliveryMethod extends Option2 {
        translationName: string;
    }


    interface CartProductsResponseItemsBase {

        outputs: { returN_Value: number };

        /**
        * Cart's settings.
        */
        set2: CartConfig[];

        /**
        * Selected options and few settings.
        */
        set3?: CartHeader[];

        /**
        * Summaries grouped by currency.
        * Summaries calculated for all of products. (All pages).
        */
        set5: CartSummary[];

        /**
        * Weight and volume for all of products.
        * (All pages).
        */
        set6?: CartWeight[];

        /**
         * Altum only
         * For XL - cartHeader (set3)
         * */
        set7?: { changeWarehouseEnabled: true }[];
    }

    interface CartProductsResponseItems extends CartProductsResponseItemsBase {

        set1?: CartProductResponse[];

        /**
        * Header attributes
        */
        set4?: CartHeaderAttributeResponse[];
    }

    interface CartProductsResponseConvertedItems extends CartProductsResponseItemsBase {

        set1?: CartProductResponseConverted[];

        /**
        * Header attributes
        */
        set4?: CartHeaderAttribute[];
    }


    /**
    * Response received after getting cart request.
    */
    interface CartProductsResponse {
        items: CartProductsResponseItems;
        hasMore: boolean;
    }

    /**
    * Response received after getting cart request.
    */
    interface CartProductsConvertedResponse {
        items: CartProductsResponseConvertedItems;
        hasMore: boolean;
    }

    /**
    * Product data received after product quantity change.
    * Object is part of the change quantity response.
    */
    interface CartProductChangedResponseBase {

        denominator: number;
        getDeliveryConst: boolean;
        numerator: number;
        vatDirection: 0 | 1;
        totalValue: string;
        subtotalValue: string;
        discount: string;

        /**
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exceededStates: boolean;

        alertedItems: { //??
            itemId: number
        }[];

        bundleId: any; //???


        ////aditional
        //price: string;
        //quantity: number;



    }

    interface CartProductChangedResponse extends CartProductChangedResponseBase {

        totalPrice: string;
        subtotalPrice: string;

    }

    interface CartProductChangedResponseConverted extends CartProductChangedResponseBase {

        totalPrice: number;
        subtotalPrice: number;

    }


    interface CartQuantityResponseBase {

        /**
        * Altum only
        * Summaries recalculation.
        * Recalculation iIncludes all of products. (All pages)
        */
        set2: CartSummary[];

        /**
        * Xl Only
        * Summaries recalculation.
        * Recalculation iIncludes all of products. (All pages)
        */
        set3: CartSummary[];

        /**
        * Weight and volume recalculation.
        * Recalculation iIncludes all of products. (All pages)
        */
        set5: CartWeight[];
    }

    /**
    * Response received after changing product quantity
    */
    interface CartQuantityResponse extends CartQuantityResponseBase {

        /**
        * Product updated data.
        */
        set1: CartProductChangedResponse[];

    }


    /**
    * Response received after changing product quantity
    */
    interface CartQuantityConvertedResponse extends CartQuantityResponseBase {

        /**
        * Product updated data.
        */
        set1: CartProductChangedResponseConverted[];

    }

    interface CartHeaderAttributeRequest {
        attributeClassId: number;
        type: AttributeType;
        itemId: 0;
        value?: any;
        headerId?: number;
        documentId?: number;
        applicationId?: number;
    }

    interface CartHeaderAttributeBase extends CartHeaderAttributeRequest {
        format?: string;
        name?: string;
        traslateName?: string;
    }


    interface CartHeaderAttributeResponse extends CartHeaderAttributeBase {
        /**
         *  XL: 0 | 1
         *  Altum: boolean
         * */
        required?: 0 | 1 | boolean;
    }

    interface CartHeaderAttribute extends CartHeaderAttributeBase {
        required?: boolean;
    }


    interface CartProductRemoveResponseItemsBase {

        outputs: {
            returN_VALUE: number;
        };

        /**
        * One-element array with config object.
        */
        set2: CartConfig[];

        /**
        * Array of summaries, grouped by currency.
        * Summaries are calculated for all added products (all pages).
        */
        set3: CartSummary[];

        /**
        * One-element array with credit and currency infos
        */
        set4: [{
            creditLimit: number;
            customerCurrency: string;
        }];

        /**
        * one-element array with gross weight and volume
        */
        set5: CartWeight[];

    }

    /**
    * response after removing product from cart
    */
    interface CartProductRemoveResponseItems extends CartProductRemoveResponseItemsBase {


        /**
        * Array of products.
        * Array contains only products from selected page.
        */
        set1: CartProductResponse[];

    }


    interface CartProductRemoveConvertedResponseItems extends CartProductRemoveResponseItemsBase {


        /**
        * Array of products.
        * Array contains only products from selected page.
        */
        set1: CartProductResponseConverted[];

    }

    /**
    * response after removing product from cart
    */
    interface CartProductRemoveResponse {

        /**
        * True if next page exists.
        */
        hasMore: boolean;

        /**
        * Products info.
        */
        items: CartProductsResponseItems;
    }



    interface CartProductRemoveResponseConverted {

        /**
        * True if next page exists.
        */
        hasMore: boolean;

        /**
        * Products info.
        */
        items: CartProductRemoveConvertedResponseItems;
    }

    interface CheckUnitsResponse {
        outputs: { returN_VALUE: number };
        set1: {
            actualUnitId: number;
            code: string;
            izE_UnitDefault: number;
        }[];
    }


    interface ExceetedStockLimitResponse {
        outputs: { returN_VALUE: number };
        set1: [{ exceededCreditLimit: false }];
    }

    /**
    * Order IDs (system id and user id)
    */
    interface IDs {
        id: number;
        number: string;
    }

    /**
    * Response after creating new order
    */
    interface AddOrderResponse {

        outputs: {
            returN_VALUE: number;
        };

        error?: any;
        message?: any;
        /**
        * One-element array with order IDs.
        * Id can be used for redirect to added order.
        */
        set1?: IDs[];
        set2: any[];
        set3: any[];
        set4: any[];
    }

    interface AddDocumentFailture {
        result: -1;
        error: any;
        message: any;
    }

    interface AddDocumentSuccess {
        result: 0;
        ids: IDs;
    }

    /**
    * Parameters for loading product request
    */
    interface ProductRequestParams {
        cartId: string;
        unitNo?: string;
        warehouseId?: number;
        features?: string;
    }

    interface ProductReplacementIDs {
        id: number;
        substituteId: number;
    }

    interface ProductReplacement extends ProductReplacementIDs, Partial<ProductReplacementFilled> {

    }

    interface ProductResponseBase {

        outputs: { returN_VALUE: number };

        /**
        * Displaing configuration.
        */
        set2: ProductConfig[];

        set3: ProductReplacementIDs[];

        set4: { haveAccess: boolean }[];

        set5: { isAccessible: boolean, itemExistsInCurrentPriceList: boolean }[];

        set6: { changeWarehouseEnabled: boolean }[];

    }


    interface ProductAttributesResponse {
        outputs: { returN_VALUE: number };
        set1: ProductAttribute[];
        set2: Attachement[];

        /**
         * images
         * */
        set3: { id: number, default: 0 | 1 }[];
    }

    /**
    * Original response object received after loading product request.
    */
    interface ProductResponse extends ProductResponseBase {
        /**
        * Header data, details of product.
        */
        set1: ProductDetailsInfoResponse[];
    }

    /**
   * Corrcted response object received after loading product request.
   * Prices as number.
   */
    interface ProductResponseConverted extends ProductResponseBase {

        /**
        * Header data, details of product.
        */
        set1: ProductDetailsInfo[];

    }

    interface ProductDetailsInfoBase {
        articleUrl: string;
        articleGroupId: number;
        basicUnit: string;
        brand: string;
        code: string;
        currency: string;
        defaultUnitNo: number;
        description: string;
        isUnitTotal: 0 | 1;
        manager: string;
        managerMail: string;
        manufacturer: string;
        manufacturerUrl: string;
        name: string;
        stockLevel: string;
        type: number;
        bruttoWeight: number;
        nettoWeight: number;
        volume: number;
        discountAllowed?: boolean;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey: string;

        /**
         * Product promotional flags as bitwise flag
         * */
        flag: number;

        vatRate: number;
        wmc: number;

        featuresParam?: string;
        id: number;

        auxiliaryUnit?: string;
        denominator?: any;
        numerator?: any;
        unitPrecision?: any;

        fromBinary: any;
        state: string;
        quantityPrecision?: any;

        /**
         * XL only
         * */
        availability?: number;

        /**
         * XL only
         * */
        status?: number;

        /**
         * XL only
         * */
        availableFrom?: string;
    }



    /**
    * Details of product.
    * Description, manager, manufacturer, etc.
    */
    interface ProductDetailsInfoResponse extends ProductDetailsInfoBase {
        netPrice: string;
        grossPrice: string;
        baseNetPrice: string;
        baseGrossPrice: string;

        /**
         * XL only
         * For Altum: unitChangeBlocked?: boolean;
         * */
        unitLockChange?: 0 | 3;

        /**
         * Altum only.
         * For XL: unitLockChange?: 0 | 3;
         * */
        unitChangeBlocked?: boolean;


        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: string;


    }

    /**
    * Details of product.
    * Description, manager, manufacturer, etc.
    */
    interface ProductDetailsInfo extends ProductDetailsInfoBase {
        netPrice: number;
        grossPrice: number;
        baseNetPrice: number;
        baseGrossPrice: number;
        units: Map<number, UnitMapElement>;
        max: number;
        cartId: number;
        quantity: number;
        unitId: number;
        converter: string;
        unitsLoaded: boolean;
        basicUnitNo: number;
        unitLockChange: boolean;


        /**
        * Received when the basic unit is an auxiliary unit
        * */
        unitGrossPrice: number;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice: number;
    }


    /**
    * Displaing configuration.
    */
    interface ProductConfig {
        applicationId: number;
        cartCount: number | number[];
        warehouseId: number;
        warehouseName: string;
    }

    /**
    * Product attribute
    */
    interface ProductAttribute {
        type: number;
        name: string;
        value: string;
    }

    interface ProductReplacementBase {
        basicUnit: string;
        code: string;
        currency: string;
        defaultUnitNo: number;
        forHowMuch: number;
        howMuch: string;
        id: number;
        imageId: number;
        isUnitTotal: number;
        name: string;
        stockLevel: string;
        type: number;
        discountAllowed?: boolean;
        quantityPrecision: any;
        fromBinary: any;
        unitPrecision?: any;
        auxiliaryUnit?: string;
    }

    /**
    * Product replacement
    */
    interface ProductReplacementResponse extends ProductReplacementBase {
        netPrice: string;
        grossPrice: string;
        baseNetPrice: string;
        baseGrossPrice: string;

        /**
         * XL only
         * For Altum: unitChangeBlocked?: boolean;
         * */
        unitLockChange?: 0 | 3;

        /**
         * Altum only.
         * For XL: unitLockChange?: 0 | 3;
         * */
        unitChangeBlocked?: boolean;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitGrossPrice?: string;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice?: string;

    }

    /**
    * Product replacement
    */
    interface ProductReplacementFilled extends ProductReplacementBase {
        netPrice: number;
        grossPrice: number;
        baseNetPrice: number;
        baseGrossPrice: number;
        quantity: number;
        max: number;
        unitId: number;
        units: Map<number, UnitMapElement>;
        cartId: number;
        converter: string;
        unitsLoaded: boolean;
        basicUnitNo: number;
        //basicUnitNetPrice: number;
        //basicUnitGrossPrice: number;
        unitLockChange: boolean;

        /**
         * XL only
         * */
        availability?: number;

        /**
         * XL only
         * */
        status?: ProductStatus;

        /**
         * XL only
         * */
        availableFrom?: string;


        /**
        * Received when the basic unit is an auxiliary unit
        * */
        unitGrossPrice: number;

        /**
         * Received when the basic unit is an auxiliary unit
         * */
        unitNetPrice: number;
    }

    /**
    * File attachment object on product details.
    */
    interface Attachement {
        id: number;
        name: string;
        extension: string;
        size: number;
    }


    /**
    * Filtering options for user lists (orders, inquiries itp)
    */
    interface ListFilter {
        documentNumberFilter: string;
        documentOwnNumberFilter: string;
        stateId: number;
        stateName?: string;
        dateFrom: Date;
        dateTo: Date;
        getFilter: boolean;
        updateFilter: boolean;
        controlDate: boolean;
    }


    /**
    * Base object for customer lists responses
    */
    interface CustomerListResponse {

        paging: PaginationResponse;
    }

    interface CustomerListResponseItems<T> {

        outputs: { returN_Value: number };

        /**
        * list items
        */
        set1: T[];

    }

    /**
    * Base object for filter object received after customer lists responses
    */
    interface CommonCustomerListFilter {
        dateFrom: Date;
        dateTo: Date;

    }

    /**
    * Base object for filter object received after customer lists responses
    */
    interface CommonCustomerListFilterRequest extends PaginationRequestParams {
        dateFrom: string;
        dateTo: string;
    }

    /**
    * Base object for filter object received after most of the customer lists responses
    */
    interface CustomerListFilterForMajority extends CommonCustomerListFilter {
        documentNumberFilter: string;
        documentOwnNumberFilter: string;
        name: string;
    }


    /**
    * Base object for single list item preview received after customer list request
    */
    interface CustomerListItem {

        id: number;
        issueDate: Date;
        number: string;
        sourceNumber: string;
        state: number;
    }

    /**
    * Orders list element
    */
    interface OrderListItem extends CustomerListItem {
        customer: string;
        completionEntirely: string;
        deliveryMethod: number;
        expectedDate: Date;
        isCancelled: boolean;
        isConfirmed: boolean;
        quotes: any[];
    }

    /**
    * Filtering options for orders list
    */
    interface OrderFilter extends CustomerListFilterForMajority {
        document: string;
        state: string;
        stateId?: number;
    }

    interface OrdersListResponseItems extends CustomerListResponseItems<OrderListItem> {
        set2: {
            //confirmOrders: boolean;
        }[];
        set3: any[];
    }

    /**
    * Response received after orders list request
    */
    interface OrdersListResponse extends CustomerListResponse {
        filter: OrderFilter;
        items: OrdersListResponseItems;
    }

    /**
    * Inquiries list element
    */
    interface InquiryListItem extends CustomerListItem {
        /**
         * XL only
         */
        description?: string;

        /**
         * Altum only
         */
        auxiliaryUnit?: string;
        /**
         * Altum only
         */
        basicUnit?: string;
        /**
         * Altum only
         */
        code?: string;
        /**
         * Altum only
         */
        defaultUnitNo?: number;
        /**
         * Altum only
         */
        denominator?: number;
        /**
         * Altum only
         */
        id?: number;
        /**
         * Altum only
         */
        isAvailable?: boolean;
        /**
         * Altum only
         */
        isUnitTotal?: 0 | 1;
        /**
         * Altum only
         */
        name?: string;
        /**
         * Altum only
         */
        no?: string;
        /**
         * Altum only
         */
        numerator?: number;
        /**
         * Altum only
         */
        quantity?: number;
        /**
         * Altum only
         */
        unitPrecision?: number;

    }

    /**
    * Filtering options for inquiries list
    */
    interface InquiryListFilter extends CustomerListFilterForMajority {
        stateId: number;
    }

    /**
    * Response received after inquiries list request
    */
    interface InquiriesListResponse extends CustomerListResponse {
        filter: InquiryListFilter;
        items: CustomerListResponseItems<InquiryListItem>;
    }

    /**
    * Quotes list element
    */
    interface QuotesListItem extends CustomerListItem {
        description: string;
        orders: {
            id: number;
            inquiryNumber: string;
        }[];
    }

    /**
    * Filtering options for quotes list
    */
    interface QuotesListFilter extends CustomerListFilterForMajority {
        stateId: QuoteStatus;
        valid: boolean;
    }

    interface QuotesListResponseItems extends CustomerListResponseItems<QuotesListItem> {
        set2: any[];
    }

    /**
    * Response received after quotes list request
    */
    interface QuotesListResponse extends CustomerListResponse {
        filter: QuotesListFilter;
        items: QuotesListResponseItems;
    }


    /**
    * Payments list element
    */
    interface PaymentsListItem extends CustomerListItem {
        amount: number;
        currency: string;
        daysAfterDueDate: number;
        dueDate: Date;
        paymentForm: string;
        remaining: number;
        type: number;
    }

    /**
    * Filtering options for payments list
    */
    interface PaymentsListFilter extends CustomerListFilterForMajority {
        stateId: number;
        currencyId: number;
        currencyName: string;
        paymentTypeId: number;
    }

    interface PaymentsListResponseItems extends CustomerListResponseItems<PaymentsListItem> {
        set2: {
            amount: number;
            currency: string;
            remaining: number;
        }[];
    }

    /**
    * Response received after payments list request
    */
    interface PaymentsListResponse extends CustomerListResponse {
        items: PaymentsListResponseItems;
    }


    /**
    * Complaints list element
    */
    interface ComplaintsListItem extends CustomerListItem {
        articlesCount: number;
        modificationDate: Date;
        sourceDocuments: ComplaintSourceDocument[];
        state: number;
    }


    /**
     * Source document of complaint list element
     * */
    interface ComplaintSourceDocument {
        id: number;
        type: number;
        number: string;
    }

    /**
    * Filtering options for complaints list
    */
    interface ComplaintsListFilter extends CustomerListFilterForMajority {
        /**
         * when documents
         */
        stateId?: number;

        /**
         * when products
         */
        documentId?: number;
    }

    interface ComplaintsListResponseItems extends CustomerListResponseItems<ComplaintsListItem> {
        set2?: {
            complaintSubmission: boolean;
        }[];
        set3: any[];
    }

    /**
    * Response received after complaints list request
    */
    interface ComplaintsListResponse {
        filter: ComplaintsListFilter;
        items: ComplaintsListResponseItems;
        hasMore: boolean;
    }

    /**
    * Delivery list element
    */
    interface DeliveryListItem extends CustomerListItem {
        articlesCount: number;
        createdDate: Date;
        deliveryAddress: string;
        stateId: number;
        waybill: string;

    }

    /**
    * Filtering options for complaints list
    */
    interface DeliveryListFilter extends CommonCustomerListFilter {
        stateId: number;
        filter: string;
    }


    /**
    * Response received after delivery list request
    */
    interface DeliveryListResponse extends CustomerListResponse {
        items: CustomerListResponseItems<DeliveryListItem>;
    }

    interface Cyclicity {
        hours: string[];

        /**
         * range of days in a month
         * */
        range: number[];

        type: CyclicityType;

        /**
         * number of repetitions in time (e.g., number of days, weeks)
         * */
        value: number;

        /**
         * resources with month names or days of the week
         * */
        values: string[];
    }

    /**
    * Promotion list element
    */
    interface PromotionsListItem {
        comment: string;
        cyclicity: Cyclicity;
        effectiveFrom: string;
        type: PromotionType;
        until: string;
        id: number;
        name: string;
    }


    /**
    * Filtering options for promotion list
    */
    interface PromotionListFilter {
        filter?: string;
        searchText?: string;
    }

    interface PromotionsConfigBase {
        applicationId: number;
        hasMore: boolean;
        showCode: boolean;
        showImages: boolean;
    }

    interface PromotionsConfigResponse extends PromotionsConfigBase {
        cartCount: number;
    }

    interface PromotionsConfig extends PromotionsConfigBase {
        cartCount: number[];
    }

    interface PromotionsListBase {
        set1: PromotionsListItem[];
        hasMore: boolean;
    }

    /**
    * Response received after promotion list request
    */
    interface PromotionsListResponse extends PromotionsListBase {
        set2: PromotionsConfigResponse[];
    }

    interface PromotionsList extends PromotionsListBase {
        set2: PromotionsConfig[];
    }

    /**
    * Pending list element
    */
    interface PendingListItem extends CustomerListItem {
        orderedQuantity: number;
        completedQuantity: number;
        quantityToComplete: number;
        uom: number;

    }

    /**
    * Filtering options for pending list
    */
    interface PendingListFilter extends CustomerListFilterForMajority {
        articleNameFilter: string;
        documentNumberFilter: string;
        documentOwnNumberFilter: string;
    }

    interface PendingListResponseItems extends CustomerListResponseItems<PendingListItem> {
        set2: any[];
    }

    interface PendingListDetails {
        number: number;
    }

    interface ComplaintsListDetails {
        complaintSubmission: boolean;
    }

    /**
    * Response received after pending list request
    */
    interface PendingListResponse extends CustomerListResponse {

        filter: PendingListFilter;
        items: PendingListResponseItems;
    }

    interface ControlFiltersParams {
        getFilter?: boolean;
        updateFilter?: boolean;
        controlDate?: boolean;
    }

    interface CustomerListFilteringOptions {
        //ranges?: { dateFrom?: Date, dateTo?: Date };
        currentFilter: CustomerListFilterForMajority & OrderFilter & InquiryListFilter & QuotesListFilter & PaymentsListFilter & ComplaintsListFilter & DeliveryListFilter & PendingListFilter & ServiceJobsFilter;
        states?: Option3[];

        /**
        * Payments list only
        */
        currency?: Option2[];

        stateKeys?: Option2[];

        /**
        * Complains only
        */
        documents?: Option2[];

        /**
         * Service jobs only
         * */
        statuses?: Option3[];
    }

    interface CustomerDetails {
        address: string;
        city: string;
        creditUsed: number;
        currency: string;
        deliveryMethod: string;
        dueDate: number;
        ein: string;
        email: string;
        fax: string;
        limitAfterDueDate: number;
        maxLimitValuable: number;
        name1: string;
        name2: string;
        name3: string;
        nin: string;
        overduePayments: number;
        paymentForm: string;
        shippingCity: string;
        shippingStreet: string;
        shippingZipCode: string;
        street: string;
        supervisor: string;
        supervisorEmail: string;
        supervisorTelephone: string;
        telephoneNo1: string;
        telephoneNo2: string;
        tin: string;
        www: string;
        zipCode: string;
    }

    interface Employee {
        contactId: number;
        email: string;
        gg: string;
        name: string;
        position: string;
        skype: string;
        skypeUrl: SafeUrl;
        telephoneNo1: string;
        telephoneNo2: string;
    }

    interface CustomerDataResponse {
        outputs: {
            returN_VALUE: number;
        };

        set1: CustomerDetails[];

    }

    interface EmployeesResponse {

        outputs: {
            returN_VALUE: number;
        };

        /**
        * Array of employees
        */
        set1: Employee[];
    }




    interface CustomerListDetails {
        issueDate: string;
        number: string;
        sourceNumber: string;
    }

    interface CustomerListDetailsSummary {
        count: number;
        net: number;
        gross: number;
        currency: string;
    }

    interface InquiryDetails extends CustomerListDetails {
        applicationId: number;
        state: number;
        description: string;
        canRemove?: boolean;

    }


    interface CustomerListDetailsResponse {
        outputs: { returN_VALUE: number };
    }

    interface InquiryDetailsResponse extends CustomerListDetailsResponse {
        set1: any[];
        set2: Attachement[];
        set3: any[];
        set4: InquiryDetails[];
        /**
         * Altum only
         * */
        set5: InquiryListItem[];
    }

    interface InquiryProduct extends InquiryListItem {
        description?: string;
    }

    interface CustomerListProduct extends BaseProduct {

        grossValue: string;
        netValue: string;
        no: number;
        position: number;
        unitConversion: string;
        value: number;
        cartId?: number;
        //fromQuote?: string | null;
        stockLevel: string;
        type: number;
        position: number;
    }


    interface CustomerListProductWithPrice extends CustomerListProduct {
        price: string;
    }

    interface QuoteDetails extends CustomerListDetails {

        cartCount: number[];
        completionEntirely: number;
        createManyOrders: 0 | 1;
        daysAfterOrder: number;
        deliveryMethod: string;
        description: string;
        dueDate: string;
        expectedDate: string;
        expirationDate: string;
        inquiryId: number | null;
        inquiryNumber: string;
        isEditable: boolean;
        number: string;
        paymentForm: string;
        reasonForRejectionId: number;
        reasonForRejectionName: string;
        sourceNumber: string;
        totalWeight: number;
        vatDirection: 'N' | 'B';
        volume: number;
        copyToCartDisabled: boolean;

        state: number;
        quantityDisabled?: boolean;
    }



    interface QuoteDetailsResponse extends CustomerListDetailsResponse {
        set1: any[];
        set2: Attachement[];
        set3: any[];
        set4: QuoteDetails[];
        set5: CustomerListProductWithPrice[];
        set6: CustomerListDetailsSummary[];
    }

    interface OrderHeaderAttribute {
        name: string;
        type: number;
        value: string;
    }

    interface OrderDetails extends CustomerListDetails {
        applicationId: number;
        cartCount: number[];
        completionEntirely: number;
        customer: string;
        deliveryMethod: number;
        description: number;
        dueDate: string;
        expectedDate: string;
        expireDate: string;
        isConfirm: number;
        paymentForm: string;
        removeOrders: boolean;
        showDeliveryCost: boolean;
        state: number;
        vatDirection: 'N' | 'B';
        costValue?: string;
        canRemove?: boolean;
        canConfirm?: boolean;
        street: string;
        city: string;
        zipCode: string;


        /**
         * XL only
         * */
        volume?: number;

        /**
         * XL only
         * */
        totalWeight?: number;
    }

    interface OrderProductResponse extends CustomerListProduct {
        feature: string;
        fromBinary: string;
        hasDetails: number;
        translationFeature: string;
        warehouseId: number;
        discount: number | string;
        currency: string;
        price: string;
    }

    interface OrderProduct extends CustomerListProduct {
        basicUnitPrice: number;
        basicUnit: string;
        price: number;
    }

    interface OrderDetailsResponse extends CustomerListDetailsResponse {
        set1: OrderHeaderAttribute[];
        set2: Attachement[];
        set3: any[];
        set4: OrderDetails[];
        set5: OrderProductResponse[];
        set6: CustomerListDetailsSummary[];

        /**
        * Quotes
        */
        set7: IDs[];
        set8: {
            /**
             * XL only
             * */
            creditLimitMode?: CreditLimitMode;
            /**
             * XL only
             * */
            exceededCreditLimit?: boolean;

            /**
             * Altum only
             * */
            weightGross?: number;

            /**
             * Altum only
             * */
            volume?: number;
        }[];
    }

    interface PaymentDetails extends CustomerListDetails {
        canComplaint: boolean;
        cartCount: number[];
        currency: string;
        deliveryMethod: string;
        description: string;
        isClip: number;
        saleDate: string;
        showOrders: boolean;
        value: number;
        vatDirection: 'N' | 'B';
        vatValue: number;
        printHref?: string;
    }

    interface PaymentProduct extends CustomerListProductWithPrice {
        discount: string;
        fromBinary: string;
        isAvailable: number;
        sourceDocumentId: number;
        sourceDocumentName: string;
        sourceDocumentType: string;
        vatRate: string;
        warehouseId: number;
    }

    interface PaymentSummary {
        amount: number;
        currency: string;
        daysAfterDueDate: string;
        dueDate: string;
        paymentForm: string;
        remaining: number;
    }

    interface PaymentDetailsResponse extends CustomerListDetailsResponse {
        set1: any[];
        set2: Attachement[];
        set3: any[];
        set4: PaymentDetails[];
        set5: PaymentProduct[];
        set6: PaymentSummary[];
        set7: IDs[];
    }


    interface DeliveryDetails {
        number: string;
        createdDate: string;
        deliverer: string;
        deliveryAddress: string;
        description: string;
        state: number;
        volume: number;
        waybill: string;
        weight: number;
        weightUnit: string;
    }

    interface DeliveryProduct {
        auxiliaryUnit: string;
        code: string;
        defaultUnitNo: number;
        fromBinary: string;
        imageId: number;
        isAvailable: number;
        itemId: number;
        name: string;
        quantity: number;
        sourceDocumentId: number;
        sourceDocumentName: string;
        sourceDocumentType: number;
        unitConversion: string;
    }

    interface DeliveryDetailsResponse extends CustomerListDetailsResponse {
        hasMore: boolean;
        items: {
            set1: any[];
            set2: Attachement[];
            set3: any[];
            set4: DeliveryDetails[];
            set5: DeliveryProduct[];
        };
    }

    interface ComplaintDetails extends CustomerListDetails {
        considerationDate: string;
        description: string;
        itemsCount: string;
        modificationDate: string;
        state: number;

        id?: number;
    }

    interface ComplaintCompletion {
        date: string;
        description: string;
        name: string;
        operationId: number;
        state: string;
        id?: number;
    }

    interface ComplaintProduct {
        basicUnit: string;
        code: number;
        completion: ComplaintCompletion;
        id: number;
        imageId: number;
        isAvailable: number;
        itemId: number;
        name: string;
        no: number;
        purchaseDocument: string;
        quantity: number;
        reason: string;
        request: string;
        sourceDocumentId: number;
        sourceDocumentName: string;
        sourceDocumentType: number;
    }

    interface ComplaintDetailsResponse {
        set1: any[];
        set2: any[];
        set3: { id: number, default?: 0 | 1, fromBinary: boolean }[];
        set4: ComplaintDetails[];
        set5: ComplaintProduct[];
        set6: ComplaintCompletion[];
    }

    interface PromotionProductBase {
        basicUnit: string;
        code: string;
        currency: string;
        id: number;
        imageId: number;
        name: string;
        threshold: number;
        type: number;
        value: number;
        vatDirection: 'N' | 'B';
        status: ProductStatus;
        auxiliaryUnit: string;
        basicUnit: string;
        defaultUnitNo: number;
        denominator: number;
        numerator: number;
        discountAllowed: boolean;
        isUnitTotal: 0 | 1;
        unitLockChange: 0 | 3;

        /**
         * 0 - product
         * 1 - group
         * */
        promotionPositionType: 0 | 1;

    }


    interface PromotionProductResponse extends PromotionProductBase {
        /**
         * XL: 0 | 1
         * Altum: boolean
         * */
        itemExistsInCurrentPriceList: 0 | 1 | boolean;
    }

    interface PromotionProductConvertedResponse extends PromotionProductBase {
        itemExistsInCurrentPriceList: 0 | 1;
    }

    interface PromotionProduct extends PromotionProductConvertedResponse {
        cartId: number;
        quantity: number;
        unitId: number;
        converter: string;
        units: Map<number, b2b.UnitMapElement>;
        basicUnitNo: number;
    }


    interface PromotionDetailsResponseBase<T> extends CustomerListDetailsResponse {
        items: {
            set1: T;
            set2: { haveAccess: boolean }[];
        };
        paging: PaginationResponse;

    }



    type PromotionDetailsResponse = PromotionDetailsResponseBase<PromotionProductResponse[]>;

    type PromotionDetailsResponseConverted = PromotionDetailsResponseBase<PromotionProductConvertedResponse[]>;


    interface PromotionDetailsDefaultParams {
        groupId: string;
        filter: string;
        isNameFiltered: string;
        isCodeFiltered: string;
        isProducerFiltered: string;
        isDescriptionFiltered: string;
        isBrandFiltered: string;
        brandId: string;
        warehouseId: number;
        onlyAvailable: string;
        filterInGroup: string;
        features: string;
        attributes: string;
        getFilter: string;
        updateFilter: string;
    }


    interface ComplaintFormProduct {
        auxiliaryUnit: string;
        basicQuantity: number;
        basicUnit: string;
        code: string;
        currency: string;
        defaultUnitNo: number;
        discount: number;
        imageId: number;
        isAvailable: number;
        isUnitTotal: number;
        itemId: number;
        name: number;
        price: number;
        quantity: number;
        sourceDocumentId: number;
        sourceDocumentName: string;
        sourceDocumentNo: number;
        sourceDocumentType: number;
        subtotalValue: number;
        totalValue: number;
        unitConversion: string;
        vatDirection: 'N' | 'B';
        max?: number;
        value?: number;
    }

    interface ComplaintFormConfig {
        itemsCount: number;
    }

    interface ComplaintFormDetails {

        outputs: { returN_VALUE: number };
        set1: ComplaintFormProduct[];
        set2: ComplaintFormConfig[];

    }

    interface ComplainData {
        Description: string;
        SourceNumber: string;
        products: {
            ArticleId: number;
            Quantity: number;
            Reason: string;
            Request: number;
            SourceDocumentId: number;
            SourceDocumentNo: number;
            SourceDocumentTypeId: number;
        }[];
    }

    interface ComplaintResponse {
        outputs: { returN_VALUE: number };
        set1: IDs[];
    }

    interface ConfirmOrderResponse {
        isConfirmed: boolean;
        exceededCreditLimit: false;
        isWarning: false;
    }


    interface PremissionsResponseBase {
        hasAccessToCreateInquiries: boolean;
        hasAccessToEditQuantityInQuotes: boolean;
        hasAccessToCreateComplaints: boolean;
        hasAccessToPrinting: boolean;
        hasAccessToConfirmOrder: boolean;
        hasAccessToChangeDeliveryMethod: boolean;
        hasAccessToChangePaymentMethod: boolean;
        hasAccessToPriceList: boolean;
        hasAccessToDeleteUncofirmedOrder: boolean;
        hasAccessToComplaintsList: boolean;
        hasAccessToMarkOrderToEntirelyRealization: boolean;
        hasAccessToCustomerData: boolean;
        hasAccessToShowDeliveryMethod: boolean;
        hasAccessToPackagesList: boolean;
        hasAccessToInquiriesList: boolean;
        hasAccessToOrdersList: boolean;
        hasAccessToPaymentsList: boolean;
        hasAccessToQuotesList: boolean;
        hasAccessToReservationList: boolean;
        hasAccessToTargetPartner: boolean;
        hasAccessToNews: boolean;
        hasAccessToPackagesList: boolean;
        hasAccessToEmployeesList: boolean;
        hasAccessToAttachmentsList: boolean;
        hasAccessToChangePaymentDateTime: boolean;
        hasAccessToCartImport: boolean;
        hasAccessToServiceJobs: boolean;
    }

    interface PermissionsResponseAfterUnification extends PremissionsResponseBase {
        hasAccessToArticleList: boolean;
        hasAccessToPromotionList: boolean;
        hasAccessToChangeRealizationTime: boolean;
        hasAccessToChangeOrderWarehouse: boolean;
        hasAccessToChangeDefaultWarehouse: boolean;
        hasAccessToCart: boolean;
        hasAccessToDiscount: boolean;
    }

    interface PermissionsResponseBeforeUnification extends PremissionsResponseBase {

        /**
         * XL only
         */
        hasAccessToPromotionList?: boolean;

        /**
         * XL only
         */
        hasAccessToChangeRealizationTime?: boolean;

        /**
         * XL only
         */
        hasAccessToChangeOrderWarehouse?: boolean;

        /**
         * XL only
         */
        hasAccessToChangeDefaultWarehouse?: boolean;


        /**
         * XL only
         */
        hasAccessToArticleList: boolean;


        /**
        * XL only
        */
        hasAccessToCart: boolean;

        /**
        * XL only
        */
        hasAccessToDiscount: boolean;


        /**
         * Altum only
         */
        hasAccessToPromotions?: boolean;

        /**
         * Altum only
         */
        hasAccessToChangeOrderRealizationDate?: boolean;


        /**
         * Altum only
         */
        hasAccessToWarehouseChange?: boolean;


        /**
         * Altum only
         */
        hasAccessToArticleCatalog?: boolean;


        /**
        * Altum only
        */
        hasAccessToCarts?: boolean;


        /**
        * Altum only
        */
        hasAccessToRebate?: boolean;

        /**
        * Altum only
        */
        hasAccessToEditQuantityInQuote?: boolean;
    }


    interface Permissions extends PermissionsResponseAfterUnification {
        hasAccessToProfile: boolean;
    }

    interface CustomerConfig {
        showCode: boolean;
        showState: boolean;
        stateMode: StockLevelMode;
        calculateDiscount: boolean;
        priceMode: PriceMode;
        showFeatures: boolean;
        showImages: boolean;
        stateAvailableColor: string;
        stateNoneColor: string;

        /**
         * Altum - number of decimal places
         * XL - 1 if 2 places, 0 if 4 places
         * */
        precision: number;

        pageSize: number;
        warehouseId: number;
        warehouseName: string;
        aboveAvailableStockLevel: number;
        companyUnitId: number;
        conditionWarehouseNumber: number;
        operatorContext: false;
        orderBlock: 0 | 1;
        promotionPar: number;
        stockFunctionXl: boolean;
        sysCurrency: string;
        tolerance: number;
        wfL_SupportProcesses: number;
        onlyEntirelyCompletion: boolean;

        /**
         * XL only
         * */
        withoutKgo: 0 | 1;

        /**
         * XL only
         * */
        priceCalculatedDiscount: boolean;

        /**
         * XL only
         * */
        companyUnitPath: any;

        /**
         * XL only
         * */
        numberOfAllowedSignsOnCartOwnNumber: number;

    }

    interface CustomerConfigResponse extends CustomerConfig {
        rights: PermissionsResponseBeforeUnification;
    }

    interface UnitConverter {
        denominator: number;
        numerator: number;
        basicUnit: string;
        auxiliaryUnit: string;
    }

    interface RemindData {
        customerName: string;
        userName: string;
        companyGroupId: number;
    }


    interface ResetPwdData {
        password: string;
        repeatPassword: string;
        hash: string;
    }

    interface LoginData extends RemindData {
        password: string;
        rememberMe: boolean;
        loginConfirmation: boolean;
    }

    interface Company {
        GroupId: number;
        Name: string;
        CompanyUnitId: number;
        SubCompanyUnitId: number;
    }

    interface Language {
        Id: number;
        Name: string;
        ErpId: string;
        LanguageCode: string;
        IsDefault: boolean;
    }

    /**
     * Columns config for dynamically generated data tables
     * */
    interface ColumnConfig {

        /*
         * Property name of displayed value
         */
        property?: string;

        /**
         * Translation key, if it is different than property name
         * */
        translation?: string;

        /**
         * Type of column, if it is rendered in a special way.
         * Eg. price is rendered with toPrice pipe, quantity is rendered with unit and unit converter.
         * */
        type?: 'productName'
        | 'productNameWithoutPhoto'
        | 'remove'
        | 'price'
        | 'priceWithConverter'
        | 'priceWithCurrency'
        | 'quantity'
        | 'quantityWithStepper'
        | 'unit'
        | 'addToCart'
        | 'linkedDocumentsArray'
        | 'linkedDocument'
        | 'complain'
        | 'daysAfterDueDate'
        | 'html'
        | 'cases'
        | 'complaintHistory'
        | 'promotionValue'
        | 'percent'
        | 'fileName'
        | 'translation'
        | 'dateWithTime'
        | 'valueWithUnit'
        | 'quoteRealizationWithEmptyContent'
        | 'noValueSymbol';

        /**
         * Link structure for linked documents. Required for 'linkedDocument' and 'linkedDocumentsArray' types.
         * */
        link?: {
            type?: 'routerLink' | 'href', //routerLink default
            hrefCreator?: Function;
            labelProperty?: string;
            labelResource?: string;
            labelIcon?: string;
        };

        /**
         * Property name of basic price. Required for 'priceWithConverter' type.
         * */
        priceConverter?: string;

        /**
         * Required if property name in table summary differs from the property name in table body.
         * */
        summaryProperty?: string;

        /**
         * Required for case type
         * */
        cases?: { case: any, translation: string }[];

        /**
         * Applies filter to column. Works only for documents list.
         */
        filter?: {
            property: string;

            type: 'text' | 'select' | 'date';

            /**
            * Method which request filter values.
            * */
            valuesLoader?: Function;

            /**
             * Property name of filter values. Required for select type.
             * */
            valuesProperty?: string;


            defaultValue?: any;
        };

        /**
         * Property of file extension. Required for fileName type.
         * */
        extensionProperty?: string;

        /**
         * Sets class when value equals qiven value
         * */
        classCondition?: {
            valueEquals: any;
            class: string;
        };

        /**
         * Unit property for valueWithUnit type
         * */
        unitProperty?: string;
    }

    interface ForbiddenProductInfo {

        /**
         * position, started from 1
         * */
        cartPosition: number;

        articleId: number;
    }

    type RouteKey = 'home'
        | 'items'
        | 'itemDetails'
        | 'cart'
        | 'promotions'
        | 'login'
        | 'remind'
        | 'remindPassword'
        | 'resetPassword'
        | 'fileImportResult'
        | 'profile'
        | 'thankYou'
        | 'orders'
        | 'myData'
        | 'quotes'
        | 'inquiries'
        | 'payments'
        | 'complaints'
        | 'delivery'
        | 'orderDetails'
        | 'paymentDetails'
        | 'quoteDetails'
        | 'inquiryDetails'
        | 'complaints'
        | 'complaintItems'
        | 'complaintForm'
        | 'complaintDetails'
        | 'deliveryDetails'
        | 'employees'
        | 'pending'
        | 'files'
        | 'news'
        | 'newsDetails'
        | 'serviceJobs'
        | 'serviceJobDetails'
        | 'contact' //JD
        | 'businessterms'; // JD



    interface RouteWithKey extends Route {
        key?: RouteKey;
        children?: RouteWithKey[];
    }

    interface LoginConfirmationData {
        IsLoginConfirmationRequired: boolean;
        LoginConfirmationResourceKey: string;
    }

    interface ImportFromCsvResponse {
        responseEnum: CsvParserResponseEnum;
        lineSummary: ImportFromCsvLineSummary[];
        atLeastOneProductImported: boolean;
        atLeastOneWarning: boolean;
        atLeastOneError: boolean;
    }

    interface ImportFromCsvLineSummary {
        lineNumber: number;
        code: string;
        unit: string;
        lineWarnings: CsvLineWarningEnum[];
        lineError: CsvLineErrorEnum;
        productLineFinalStates: ImportFromCsvFinalLineStates[];
    }

    interface ImportFromCsvFinalLineStates {
        productId: number;
        finalState: CsvProductFinalEnum;
    }



    interface CopyOrderToCartRequest {
        documentId: number;
        cartId: number;
        pageId: number;
    }

    interface CopyPaymentToCartRequest extends CopyOrderToCartRequest {
        documentTypeId: number;
    }

    interface CopyQuoteToCartRequest extends CopyOrderToCartRequest {
        sourceNumber: string;
        stateId: number;
    }

    interface CopyToCartRequest extends CopyOrderToCartRequest, Partial<CopyPaymentToCartRequest>, Partial<CopyQuoteToCartRequest> {

    }

    interface EmptyListInfoElement {
        resx: string;
        svgId: string;
    }


    interface CustomerFile {
        crationTime: string;
        extension: string;
        hashOrUrl: string;
        id: number;
        isUrl: boolean;
        modificationtime: string;
        name: string;
    }


    interface CustomerFilesFilter {
        creationDate: string;
        modificationDate: string;
        fileName: string;
    }

    interface NewsListItem {
        title: string;
        category: string;
        image: {
            id: number;
            height: number;
            width: number;
        };
        id: number;
        creationDate: string;
    }


    interface NewsDetailsResponseAttachment {
        id: number;
        hashOrUrl: string;
        isUrl: boolean;
        name: string;
        extension: string;
    }

    interface NewsDetailsAttachment extends NewsDetailsResponseAttachment {
        url: string;
    }

    interface NewsDetailsBase {
        title: string;
        category: string;
        image: {
            id: number;
            height: number;
            width: number;
        };
        id: number;
        creationDate: string;
    }

    interface NewsDetailsResponse extends NewsDetailsBase {
        attachemnts: NewsDetailsResponseAttachment[];
        content: string;
    }

    interface NewsDetails extends NewsDetailsBase {
        attachemnts: NewsDetailsAttachment[];
        content: SafeHtml;
    }

    interface ServiceJobListElement {
        id: number;
        documentNumber: string;
        myDocumentNumber: string;
        creationDate: string;
        realizationDate: string;
        stateResourceKey: string;
        status: string;
        plannedEndDate: string;
    }

    interface ServiceJobsFilter extends CommonCustomerListFilter {
        documentNumber: string;
        myDocumentNumber: string;
        stateId: number;
        statusId: number;
    }


    interface NewListResponse<T, K> {
        [K]: T[];
        paging: PaginationConfig;
    }

    type ServiceJobsResponse = NewListResponse<ServiceJobListElement, 'serviceJobs'>;

    interface Image {
        id: number;
        default: 0 | 1;
    }

    interface DeviceResponse {
        /**
         * id of row, NOT product!
         * */
        id: number;

        position: number;
        code: string;
        name: string;
        type: string;
        description: string;
        mileage: number;
        mileageUnit: string;
        group: string;

        /**
         * id of product
         * */
        number: number;

        haveElements: true;
        isArticle: boolean;
    }


    interface Serviceman {
        id: number;
        firstName: string;
        secondName: string;
        surname: string;
        telephone: string;
        email: string;
    }

    interface SparePart {
        imageId: number;
        id: number;
        position: number;
        description: string;
        costType: number;
        quantity: number;
        priceAfterRebate: number;
        valueAfterRebate: number;
        rebate: number;
        currency: string;
        itemNumber: number;
        itemName: string;
        itemType: number;
    }

    interface ServiceJobDeviceActionDetails {
        serviceman: Serviceman[];
        parts: SparePart[];
        id: number;
        position: number;
        completed: number;
        description: string;
        costType: number;
        quantity: number;
        priceAfterRebate: number;
        valueAfterRebate: number;
        rebate: number;
        currency: string;
        itemName: string;
        itemNumber: number;
        itemType: number;
        status: string;
        dateFrom: string;
        dateTo: string;
    }


    interface ServiceJobDeviceActionResponse {
        id: number;
        position: number;
        completed: 0 | 1;
        description: string;
        costType: number;
        quantity: number;
        priceAfterRebate: number;
        valueAfterRebate: number;
        rebate: number;
        currency: string;
        itemName: string;
        itemNumber: number;
        itemType: number;
        status: string;
        dateFrom: string;
        dateTo: string;
        vatValue: number;
    }

    interface ServiceJobDeviceAction extends ServiceJobDeviceActionResponse {

        /**
         * Notice: property is lazy loaded on demand
         * */
        details?: ServiceJobDeviceActionDetails;
    }

    interface Device extends DeviceResponse {

        /**
         * Notice: property is lazy loaded on demand
         * */
        actions?: ServiceJobDeviceAction[];
    }


    interface NewCustomerListDetails {
        attachments: Attachement[];
        images: Image[];
        description: string;
        documentNumber: string;
        myDocumentNumber: string;
        creationDate: string;
        stateResourceKey: string;
        id: number;
    }

    interface ServiceJobDetailsBase extends NewCustomerListDetails {
        contractorName: string;
        contractorStreet: string;
        contractorPostalCode: string;
        contractorCity: string;
        paymentForm: string;
        paymentDate: string;
        attributes: ProductAttribute[];
        proceeds: number;
        realizationDate: string;
        status: string;
        plannedEndDate: string;
        printHref?: string;
    }

    interface ServiceJobDetailsResponse extends ServiceJobDetailsBase {
        devices: DeviceResponse[];
    }


    interface ServiceJobDetails extends ServiceJobDetailsBase {
        devices: Device[];
    }

    interface ServiceJobPayment {
        id: number;
        documentNumber: string;
        currency: string;
        netValue: number;
        date: string;
        type: number;
    }


    /**
    * Adding to cart request params.
    */
    interface AddToCartRequest {
        cartId: number;
        warehouseId: number;
        items: AddToCartRequestItem[];
    }

    interface AddToCartRequestItem {
        articleId: number;
        quantity: number;
        unitDefault: number;
    }

    interface AddToCartResponse {
        addToCartResponseEnum: AddToCartResponseEnum;
    }
}



