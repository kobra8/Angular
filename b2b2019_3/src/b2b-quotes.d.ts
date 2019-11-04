import { b2bShared } from 'src/b2b-shared';
import { b2bCart } from 'src/b2b-cart';

export module b2bQuotes {

    interface InCartBaseRequest {
        cartId: number;
    }

    interface AddToCartFromQuoteRequest extends InCartBaseRequest {
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

    interface UpdateWarehouseInCartRequest extends InCartBaseRequest {
        warehouseId: number;
        skip: number;
        take: number;
    }

    interface UpdateItemQuantityInCartRequest extends InCartBaseRequest {
        itemId: number;
        quantity: number;
    }

    interface RemoveCartFromQuoteRequest extends InCartBaseRequest { }



    //-----------responses-----------

    interface UpdatePaymentFormInCartResponse {
        paymentDate: string;
    }
}
