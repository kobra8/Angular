import { b2bShared } from 'src/integration/b2b-shared';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2b } from 'src/b2b';
import { StockLevelBehavoiurEnum } from '../app/model/cart/enums/stock-level-behavoiur.enum';

export module b2bQuotes {

    interface InCartBaseRequest {
        cartId: number;
    }

    interface AddToCartFromQuoteRequest {
        quoteId: number;
    }

    interface UpdateSourceNumberInCartRequest extends InCartBaseRequest {
        sourceNumber: string;
    }

    interface UpdateDescriptionInCartRequest extends InCartBaseRequest {
        description: string;
    }

    interface UpdateAddressInCartRequest extends InCartBaseRequest {
        shippingAddressId: number;
    }

    interface UpdateRealizationDateInCartRequest extends InCartBaseRequest {
        receiptDate: string;
    }

    interface UpdateRealizationInCartXlRequest extends InCartBaseRequest {
        completionEntirely: number;
    }

    interface UpdateDeliveryMethodInCartRequest extends InCartBaseRequest {
        deliveryMethod: string;
    }

    interface UpdatePaymentFormInCartRequest extends InCartBaseRequest {
        paymentFormId: number;
    }

    interface UpdatePaymentDateInCartRequest extends InCartBaseRequest {
        paymentDate: string;
    }

    interface UpdateWarehouseInCartRequest extends InCartBaseRequest, b2bShared.PaginationRequestParams {
        warehouseId: number;
    }

    interface UpdateItemQuantityInCartBaseRequest extends InCartBaseRequest {
        itemId: number;
        quantity: number;
    }
    interface UpdateItemQuantityInCartXlRequest extends UpdateItemQuantityInCartBaseRequest { }
    interface UpdateItemQuantityInCartAltumRequest extends UpdateItemQuantityInCartBaseRequest { }

    interface RemoveCartFromQuoteRequest extends InCartBaseRequest { }


    interface UpdateItemDescriptionInCartXlRequest extends b2bCart.UpdateItemDescriptionBaseRequest { }
    interface UpdateItemDescriptionInCartAltumRequest extends b2bCart.UpdateItemDescriptionBaseRequest { }


    //-----------responses-----------

    interface AddToCartFromQuoteResponse extends b2bCart.CartIdentifier { }

    interface UpdatePaymentFormInCartResponse {
        paymentDate: string;
    }

    interface UpdateWarehouseInCartResponse {
        items: b2bCart.CartItemStockLevelBase[];
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }

    interface UpdateItemQuantityInCartBaseResponse {
        cartItem: b2bCart.CartArticleListItemWithStockLevelBase;
        cartSummary: b2bCart.CartSummaryBase;
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }

    interface UpdateItemQuantityInCartXlResponse extends UpdateItemQuantityInCartBaseResponse {
        cartItem: b2bCart.CartArticleListItemWithStockLevelXl;
        cartSummary: b2bCart.CartSummaryXl;
    }

    interface UpdateItemQuantityInCartAltumResponse extends UpdateItemQuantityInCartBaseResponse {
        cartItem: b2bCart.CartArticleListItemWithStockLevelAltum;
        cartSummary: b2bCart.CartSummaryAltum;
    }

    interface GetQuoteDetailsResponse {
        quoteDetails: b2b.QuoteDetailsBase;
        quoteValidationObject: QuoteDetailsValidation;
    }

    interface QuoteDetailsValidation {
        isPermissionToQuoteRealize: boolean;
        showIncorrectStateOfQuoteWarning: boolean;
        showOutdatedQuoteWarning: boolean;
        showRealizedQuoteWarning: boolean;
    }
}
