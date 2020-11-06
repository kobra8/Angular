import { b2bShared } from 'src/b2b-shared';

export module b2bCart {

    interface UpdateCartDetailsBaseRequest {
        cartId: number;
    }

    interface UpdateSourceNumberRequest extends UpdateCartDetailsBaseRequest {
        newSourceNumber: string;
    }

    interface UpdateDescriptionRequest extends UpdateCartDetailsBaseRequest {
        newDescription: string;
    }

    interface UpdateAddressRequest extends UpdateCartDetailsBaseRequest {
        addressId: number;
    }

    interface UpdateRealizationDateRequest extends UpdateCartDetailsBaseRequest {
        realisationDate: string;
    }

    interface UpdateRealizationRequest extends UpdateCartDetailsBaseRequest {
        realisationType: number;
    }

    interface UpdateDeliveryMethodXlRequest extends UpdateCartDetailsBaseRequest, b2bShared.OldPaginationRequestParams {
        deliveryMethod: string;
    }

    interface UpdateDeliveryMethodAltumRequest extends UpdateCartDetailsBaseRequest, b2bShared.OldPaginationRequestParams {
        deliveryMethod: number;
    }

    interface UpdatePaymentFormRequest extends UpdateCartDetailsBaseRequest, b2bShared.OldPaginationRequestParams {
        paymentFormId: number;
    }

    interface UpdatePaymentDateRequest extends UpdateCartDetailsBaseRequest, b2bShared.OldPaginationRequestParams {
        paymentDate: string;
    }

    interface UpdateWarehouseRequest extends UpdateCartDetailsBaseRequest, b2bShared.OldPaginationRequestParams {
        warehouseId: number;
    }





    //-------responses-------

    interface UpdateCartHeaderArticlesWithSummaryXlResponse {
        items: CartArticleListItemXl[];
        cartSummary: CartSummaryXl;
    }


    interface UpdateCartHeaderArticlesWithSummaryAltumResponse {
        items: CartArticleListItemAltum[];
        cartSummary: CartSummaryAltum;
    }


    interface UpdateCartHeaderPaymentFormResponseModelXl extends UpdateCartHeaderArticlesWithSummaryXlResponse {
        newPaymentDate: string;
    }

    interface UpdateCartHeaderArticlesWithStockLevelWithSummaryXlResponse {
        items: CartArticleListItemWithStockLevelXl[];
        cartSummary: CartSummaryXl;
        exceededStatesOnEntireCart: boolean;
    }

    interface CartArticleListItemBase {
        unit: b2bShared.ArticleUnits;
        quantity: number;
        headerId: number;
        itemId: number;
    }

    interface CartArticleListItemXl extends CartArticleListItemBase {
        article: b2bShared.ArticleXl;
        price: b2bShared.ArticlePriceXl;
    }
    interface CartArticleListItemAltum extends CartArticleListItemBase {
        article: b2bShared.ArticleAltum;
        price: b2bShared.ArticlePriceAltum;
    }

    interface CartArticleListItemWithStockLevelBase {
        stockLevel: b2bShared.StockLevel;
        exceededStates: b2bShared.ExceededStates;
    }

    interface CartArticleListItemWithStockLevelXl extends CartArticleListItemWithStockLevelBase, CartArticleListItemXl { }


    interface UpdateCartHeaderWarehouseResponseModelAltum {
        items: CartArticleWithStockLevelAltum[];
        exceededStatesOnEntireCart: boolean;
    }

    interface CartArticleWithStockLevelAltum extends CartArticleListItemWithStockLevelBase {
        itemId: number;
        isUnitTotal: boolean;
        article: b2bShared.ArticleAltum;
    }

    interface CartSummaryBase {
        weightAndVolume: b2bShared.WeightAndVolume;
        remainingCustomerLimit: b2bShared.RemainingCustomerLimit;
    }

    interface CartSummaryXl extends CartSummaryBase {
        cartSummaryPricesList: CartSummaryPricesXl[];
    }

    interface CartSummaryAltum extends CartSummaryBase {
        cartSummaryPricesList: CartSummaryPricesAltum[];
    }

    interface CartSummaryPricesBase {
        count: number;
        id?: number;
        netAmount: string;
        vatValue: string;
        grossAmount: string;
        currency: string;
    }

    interface CartSummaryPricesXl extends CartSummaryPricesBase {
        fromQuote?: number;
        isPriceVisible?: boolean;
    }

    interface CartSummaryPricesAltum extends CartSummaryPricesBase { }



    //---------other

    interface UpdateStockState {
        itemsStockLevel: UpdateStockStateItem[];
        exceededStatesOnEntireCart: boolean;
    }

    interface UpdateStockStateItem extends b2bCart.CartArticleListItemWithStockLevelBase {
        itemId: number;
        type: number;
        isUnitTotal: boolean;
    }
}
