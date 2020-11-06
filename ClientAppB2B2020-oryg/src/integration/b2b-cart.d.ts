import { b2bShared } from 'src/integration/b2b-shared';
import { CreditLimitBehaviourEnum } from 'src/app/model/shared/enums/credit-limit-behaviour.enum';
import { StockLevelBehavoiurEnum } from 'src/app/model/cart/enums/stock-level-behavoiur.enum';
import { CartDocumentType } from 'src/app/model/enums/cart-document-type.enum';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { PriceMode } from 'src/app/model/enums/price-mode.enum';

export module b2bCart {

    //-------requests-------

    interface GetCartContentRequest extends b2bShared.PaginationRequestParams {
        filter: string;
        id: string;
        selectedDocument: string;
    }

    interface GetCartDetailsBaseRequest extends b2bShared.PaginationRequestParams {
        cartId: number;
        cartDocumentType: CartDocumentType;
    }
    interface GetCartDetailsXlRequest extends GetCartDetailsBaseRequest { }
    interface GetCartDetailsAltumRequest extends GetCartDetailsBaseRequest { }


    interface UpdateItemQuantityBaseRequest {
        itemId: number;
        cartId: number;
        quantity: number;
    }
    interface UpdateItemQuantityXlRequest extends UpdateItemQuantityBaseRequest { }
    interface UpdateItemQuantityAltumRequest extends UpdateItemQuantityBaseRequest { }


    interface RemoveCartItemBaseRequest extends b2bShared.PaginationRequestParams {
        itemId: number;
        cartId: number;
    }
    interface RemoveCartItemXlRequest extends RemoveCartItemBaseRequest { }
    interface RemoveCartItemAltumRequest extends RemoveCartItemBaseRequest { }

    interface RemoveCartItemsBaseRequest {
        cartId: number;
        checkExceededStatesAfterDeletion: boolean;
        itemIds: number[];
    }
    interface RemoveCartItemsXlRequest extends RemoveCartItemsBaseRequest { }
    interface RemoveCartItemsAltumRequest extends RemoveCartItemsBaseRequest { }


    interface GetCreditLimitBehavoiurRequest {
        cartId: number;
    }


    interface UpdateItemDescriptionBaseRequest {
        cartId: number;
        itemId: number;
        newDescription: string;
    }
    interface UpdateItemDescriptionXlRequest extends UpdateItemDescriptionBaseRequest { }
    interface UpdateItemDescriptionAltumRequest extends UpdateItemDescriptionBaseRequest { }

    //-------responses-------

    interface IGetCartDetailsBaseResponse {
        cart: ICartBase;
        exceededStatesBehaviour: StockLevelBehavoiurEnum;
        creditLimitBehaviour: CreditLimitBehaviourEnum;
        pagingResponse: b2bShared.PaginationResponse;
    }

    interface IGetCartDetailsXlResponse extends IGetCartDetailsBaseResponse {
        cart: ICartXl;
    }

    interface IGetCartDetailsAltumResponse extends IGetCartDetailsBaseResponse {
        cart: ICartAltum;
    }

    interface UpdateItemQuantityBaseResponse {
        cartItem: CartArticleListItemWithStockLevelBase;
        cartSummary: CartSummaryBase;
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }

    interface UpdateItemQuantityXlResponse extends UpdateItemQuantityBaseResponse {
        cartItem: CartArticleListItemWithStockLevelXl;
        cartSummary: CartSummaryXl;
    }

    interface UpdateItemQuantityAltumResponse extends UpdateItemQuantityBaseResponse {
        cartItem: CartArticleListItemWithStockLevelAltum;
        cartSummary: CartSummaryAltum;
    }

    interface RemoveCartItemBaseResponse {
        cartStillExists: boolean;
        hasExceededStatesOnDeletedArticle: boolean;
        pageNumberToGet: number;
    }
    interface RemoveCartItemXlResponse extends RemoveCartItemBaseResponse { }
    interface RemoveCartItemAltumResponse extends RemoveCartItemBaseResponse { }

    interface RemoveCartItemsBaseResponse {
        cartStillExists: boolean;
    }
    interface RemoveCartItemsXlResponse extends RemoveCartItemsBaseResponse { }
    interface RemoveCartItemsAltumResponse extends RemoveCartItemsBaseResponse { }

    interface GetCreditLimitBehavoiurResponse {
        creditLimitBehaviour: CreditLimitBehaviourEnum;
    }

    //Other

    interface ICartBase {
        items: CartArticleListItemWithStockLevelBase[];
        summary: CartSummaryBase;
        header: b2bCartHeader.CartHeaderBase;
        cartAttributes: b2bCartHeader.CartHeaderAttributes;
    }


    interface ICartXl extends ICartBase {
        items: CartArticleListItemWithStockLevelXl[];
        summary: CartSummaryXl;
        header: b2bCartHeader.CartHeaderXl;
    }

    interface ICartAltum extends ICartBase {
        items: CartArticleListItemWithStockLevelAltum[];
        summary: CartSummaryAltum;
        header: b2bCartHeader.CartHeaderAltum;
    }


    interface CartArticleListItemBase {
        article: b2bShared.ArticleBase;
        price: b2bShared.ArticlePriceBase;
        unit: b2bShared.ArticleUnits;
        quantity: b2bShared.Quantity;
        itemId: number;
        description: string;
    }

    interface CartArticleListItemXl extends CartArticleListItemBase {
        article: b2bShared.ArticleXl;
        price: b2bShared.ArticlePriceXl;
    }
    interface CartArticleListItemAltum extends CartArticleListItemBase {
        article: b2bShared.ArticleAltum;
        price: b2bShared.ArticlePriceAltum;
    }

    interface CartItemStockStateBase {
        stockLevel: b2bShared.StockLevel;
        exceededStates: b2bShared.ExceededStates;
        stockLevelBehaviour: StockLevelBehavoiurEnum;
        quantity: b2bShared.Quantity;
    }

    interface CartArticleListItemWithStockLevelBase extends CartItemStockStateBase, CartArticleListItemBase { }

    interface CartArticleListItemWithStockLevelXl extends CartArticleListItemWithStockLevelBase, CartArticleListItemXl { }
    interface CartArticleListItemWithStockLevelAltum extends CartArticleListItemWithStockLevelBase, CartArticleListItemAltum { }


    interface CartItemStockLevelBase extends CartItemStockStateBase {
        article: b2bShared.ArticleBase;
        itemId: number;
    }
    interface CartItemStockLevelAltum extends CartItemStockLevelBase { }


    interface CartSummaryBase {
        cartSummaryPricesList: CartSummaryPricesBase[];
        cartSummaryItemsPricesList: CartSummaryPricesBase[];
        delivery?: CartSummaryPricesBase;
        weightAndVolume: b2bShared.WeightAndVolume;
    }

    interface CartSummaryXl extends CartSummaryBase {
        cartSummaryPricesList: CartSummaryPricesXl[];
        cartSummaryItemsPricesList: CartSummaryPricesXl[];
        delivery?: CartSummaryPricesXl;
    }

    interface CartSummaryAltum extends CartSummaryBase {
        cartSummaryPricesList: CartSummaryPricesAltum[];
        cartSummaryItemsPricesList: CartSummaryPricesAltum[];
        delivery?: CartSummaryPricesAltum;
    }

    interface CartSummaryPricesBase {
        count: number;
        id?: number;
        netAmount: string;
        vatValue: string;
        grossAmount: string;
        currency: string;
    }

    interface CartSummaryPricesXl extends CartSummaryPricesBase { }
    interface CartSummaryPricesAltum extends CartSummaryPricesBase { }


    interface CartProductBase extends CartArticleListItemWithStockLevelBase { }

    interface GetAvailableCartsResponse {
        availableCarts: CartIdentifier[];
        isPermissionToCreateNewCart: boolean;
    }

    interface AvailableCartsStatus extends GetAvailableCartsResponse { }

    interface SelectedCartStatus {
        cartId: number;
        isPermissionToCreateNewCart: boolean;
    }

    interface CartIdentifier {
        cartId: number;
        cartName: string;
    }

    interface RemoveCartFromQuoteModal {
        visibility: boolean;
        cart?: CartIdentifier;
    }

    interface RemoveUnavailableItemsModal {
        visibility: boolean;
    }
}
