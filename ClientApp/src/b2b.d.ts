import { AttributeType } from './app/model/enums/attribute-type.enum';
import { CartOptionType } from './app/model/enums/cart-option-type.enum';
import { DisplayType } from './app/model/enums/display-type.enum';
import { PaginationRepo } from './app/model/shared/pagination-repo';
import { RightXL } from './app/model/enums/right-xl.enum';
import { RightAltum } from './app/model/enums/right-altum.enum';

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
         * Array of all user permissions
         **/
        set3: [{ rightId: RightXL | RightAltum}];
    }

    interface Header {
        creditInfo: HeaderCustomerInfo;
        supervisor: Supervisor;
    }

    /**
    * Credit and currency info.
    */
    interface HeaderCustomerInfo {

        customerCurrency: string;
        overduePayments: string;
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
        displayName?: string;
        displayNameResource?: string;
        params?: any;
        position: number;

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
    * Single route.
    */
    interface Route {
        controller: string;
        templateUrl: string;
        url: string;
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
        calculateDiscount?: boolean;
        cartCount?: number;
        companyUnitPath?: string;
        deliveryMethodId?: number;
        pageSize?: number;
        paymentDate?: number;
        paymentFormId?: number;
        precision?: number;
        priceCalculatedDiscount?: number;
        priceMode?: PriceMode;
        quantityPriceValue?: number;
        showCode?: boolean;
        showFeatures?: boolean;
        showImages?: boolean;
        showState?: boolean;
        stateAvailableColor?: string;
        stateMode?: boolean;
        stateNoneColor?: string;
        vatDirection?: 0 | 1;
        vatExport?: 0 | 1;
        warehouseId?: number;
        warehouseName?: string;
        withoutKgo?: 0 | 1;

        displayType?: DisplayType;

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
        parameters?: FilterParameter[];
        filter?: string;

        /**
        * array containing info about filtering by products' attributes
        */
        features?: FilterParameter[];
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
            set1: ListProduct[];

            /**
            * Product's list settings
            */
            set2: b2b.ItemsDisplayConfig[];
        };

    }

    /**
    * Array of units received in response
    */
    interface UnitResponse {
        no: number;
        unit: string;
    }

    /**
    * Response after async recalculation of single product prices
    */
    interface PricesResponse {
        grossPrice: string;
        netPrice: string;
    }

    /**
    * Base object for all products
    * It's base for product list's item, cart's list item and customer list's products.
    */
    interface BaseProduct {
        code: string;
        auxiliaryUnit?: string;
        currency: string;
        id: number;
        imageId: number;
        name: string;
        quantity?: number;
        stockLevel: string;
        type: number;
        max?: number;
    }


    /**
    * Base object for products to buy.
    * It's base for product list's item and cart's list item.
    */
    interface ProductToBuy extends BaseProduct {

        basicUnit: string;
        defaultUnitNo: number;
        isUnitTotal: 0 | 1;

        //found in source code; don't come with response
        converter?: any;
        price?: string;
        unitPrecision?: any;
        cartId?: number | string;
        quantityOptions: any;
        fromBinary?: any;
        state?: any;
        stateColor?: any;
        denominator?: number;
        numerator?: number;
    }

    /**
    * Product's list item.
    */
    interface ListProduct extends ProductToBuy {

        grossPrice: string;
        netPrice: string;
        unitLockChange: number;

        unitId?: number;
        units?: Map<number, UnitMapElement>;

        unitChange?: any;
        basePriceNo?: number;
        purchasePrice?: string;

        /**
         * True if units are loaded
         */
        unitsLoaded?: boolean;

        /**
        * True when image is lodaded or showing images is forbidden or there is no image
        */
        imageLoaded: boolean;

        /**
        * True when prices are loaded or showing prices is forbidden
        */
        pricesLoaded: boolean;

        quantityChanged?: boolean;

        min?: number;

    }




    /**
    * Request params for unit conversion
    */
    interface UnitConvertRequest extends RequestParams {

        cartId: string;

        /**
        * Product id.
        */
        id: string;

        unitNo: string;
        features: string;
        warehouseId: string;
    }

    /**
    * Response received after unit conversion
    */
    interface UnitConvertResponse {
        basicUnit: string;
        auxiliaryUnit?: string;
        isUnitTotal: 0 | 1;
        netPrice: string;
        grossPrice: string;
        type: number;
        denominator?: number;
        numerator?: number;
        stockLevel: string;
        unitPrecision: number;
        currency: string;
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
        pageSize?: number;
        getDeliveryCost: boolean;
        showImages: boolean;
        showCode: boolean;
        showState: boolean;
        stateMode: boolean;
        showFeatures: boolean;
        applicationId: number;
        priceMode: PriceMode;
        applicationId: number;
    }

    /**
    * Product in cart
    */
    interface CartProduct extends ProductToBuy {
        discount: string;
        fromQuote: number;
        itemId: number;
        no: number;
        totalPrice: string;
        subtotalPrice: string;
        totalValue: string;
        subtotalValue: string;
        vatDirection: string;
        unit: string;

        quantityChanged: boolean;

        index: number;

        disabled?: boolean;
        dontControl?: boolean;
        setDocumentsType?: number;
        //????
        bundleId: number;
        bundleCode: string;
        bundleQuantity: number;

    }

    /**
    * Selected options info and few settings.
    */
    interface CartHeader {
        address?: string;
        addressId?: number;
        completionEntirely?: string;
        creditLimitMode?: CreditLimitMode;
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
        showDeliveryMethod?: boolean;
        showFeatures?: boolean;
        sourceNumber?: string;
        sourceNumberSI?: string;
        stockLevelMode?: StockLevelMode;
        translationDeliveryMethod?: string;
        vatDirection?: string;
        warehouseId?: string;
        warehouseName?: string;
    }

    /**
    * Request params when updating cart options.
    */
    interface UpdateHeaderRequest extends RequestParams {
        cartId: string;

        /**
        * CartOptionType enum casted to string
        */
        changedField: string;

        addressId: string;
        completionEntirely: string;
        receiptDate: string;
        description: string;
        descriptionSI: string;
        deliveryMethod: string;
        sourceNumber: string;
        sourceNumberSI: string;
        paymentFormId: string;
        paymentDate: string;
        warehouseId: string;
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
        completionEntirely?: number;
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
            set2: CartConfig;

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

            //volume //??
            set7?: any[];
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
        vatDirection: number; //??
        totalPrice: string;
        subtotalPrice: string;
        totalValue: string;
        subtotalValue: string;
        discount: string;

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
        set1: CartProductChanged[]; //not sure about type

        /**
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
            * Credit info
            */
            set2: [{
                creditLimit: number;
                customerCurrency: string;
            }];

            /**
            * Weight and volume
            */
            set3: CartWeight[];
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
            set3: CartHeader[];
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
        set1: CartProduct[];
        set2: [{ exceededCreditLimit: false }];
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

        /**
        * Sets.
        */
        set8: any[];
    }

    /**
    * Details of product.
    * Description, manager, manufacturer, etc.
    */
    interface ProductDetailsInfo {
        articleUrl: string;
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
        
        vatRate: number;
        wmc: number;

        units?: Map<number, UnitMapElement>;
        featuresParam?: string;
        warehouseId?: string;
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
         * xl only
         * */
        unitLockChange?: 0 | 1;
        fromBinary?: any;
        state?: string;
        quantityPrecision?: any;
        unitsLoaded?: boolean;
    }

    /**
    * Displaing configuration.
    */
    interface ProductConfig {
        applicationId: number;
        cartCount: number | string[];
        pageSize: any; // null???
        priceMode: PriceMode;
        showCode: boolean;
        showFeatures: boolean;
        showImages: boolean;
        showState: boolean;
        stateAvailableColor: string;
        stateMode: boolean;
        stateNoneColor: boolean;
        warehouseName: boolean;
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
        filter: string;
    }

    /**
    * Base object for single list item preview received after customer list request
    */
    interface CustomerListItem {

        id: number;
        issueDate: Date;
        number: string;
        sourceNumber: string;
        state: string;
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
        statusId: string;

    }

    /**
    * Filtering options for complaints list
    */
    interface ComplaintsListFilter extends CustomerListFilter {
        /**
         * when documents
         */
        statusId?: number;

        /**
         * when products
         */
        documentId?: string;
    }

    interface ComplaintsListResponseItems extends CustomerListResponseItems<ComplaintsListItem> {
        set2?: {
            complaintSubmission: boolean;
            showCode: boolean;
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
        statusId: number;
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

    }

    /**
    * Filtering options for pending list
    */
    interface PendingListFilter extends CustomerListFilter {
        searchText?: string;
    }

    interface PendingListResponseItems extends CustomerListResponseItems<PendingListItem> {
        set2: {
            showCode: boolean
        }[];
    }

    interface PendingListDetails {
        showCode: boolean;
    }

    interface ComplaintsListDetails {
        showCode: boolean;
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
        ranges?: { dateFrom?: Date, dateTo?: Date };
        currentFilter: CustomerListFilter & OrderFilter & InquiryListFilter & QuotesListFilter & PaymentsListFilter & ComplaintsListFilter & DeliveryListFilter & PendingListFilter;
        states?: Option2[];

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

    interface Employee { //???
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

    interface CustomerFullDataResponse {
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

        /**
        * Array of employees
        */
        set5: Employee[];
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
        state: string;
        description: string;
    }


    interface CustomerListDetailsResponse {
        outputs: { returN_VALUE: number };
    }

    interface InquiryDetailsResponse extends CustomerListDetailsResponse {
        set1: any[];
        set2: any[];
        set3: any[];
        set4: InquiryDetails[];
        /**
         * Altum only
         * */
        set5: InquiryListItem[];
    }

    interface CustomerListProduct extends BaseProduct {

        grossValue: string;
        netValue: string;
        no: number;
        position: number;
        precision: number;
        price: string;
        unitConversion: string;
        value: number;
        cartId?: number;
        fromQuote?: string | null;
    }

    interface QuoteDetails extends CustomerListDetails {

        cartCount: string | string[];
        completionEntirely: number;
        createManyOrders: number;
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
        priceMode: PriceMode;
        reasonForRejectionId: number;
        reasonForRejectionName: string;
        showCode: boolean;
        showImages: boolean;
        showState: boolean;
        sourceNumber: string;
        stateId: QuoteStatus;
        stateMode: number;
        stateName: string;
        totalWeight: number;
        vatDirection: string;
        volume: number;
        copyToCartDisabled: boolean;

        stateResource?: string;
        quantityDisabled?: boolean;
    }



    interface QuoteDetailsResponse extends CustomerListDetailsResponse {
        set1: any[];
        set2: any[];
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
        cartCount: string | string[];
        completionEntirely: number;
        customer: string;
        deliveryMethod: number;
        description: number;
        dueDate: string;
        expectedDate: string;
        expireDate: string;
        isConfirm: number;
        paymentForm: string;
        precision: number;
        priceMode: PriceMode;
        removeOrders: boolean;
        showCode: boolean;
        showFeatures: boolean;
        showImages: boolean;
        state: string;      
        vatDirection: string;       
        costValue?: string;

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
    }

    interface OrderDetailsResponse extends CustomerListDetailsResponse {
        set1: OrderHeaderAttribute[];
        set2: any[];
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
        cartCount: string | string[];
        currency: string;
        deliveryMethod: string;
        description: string;
        isClip: number;
        priceMode: PriceMode;
        saleDate: string;
        showCode: boolean;
        showImages: boolean;
        showOrders: boolean;
        value: number;
        vatDirection: string;
        vatValue: number;
        printHref?: string;
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
        set2: any[];
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
        showCode: boolean;
        showImages: boolean;
        state: string;
        stateId: number;
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
            set2: any[];
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
        precision: number;
        priceMode: PriceMode;
        showCode: boolean;
        showImages: boolean;
        state: string;

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

    interface PromotionDetails {
        applicationId: 0;
        cartCount: string | string[];
        comment: string;
        cyclic: number;
        effectiveFrom: any;
        name: string;
        showCode: boolean;
        showImages: boolean;
        until: any;
        validInHoursFrom: string;
        validInHoursTo: string;
        calculateDiscount?: boolean;
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
        vatDirection: string;
        cartId?: number;
        quantity?: number;
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
            set2: any[];
            set3: any[];
            set4: PromotionDetails[];
            set5: PromotionProduct[];
            set6: PromotionDeliveryMethod[];
        };
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
        precision: number;
        price: number;
        quantity: number;
        sourceDocumentId: number;
        sourceDocumentName: string;
        sourceDocumentNo: number;
        sourceDocumentType: number;
        subtotalValue: number;
        totalValue: number;
        unitConversion: string;
        vatDirection: string;
        max?: number;
        value?: number;
    }

    interface ComplaintFormConfig {
        itemsCount: number;
        precision: number;
        priceMode: PriceMode;
        showCode: boolean;
        showImages: boolean;
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

    /**
     * Config and permission params wchich are checked in products table component
     * Component chek only content of table, doesn't filter the columns.
     * Proper filtered colums should be given to the component.
     */
    interface ProductsTableConfig {
        showCode?: boolean;
        stateMode?: boolean;
        showImages?: boolean;
        priceMode?: PriceMode;
        pricesVisibility?: boolean;
        canComplain?: boolean;
        showCarts?: boolean;
        calculateDiscount?: boolean;
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
        warehouseChange: boolean;
        showPending: boolean;

        showProfile: boolean;
    }

    interface SiteConfig {
        priceMode: PriceMode;
    }

}



