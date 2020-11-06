import { BoxMessageClass } from '../app/model/shared/enums/box-message-class.enum';
import { DisplayType } from '../app/model/enums/display-type.enum';
import { BoxMessageType } from '../app/model/shared/enums/box-message-type.enum';
import { PriceMode } from '../app/model/enums/price-mode.enum';
import { MaxQuantityDisplayType } from '../app/model/shared/enums/max-quantity-type.enum';

export module b2bShared {

    interface GenericCollection<K, T> {
        [Key: K]: T;
    }

    interface RepresentsExistingValueBase {
        representsExistingValue: boolean;
    }

    interface ImageId extends RepresentsExistingValueBase {
        value: number;
    }

    interface ArticleCode extends RepresentsExistingValueBase {
        value: string;
    }

    interface CalculatingParameter extends RepresentsExistingValueBase {
        value: number;
    }

    interface WeightAndVolume {
        weightGross: number;
        volume: number;
    }

    interface PaginationRequestParams {
        pageNumber: number;
    }

    interface PaginationResponse {
        buildPager: boolean;
        currentPage: number;
        totalPages: number;
    }

    interface Price extends RepresentsExistingValueBase {
        value: string;
    }

    interface AuxiliaryUnit extends RepresentsExistingValueBase {
        unit: string;
    }

    interface ArticleBase {
        id: number;
        imageId: ImageId;
        name: string;
        type: number;
        code: ArticleCode;
        discountPermission: boolean;
    }

    interface ArticleXl extends ArticleBase { }
    interface ArticleAltum extends ArticleBase { }

    interface ArticlePriceBase {
        currency: string;
        discount: string;
        subtotalPrice: string;
        totalPrice: string;
        subtotalValue: string;
        totalValue: string;
        subtotalUnitPrice: Price;
        totalUnitPrice: Price;
    }

    interface ArticlePriceXl extends ArticlePriceBase { }
    interface ArticlePriceAltum extends ArticlePriceBase { }


    interface ArticleUnits {
        auxiliaryUnit: AuxiliaryUnit;
        numerator: CalculatingParameter;
        denominator: CalculatingParameter;
        basicUnit: string;
        defaultUnitNo: number;
        isUnitTotal: boolean;
        converter?: string;
    }

    interface StockLevel extends RepresentsExistingValueBase {
        value: string;
    }

    interface ExceededStates extends RepresentsExistingValueBase {
        hasExceededStates: boolean;
    }

    interface Quantity {
        value: number;
        isQuantityChangeBlocked: boolean;
        maxQuantityType: MaxQuantityDisplayType;
    }

    interface AvailableCarts {
        cartsIds: number[];
    }

    interface BoxMessages {
        messages: BoxMessageType[];
        showBoxMessage: boolean;
        boxMessageClass: BoxMessageClass;
    }


    interface ProductListConfig {
        displayType?: DisplayType;
    }

    interface ProductDetailsConfig {
        warehouseId: number;
        warehouseName: string;
    }

    interface AsyncPricesRequestXL {
        articleId: number;
        warehouseId: number;
        features: string;
    }

    interface AsyncPricesRequestAltum {
        articleId: number;
        features: string;
        warehouseId: number;
    }

    interface ProductDetailsCache {
        [warehouseId: number]: { [unitId: number]: ProductDetailsCacheElement };
    }

    interface ProductDetailsCacheElement extends Partial<ProductDetailsCacheBaseElement> {
        volume: number;
        bruttoWeight: number;
        nettoWeight: number;
        /**
         * [Notice!] the key begins with a capital letter
         * */
        volumeSymbolResourceKey: string;

        /**
         * [Notice!] the key begins with a capital letter
         * */
        weightSymbolResourceKey: string;
    }

    interface ProductDetailsCacheBaseElement {
        auxiliaryUnit: string;
        basicUnit: string;
        isUnitTotal: 0 | 1;
        netPrice: number;
        grossPrice: number;
        type: number;
        denominator: number;
        numerator: number;
        stockLevel: string;
        unitPrecision: number;
        currency: string;
        baseNetPrice: number;
        baseGrossPrice: number;
        unitNetPrice: number;
        unitGrossPrice: number;

        stockLevelNumber: number;
        converter: string;
    }

    interface SelectBaseOption {
        id?: number;
        name: string;
    }

    interface AutocompleteConfig {
        items?: any[];
        loading: boolean;
        isAutocompleteEnabled: boolean;
    }

    interface UpdateItemDescription {
        itemId: number;
        newDescription: string;
    }

    interface ProductTableConfig {
        priceMode?: PriceMode;
        haveProductsDescription?: boolean;
        canEditProductsDescription?: boolean;
        productDescriptionMaxLength?: number;
        hasRemoveButton?: boolean;
    }

    interface SelectOptionChangeModel {
        value: any;
        label: string;
        id: string;
        hasEditLink?: boolean;
    }

    interface Country {
        name: string;
        id: number;
        zipCodeRegex?: string;
    }

    interface GetCountriesXlResponse {
        countries: Country[];
        defaultCountry: Country;
    }

    interface CountriesSummary extends GetCountriesXlResponse { }

    interface Status {
        isVisible: boolean;
        autoHide?: boolean;
        autoHideTimeout?: number;
    }
}
