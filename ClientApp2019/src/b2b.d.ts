import { AttributeType } from './app/model/enums/attribute-type.enum';
import { CartOptionType } from './app/model/enums/cart-option-type.enum';
import { DisplayType } from './app/model/enums/display-type.enum';
import { PaginationRepo } from './app/model/shared/pagination-repo';
import { RightXL } from './app/model/enums/right-xl.enum';
import { RightAltum } from './app/model/enums/right-altum.enum';
import { Route } from '@angular/router';
import { PriceMode } from './app/model/enums/price-mode.enum';
import { CsvLineErrorEnum } from './app/model/enums/csv-line-error-enum.enum';
import { CsvLineWarningEnum } from './app/model/enums/csv-line-warning-enum.enum';
import { CsvParserResponseEnum } from './app/model/enums/csv-parser-response-enum.enum';
import { CsvProductFinalEnum } from './app/model/enums/csv-product-final-enum.enum';

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
        set4: { rightId: RightXL & RightAltum }[];
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
        key?: string;

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
    interface ItemsRequest extends RequestParams {
        cartId: string;
        groupId: string;
        filter: string;
        warehouseId: string;
        onlyAvailable: string;
        isGlobalFilter: string;
        filterInGroup: string;
        features: string;
        attributes: string;
        skip: string;
        top: string;
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
        //JD
        calculateDiscount?: boolean;
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

    /**
    * Warehouse option object
    */
    interface Warehouse {
        id: string;
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

        pageSize?: number;
        currentPage?: number;
        isPrevPage?: boolean;
        isNextPage?: boolean;

    }

    interface PaginationRequestParams {
        skip: string;
        top: string;
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

    /**
    * Response received after getting product's list request.
    */
    interface ProductsResponse {

        /**
        * True if there is next page.
        */
        hasMore: boolean;

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

    }



    /**
    * Array of units received in response
    */
    interface UnitResponse {
        id: number;
        no: number;
        unit: string;
    }

    /**
    * Response after async recalculation of single product prices
    */
    interface PricesResponse {
        outputs?: { returN_VALUE: number };
        set1: AsyncPricesData[];
    }

    interface AsyncPricesData {
        grossPrice: string;
        netPrice: string;
        currency: string;
        stockLevel: string;
        type: number;
        itemExistsInCurrentPriceList: boolean;
        denominator: number;
        numerator: number;
        defaultUnitNo: number;
        isUnitTotal: 0 | 1;
        basicUnit: string;

        /*
         * XL only
         */
        baseGrossPrice?: number;
        /*
         * XL only
         */
        baseNetPrice?: number;
        /*
         * XL only
         */
        basePriceNo?: number;
        /*
         * XL only
         */
        purchasePrice?: number;

        /*
         * Altum only
         */
        precision?: number;
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

        unitLockChange: number;
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
        warehouseId: string;
    }

    /**
    * Response received after unit conversion
    */
    interface UnitData {
        basicUnit?: string;
        auxiliaryUnit?: string;
        isUnitTotal?: 0 | 1;
        netPrice?: string;
        grossPrice?: string;
        type?: number;
        denominator?: number;
        numerator?: number;
        stockLevel?: string;
        unitPrecision?: number;
        currency?: string;
        volume?: number;
        bruttoWeight?: number;
        nettoWeight?: number;
        subtotalBasicPrice?: number;
        totalBasicPrice?: number;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey?: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey?: string;
    }


    interface UnitMapElement {
        basicUnit?: string;
        auxiliaryUnit?: string;
        isUnitTotal?: 0 | 1;
        netPrice?: string;
        grossPrice?: string;
        type?: number;
        denominator?: number;
        numerator?: number;
        stockLevel?: string;
        unitPrecision?: number;
        currency?: string;
        converter?: string;
        max?: number;
        volume?: number;
        bruttoWeight?: number;
        nettoWeight?: number;
        purchasePrice?: number;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey?: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey?: string;

        subtotalBasicPrice?: number;
        totalBasicPrice?: number;
    }

    interface ProductListElement extends ProductListElementResponse, Partial<UnitMapElement>, Partial<AsyncPricesData> {

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
    * Adding to cart request params.
    */
    interface AddToCartRequest {

        /**
        * Cart id.
        */
        id: number;

        /**
        * Product index (aka. no)
        */
        itemId?: number;

        /**
        * Product id
        */
        articleId: number;

        quantity: number;
        warehouseId: string;
        features?: string;
        fromQuote?: string; // must be string, otherwise the server return 500
        unitDefault: number;
        calculateDiscount?: boolean;
    }


    interface AddManyToResponseItem {
        success: boolean;
        id: numbe;
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
    interface CartProduct extends ProductToBuy {
        defaultUnitNo: number;
        isUnitTotal: 0 | 1;
        denominator?: number;
        numerator?: number;
        discount: string;
        fromQuote: number;
        itemId: number;
        no: number;
        totalPrice: string;
        subtotalPrice: string;
        totalValue: string;
        subtotalValue: string;
        vatDirection: 'N' | 'B';
        unit: string;
        stockLevel: string;
        type: number;
        price: string;

        /** XL only
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exceededStates?: boolean;

        /** Altum only
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exeededStates?: boolean;

        quantityChanged: boolean;

        index: number;

        disabled?: boolean;
        dontControl?: boolean;
        setDocumentsType?: number;
        //????
        bundleId: number;
        bundleCode: string;
        bundleQuantity: number;

        totalBasicPrice?: number;
        subtotalBasicPrice?: number;
        forbidden?: boolean;
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
        warehouseId?: string;
        warehouseName?: string;

        /**
         * XL only.
         * For Altum - set7
         * */
        warehouseChangeEnabled?: boolean;




    }

    /**
    * Request params when updating cart options.
    */
    interface UpdateHeaderRequest {
        cartId: string;

        /**
        * CartOptionType enum casted to string
        */
        changedField: string;

        addressId: string;
        completionEntirely: 0 | 1;
        receiptDate: string;
        description: string;
        descriptionSI: string;
        deliveryMethod: string;
        sourceNumber: string;
        sourceNumberSI: string;
        paymentFormId: string;
        paymentDate: string;
        warehouseId: string;
        skip: string;
        take: string;
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

    /**
    * Object including selected cart options.
    * Object is handy for updating model.
    */
    interface CartOptions {
        completionEntirely?: 0 | 1;
        shippingAddress?: Option;
        deliveryMethod?: DeliveryMethod;
        warehouse?: Warehouse;
        paymentForm?: Option2;
        receiptDate: Date;
        description: string;
        sourceNumber: string;
        dueDate: Date;

        //only requests
        descriptionSI?: string;
        sourceNumberSI?: string;
    }


    /**
    * Response received after getting cart request.
    */
    interface CartProductsResponse {
        hasMore: boolean;

        items: {
            outputs: { returN_Value: number };

            /**
            * Product's list.
            * Contains products from selected page.
            */
            set1?: CartProduct[];

            /**
            * Cart's settings.
            */
            set2: CartConfig[];

            /**
            * Selected options and few settings.
            */
            set3?: CartHeader[];

            /**
            * Header attributes
            */
            set4?: any[];

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
        };
    }

    /**
    * Product data received after product quantity change.
    * Object is part of the change quantity response.
    */
    interface CartProductChanged {

        //response
        denominator: number;
        getDeliveryConst: boolean;
        numerator: number;
        vatDirection: 0 | 1;
        totalPrice: string;
        subtotalPrice: string;
        totalValue: string;
        subtotalValue: string;
        discount: string;

        /**
         * [NOTICE!!] The property specifies exceeded states PER ENTIRE CART.
         * */
        exceededStates: boolean;

        //aditional
        price: string;
        quantity: number;
        bundleId: any; //???

        alertedItems: { //??
            itemId: number
        }[];
    }

    /**
    * Response received after changing product quantity
    */
    interface CartQuantityResponse {

        /**
        * Product updated data.
        */
        set1: CartProductChanged[];

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
    * Combined object including response params and request params for updating header attribute.
    */
    interface CartHeaderAttribute {

        /**
        * request and response parameter
        */
        attributeClassId: number;

        /**
        * request and response parameter
        */
        type: AttributeType;



        /**
        * response parameter
        */
        format?: string;

        /**
        * response parameter
        */
        name?: string;

        /**
        * response parameter
        */
        required?: number;

        /**
        * response parameter
        */
        traslateName?: string;



        /**
        * request parameter
        */
        itemId: 0;

        /**
        * request parameter
        */
        value?: number;

        /**
        * request parameter
        */
        headerId?: number;

        /**
        * request parameter
        */
        documentId?: number;

        /**
        * request parameter
        */
        applicationId?: number;

    }


    /**
    * Response after update header data (update selected options or description).
    */
    interface CartHeaderUpdateResponse {
        0: {
            outputs: {
                returN_VALUE: number;
            };

            /**
            * Summaries grouped by currency or updated stock levels.
            * Summaries calculation includes all of products. (All pages).
            * Stock levels also received for all products from all pages.
            */
            set1: CartSummary[] & UpdatedStockLevel[];

            /**
            * Credit info or header info.
            * exceededStates - XL
            * exeededStates - Altum
            */
            set2: ({
                creditLimit: number;
                customerCurrency: string;
            } & CartHeader & { exceededStates: boolean } & { exeededStates: boolean })[];

            /**
            * (Weight and volume) or cart header
            */
            set3: CartWeight[] & (CartHeader & { exceededStates: boolean })[];
        };

        1: {
            outputs: {
                returN_VALUE: number;
            };

            /**
            * Some product's info
            */
            set1: any[];

            //??
            set2: any[];

            /**
            * Some header info
            */
            set3: (CartHeader & { exceededStates: boolean })[];
        };
    }

    interface UpdatedStockLevel {
        fromQuote: 0 | 1;
        isUnitTotal: 0 | 1;
        itemId: number;
        stockLevel: string;
        type: number;
        max?: number;
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
        items: {
            outputs: {
                returN_VALUE: number;
            };

            /**
            * Array of products.
            * Array contains only products from selected page.
            */
            set1: CartProduct[];

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

        };
    }

    interface CheckUnitsResponse {
        outputs: { returN_VALUE: number };
        set1: {
            code: any
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
    interface ProductRequestParams extends RequestParams {
        cartId: string;
        unitNo?: string;
        warehouseId?: string;
        features?: string;
    }

    /**
    * Response object received after loading product request.
    */
    interface ProductResponse {
        outputs: { returN_VALUE: number };

        /**
        * Header data, details of product.
        */
        set1: ProductDetailsInfo[];

        /**
        * Displaing configuration.
        */
        set2: ProductConfig[];

        /**
        * Attributes.
        */
        set4: ProductDetailsAttribute[];

        /**
        * Attachments.
        */
        set5: ProductAttachement[];

        /**
        * Images.
        */
        set6: {
            id: number,

            /**
             * altum only
             * */
            fromBinary?: boolean;
        }[];

        /**
        * Replacements.
        */
        set7: ProductReplacement[];

        set8: { blank: number }[];

        set9: { haveAccess: boolean }[];
        set10: { isAccessible: boolean, itemExistsInCurrentPriceList: boolean }[];

        /**
         * XL - discountPermission
         * ALTUM - changeWarehouseEnabled
         * */
        set11: { discountPermission: boolean }[] & { changeWarehouseEnabled: boolean }[];

        /**
         * XL only
         * */
        set12: { changeWarehouseEnabled: boolean }[];
    }

    /**
    * Details of product.
    * Description, manager, manufacturer, etc.
    */
    interface ProductDetailsInfo {
        articleUrl: string;
        articleGroupId: number;
        basicUnit: string;
        brand: string;
        code: string;
        currency: string;
        defaultUnitNo: number;
        description: string;
        grossPrice: string;
        isUnitTotal: 0 | 1;
        manager: string;
        managerMail: string;
        manufacturer: string;
        manufacturerUrl: string;
        name: string;
        netPrice: string;
        stockLevel: string;
        type: number;
        bruttoWeight?: number;
        nettoWeight?: number;
        volume?: number;
        discountAllowed?: boolean;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey?: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey?: string;

        /**
         * Product promotional flags as bitwise flag
         * */
        flag: number;

        vatRate: number;
        wmc: number;

        units?: Map<number, UnitMapElement>;
        featuresParam?: string;
        max?: number;
        id?: number;
        cartId?: number;
        quantity?: number;
        unitId?: number;
        converter?: string;
        auxiliaryUnit?: string;
        denominator?: any;
        numerator?: any;
        unitChange?: boolean;
        unitPrecision?: any;

        /**
         * XL only
         * */
        unitLockChange?: 0 | 1;

        fromBinary?: any;
        state?: string;
        quantityPrecision?: any;
        unitsLoaded?: boolean;

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

        subtotalBasicPrice?: number;
        totalBasicPrice?: number;
    }

    /**
    * Displaing configuration.
    */
    interface ProductConfig {
        applicationId: number;
        cartCount: number | number[];
        warehouseId: string;
        warehouseName: string;
        showHowMany?: boolean;
    }

    /**
    * Product attribute
    */
    interface ProductDetailsAttribute {
        type: number;
        name: string;
        value: string;
    }

    /**
    * Product replacement
    */
    interface ProductReplacement {
        basicUnit: string;
        code: string;
        currency: string;
        defaultUnitNo: number;
        forHowMuch: number;
        grossPrice: string;
        howMuch: string;
        id: number;
        imageId: number;
        isUnitTotal: number;
        name: string;
        netPrice: string;
        stockLevel: string;
        type: number;
        discountAllowed?: boolean;

        max?: number;
        unitId?: number;
        units?: Map<number, UnitMapElement>;
        unitChange?: boolean;
        quantityPrecision: any;
        fromBinary: any;
        quantity?: number;
        cartId?: number;
        converter?: string;
        unitsLoaded?: boolean;
        unitPrecision?: any;
        unitLockChange?: number;
        auxiliaryUnit?: string;

        subtotalBasicPrice?: number;
        totalBasicPrice?: number;
    }

    /**
    * File attachment object on product details.
    */
    interface ProductAttachement {
        id: number;
        name: string;
        extension: string;
        size: number;
    }


    /**
    * Filtering options for user lists (orders, inquiries itp)
    */
    interface ListFilter {
        filter: string;
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

        /**
        * true if there is next page
        */
        hasMore: boolean;
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
    interface CustomerListFilter {
        dateFrom: Date;
        dateTo: Date;
        //filter: string;
        number: string;
        sourceNumber: string;
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
    interface OrderFilter extends CustomerListFilter {
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
    interface InquiryListFilter extends CustomerListFilter {
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
    }

    /**
    * Filtering options for quotes list
    */
    interface QuotesListFilter extends CustomerListFilter {
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
    interface PaymentsListFilter extends CustomerListFilter {
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
        sourceDocuments: {
            id: number;
            type: number;
            number: string;
        }[];
        state: number;

    }

    /**
    * Filtering options for complaints list
    */
    interface ComplaintsListFilter extends CustomerListFilter {
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
    interface ComplaintsListResponse extends CustomerListResponse {
        filter: ComplaintsListFilter;
        items: ComplaintsListResponseItems;
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
    interface DeliveryListFilter extends CustomerListFilter {
        stateId: number;
    }


    /**
    * Response received after delivery list request
    */
    interface DeliveryListResponse extends CustomerListResponse {
        items: CustomerListResponseItems<DeliveryListItem>;
    }



    /**
    * Promotion list element
    */
    interface PromotionListItem {
        comment: string;
        isCyclic: boolean;
        id: number;
        name: string;
        // JD
        effectiveFrom: any;
        until: any;
        validInHoursFrom: any;
        validInHoursTo: any;
    }

    /**
    * Filtering options for promotion list
    */
    interface PromotionListFilter {
        filter?: string;
        searchText?: string;
    }


    /**
    * Response received after promotion list request
    */
    interface PromotionListResponse extends CustomerListResponse {
        applicationId: number;
        filter: PromotionListFilter;
        items: CustomerListResponseItems<PromotionListItem>;
    }

    /**
    * Pending list element
    */
    interface PendingListItem extends CustomerListItem {
        orderedQuantity: number;
        completedQuantity: number;
        quantityToComplete: number;
        uom: number;
        //JD
        numberWm: string;
        numberWz: string;
        quantityWm: number;

    }

    /**
    * Filtering options for pending list
    */
    interface PendingListFilter extends CustomerListFilter {
        searchText?: string;
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
        currentFilter: CustomerListFilter & OrderFilter & InquiryListFilter & QuotesListFilter & PaymentsListFilter & ComplaintsListFilter & DeliveryListFilter & PendingListFilter;
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
    }


    interface CustomerAttachment {
        extension: string;
        id: number;
        name: string;
        size: number;
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

        set1: any[];

        /**
        * Files in customer profile
        */
        set2: CustomerAttachment[];

        set3: any[];

        /**
        * Customer details. The property is one-element array
        */
        set4: CustomerDetails[];

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
        set2: ProductAttachement[];
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
        price: string;
        unitConversion: string;
        value: number;
        cartId?: number;
        fromQuote?: string | null;
        stockLevel: string;
        type: number;
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
        set2: ProductAttachement[];
        set3: any[];
        set4: QuoteDetails[];
        set5: CustomerListProduct[];
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

    interface OrderProduct extends CustomerListProduct {
        feature: string;
        fromBinary: string;
        hasDetails: number;
        translationFeature: string;
        warehouseId: string;
        discount: number | string;
        basicPrice?: number;
        basicUnit?: string;
        currency: string;
    }

    interface OrderDetailsResponse extends CustomerListDetailsResponse {
        set1: OrderHeaderAttribute[];
        set2: ProductAttachement[];
        set3: any[];
        set4: OrderDetails[];
        set5: OrderProduct[];
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
        //JD
        wydanie?: string;
        zamowienie?: string;
    }

    interface PaymentProduct extends CustomerListProduct {
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
        set2: ProductAttachement[];
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
        //JD
        kierowca: string;
        dostawa: any;
        telefon: string;
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
            set2: ProductAttachement[];
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
        set3: any[];
        set4: ComplaintDetails[];
        set5: ComplaintProduct[];
        set6: ComplaintCompletion[];
    }

    interface PromotionDetails extends CustomerListDetails {
        applicationId: 0;
        cartCount: number[];
        comment: string;
        cyclic: number;
        effectiveFrom: any;
        name: string;
        until: any;
        validInHoursFrom: string;
        validInHoursTo: string;
        // JD
        calculateDiscount?: boolean;
        deliveryMethods?: PromotionDeliveryMethod
    }

    interface PromotionProduct {
        basicUnit: string;
        code: string;
        currency: string;
        id: number;
        imageId: number;
        isUnitTotal: number;
        name: string;
        threshold: number;
        type: number;
        value: number;
        vatDirection: 'N' | 'B';
        cartId?: number;
        quantity?: number;
        status: ProductStatus;
    }

    //JD
    interface PromotionDeliveryMethod {
        no: number;
        name: string;
    }


    interface PromotionDetailsResponse extends CustomerListDetailsResponse {
        hasMore: boolean;
        items: {
            set1: any[];
            set2: ProductAttachement[];
            set3: any[];
            set4: PromotionDetails[];
            set5: PromotionProduct[];
            // JD
            set6: PromotionDeliveryMethod[];
        }
    }

    interface PromotionDetailsDefaultParams {
        groupId: string;
        filter: string;
        isNameFiltered: string;
        isCodeFiltered: string;
        isProducerFiltered: string;
        isDescriptionFiltered: string;
        isBrandFiltered: string;
        brandId: string;
        warehouseId: string;
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


    interface Permissions {
        createInquiries: boolean;
        canChangeDefaultWarehouse: boolean;
        canChangePassword: boolean;
        canChangeQuoteQuantity: boolean;
        canComplain: boolean;
        canPrint: boolean;
        confirmOrders: boolean;
        deliveryMethodChange: boolean;
        errorList: boolean;
        paymentDateChange: boolean;
        paymentFormChange: boolean;
        pricesVisibility: boolean;
        receiptDateChange: boolean;
        removeUnconfirmedOrders: boolean;
        showCarts: boolean;
        showComplaints: boolean;
        showCompletion: boolean;
        showCustomerData: boolean;
        showDeliveryMethod: boolean;
        showDeliveries: boolean;
        showDiscount: boolean;
        showInquiries: boolean;
        showOrders: boolean;
        showPayments: boolean;
        showProduction: boolean;
        showProducts: boolean;
        showPromotions: boolean;
        showQuotes: boolean;
        showReservations: boolean;
        showServices: boolean;
        showTargetCustomer: boolean;
        canChangeDefaultWarehouseCart: boolean;
        showPending: boolean;
        showProfile: boolean;
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
        | 'state'
        | 'linkedDocumentsArray'
        | 'linkedDocument'
        | 'complain'
        | 'daysAfterDueDate'
        | 'html'
        | 'cases'
        | 'complaintHistory'
        | 'promotionValue'
        | 'percent';

        /**
         * Link structure for linked documents. Required for 'linkedDocument' and 'linkedDocumentsArray' types.
         * */
        link?: {
            href: string;
            labelProperty: string;
            paramProperty: string | string[];
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

            type: 'text' | 'select' | 'selectFromTranslations';

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
         * Sets class when value equals qiven value
         * */
        classCondition?: {
            valueEquals: any;
            class: string;
        };

    }

    interface ForbiddenProductInfo {

        /**
         * position, started from 1
         * */
        cartPosition: number;

        articleId: number;
    }


    interface RouteWithKey extends Route {
        key?: string;
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

}



