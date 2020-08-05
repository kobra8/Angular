import { b2bCart } from 'src/integration/b2b-cart';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { b2bShared } from 'src/integration/b2b-shared';
import { CreditLimitBehaviourEnum } from 'src/app/model/shared/enums/credit-limit-behaviour.enum';
import { StockLevelBehavoiurEnum } from 'src/app/model/cart/enums/stock-level-behavoiur.enum';
import { CartCheckResponseEnum } from 'src/app/model/cart/enums/cart-check-response.enum';

export module b2bCartCheck {

    interface CheckCartBaseRequest {
        cartId: number;
    }

    interface CheckCartXlRequest extends CheckCartBaseRequest { }
    interface CheckCartAltumRequest extends CheckCartBaseRequest { }

    interface RecalculatePricesXlRequest extends CheckCartBaseRequest { }
    interface RecalculatePricesAltumRequest extends CheckCartBaseRequest { }

    interface RepairQuantitiesXlRequest extends CheckCartBaseRequest { }
    interface RepairQuantitiesAltumRequest extends CheckCartBaseRequest { }


    //------responses

    interface CheckCartBaseResponse {
        cartItemCheckSummaryObjects: CheckCartSummaryObjectBase[];
        cartHeaderValidationResult: b2bCartHeader.CartHeaderValidationObjectBase;
        creditLimitBehaviourEnum: CreditLimitBehaviourEnum;
        stockLevelBehaviourEnum: StockLevelBehavoiurEnum;
        cartCheckResponse: CartCheckResponseEnum;
    }

    interface CheckCartXlResponse extends CheckCartBaseResponse {
        cartItemCheckSummaryObjects: CheckCartSummaryObjectXl[];
        cartHeaderValidationResult: b2bCartHeader.CartHeaderValidationObjectXl;
    }

    interface CheckCartAltumResponse extends CheckCartBaseResponse {
        cartItemCheckSummaryObjects: CheckCartSummaryObjectAltum[];
        cartHeaderValidationResult: b2bCartHeader.CartHeaderValidationObjectAltum;
    }

    interface RecalculatePricesBaseResponse {
        cartItems: b2bCart.CartArticleListItemBase[];
        cartSummary: b2bCart.CartSummaryBase;
    }

    interface RecalculatePricesXlResponse extends RecalculatePricesBaseResponse {
        cartItems: b2bCart.CartArticleListItemXl[];
        cartSummary: b2bCart.CartSummaryXl;
    }
    interface RecalculatePricesAltumResponse extends RecalculatePricesBaseResponse {
        cartItems: b2bCart.CartArticleListItemAltum[];
        cartSummary: b2bCart.CartSummaryAltum;
    }


    interface RepairQuantitiesBaseResponse {
        items: b2bCart.CartArticleListItemWithStockLevelBase[];
        cartSummary: b2bCart.CartSummaryBase;
        creditLimitBehaviourEnum: CreditLimitBehaviourEnum;
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }

    interface RepairQuantitiesXlResponse extends RepairQuantitiesBaseResponse {
        items: b2bCart.CartArticleListItemWithStockLevelXl[];
        cartSummary: b2bCart.CartSummaryXl;
    }
    interface RepairQuantitiesAltumResponse extends RepairQuantitiesBaseResponse {
        items: b2bCart.CartArticleListItemWithStockLevelAltum[];
        cartSummary: b2bCart.CartSummaryAltum;
    }


    //---------other

    interface CheckCartSummaryObjectBase {
        cartItem: b2bCart.CartArticleListItemWithStockLevelBase;
        newPrice: b2bShared.ArticlePriceBase;
        cartArticleListItemValidationSummary: CartArticleListItemValidationSummary;
    }

    interface CheckCartSummaryObjectXl extends CheckCartSummaryObjectBase {
        cartItem: b2bCart.CartArticleListItemWithStockLevelXl;
        newPrice: b2bShared.ArticlePriceXl;
    }

    interface CheckCartSummaryObjectAltum extends CheckCartSummaryObjectBase {
        cartItem: b2bCart.CartArticleListItemWithStockLevelAltum;
        newPrice: b2bShared.ArticlePriceAltum;
    }

    interface CartArticleListItemValidationSummary {
        isNotAvailable: boolean;
        hasExceededState: boolean;
        hasInvalidUnit: boolean;
        hasOutdatedPrice: boolean;
        hasIncorrectQuantity: boolean;
    }

    interface CheckCartSummaryDetailsBase {
        haveAnyExceededStates: boolean;
        haveAnyOutDatedPrice: boolean;
        haveAnyInvalidUnit: boolean;
        isAnyNotAllowed: boolean;
        haveAnyIncorrectQuantity: boolean;
    }

    interface CheckCartSummaryDetailsXl extends CheckCartSummaryDetailsBase { }
    interface CheckCartSummaryDetailsAltum extends CheckCartSummaryDetailsBase { }

    interface RefreshOutdatedProductRequest {
        renewAllPrices?: boolean;
        renewAllQuantities?: boolean;
        removedItemsIds?: number[];
        updateStockStatesOnSelectedProduct?: StockStatesPerArticle;
        refreshedProductsStockLevel?: b2bCart.CartItemStockLevelBase[];
        refreshedProductsWithPrice?: b2bCart.CartArticleListItemBase[];
        refreshedProductsWithPriceAndStockLevel?: b2bCart.CartArticleListItemWithStockLevelBase[];
    }

    interface StockStatesPerArticle {
        productId: number;
        hasExceededStates: boolean;
    }

    interface OutdatedDetails {
        allOutdatedProducts: CheckCartSummaryObjectBase[];
        unavailableCartItems: b2bCart.CartArticleListItemWithStockLevelBase[];
    }
}
