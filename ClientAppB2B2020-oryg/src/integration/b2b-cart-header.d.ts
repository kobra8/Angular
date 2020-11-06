import { b2bShared } from 'src/integration/b2b-shared';
import { b2bCart } from 'src/integration/b2b-cart';
import { CartDetailRealizationType } from 'src/app/model/cart/enums/cart-detail-realization-type.enum';
import { StockLevelBehavoiurEnum } from '../app/model/cart/enums/stock-level-behavoiur.enum';
import { CheckQuoteValidationEnum } from '../app/model/cart/enums/validation/check-quote-validation.enum';
import { AddressValidationEnum } from '../app/model/cart/enums/validation/address-validation.enum';
import { DeliveryMethodValidationEnum } from '../app/model/cart/enums/validation/delivery-method-validation.enum';
import { PaymentDateValidationEnum } from '../app/model/cart/enums/validation/payment-date-validation.enum';
import { PaymentFormValidationEnum } from '../app/model/cart/enums/validation/payment-form-validation.enum';
import { RealizationDateValidationEnum } from '../app/model/cart/enums/validation/realization-date-validation.enum';
import { WarehouseValidationEnum } from '../app/model/cart/enums/validation/warehouse-validation.enum';
import { RealizationValidationEnum } from '../app/model/cart/enums/validation/realization-validation.enum';
import { ValidationTypeEnum } from '../app/model/cart/enums/validation/validation-type.enum';
import { AddressType } from '../app/model/shared/enums/address-type.enum';
import { FormMode } from '../app/model/shared/enums/form-mode.enum';
import { SaveAddressStatus } from '../app/model/shared/enums/save-address-status.enum';

export module b2bCartHeader {

    interface UpdateCartHeaderBaseRequest {
        cartId: number;
    }

    interface UpdateSourceNumberRequest extends UpdateCartHeaderBaseRequest {
        newSourceNumber: string;
    }

    interface UpdateDescriptionRequest extends UpdateCartHeaderBaseRequest {
        newDescription: string;
    }

    interface UpdateAddressRequest extends UpdateCartHeaderBaseRequest {
        addressId: number;
    }

    interface UpdateRealizationDateRequest extends UpdateCartHeaderBaseRequest {
        realisationDate: string;
    }

    interface UpdateRealizationRequest extends UpdateCartHeaderBaseRequest {
        realisationType: number;
    }

    interface UpdateDeliveryMethodXlRequest extends UpdateCartHeaderBaseRequest, b2bShared.PaginationRequestParams {
        deliveryMethod: string;
    }

    interface UpdateDeliveryMethodAltumRequest extends UpdateCartHeaderBaseRequest {
        deliveryMethod: number;
    }

    interface UpdatePaymentFormRequest extends UpdateCartHeaderBaseRequest, b2bShared.PaginationRequestParams {
        paymentFormId: number;
    }

    interface UpdatePaymentDateXlRequest extends UpdateCartHeaderBaseRequest, b2bShared.PaginationRequestParams {
        paymentDate: string;
    }

    interface UpdatePaymentDateAltumRequest extends UpdateCartHeaderBaseRequest {
        paymentDate: string;
    }

    interface UpdateWarehouseRequest extends UpdateCartHeaderBaseRequest, b2bShared.PaginationRequestParams {
        warehouseId: number;
    }

    interface RepairCartHeaderBaseRequest {
        cartId: number;
    }

    interface RepairCartHeaderXlRequest extends RepairCartHeaderBaseRequest { }
    interface RepairCartHeaderAltumRequest extends RepairCartHeaderBaseRequest { }

    interface ShippingAddressRequestModel {
        companyName: string;
        nameAndLastName?: string;
        street: string;
        zipCode: string;
        city: string;
        countryId: number;
        phoneNumber: string;
        email: string;
    }

    interface AddShippingAddressXlRequest {
        shippingAddressModel: ShippingAddressRequestModel;
        isAddressTemp: boolean;
        cartId: number;
    }

    interface UpdateShippingAddressXlRequest {
        shippingAddressModel: ShippingAddressRequestModel;
        isAddressTemp: boolean;
        cartId: number;
    }


    //-------responses-------
    
    interface IUpdateDeliveryMethodXlResponse {
        items: b2bCart.CartArticleListItemXl[];
        cartSummary: b2bCart.CartSummaryXl;
    }

    interface IUpdateDeliveryMethodAltumResponse {
        cartSummary: b2bCart.CartSummaryAltum;
    }

    interface IUpdatePaymentFormXlResponse {
        newPaymentDate: string;
        items: b2bCart.CartArticleListItemXl[];
        cartSummary: b2bCart.CartSummaryXl;
    }

    interface IUpdatePaymentFormAltumResponse {
        items: b2bCart.CartArticleListItemAltum[];
        cartSummary: b2bCart.CartSummaryAltum;
    }

    interface IUpdatePaymentDateXlResponse {
        items: b2bCart.CartArticleListItemXl[];
        cartSummary: b2bCart.CartSummaryXl;
    }

    interface IUpdateWarehouseXlResponse {
        items: b2bCart.CartArticleListItemWithStockLevelXl[];
        cartSummary: b2bCart.CartSummaryXl;
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }

    interface IUpdateWarehouseXAltumResponse {
        items: b2bCart.CartItemStockLevelAltum[];
        stockLevelModeBehaviour: StockLevelBehavoiurEnum;
    }


    interface DeliveryMethodOption extends b2bShared.SelectBaseOption {
        translationName: string;
    }

    interface PaymentFormOption extends b2bShared.SelectBaseOption { }
    interface ShippingAddressOption extends b2bShared.SelectBaseOption { }


    interface GetShippingAddressXlResponse {
        shippingAddresses: ShippingAddressXl[];
    }

    interface AddShippingAddressXlResponse {
        shippingAddress: ShippingAddressXl;
    }


    interface WarehouseOption extends b2bShared.SelectBaseOption { }


    interface RepairCartHeaderBaseResponse {
        stockLevelBehaviourEnum: StockLevelBehavoiurEnum;
        items: b2bCart.CartArticleListItemWithStockLevelBase[];
        cartSummary: b2bCart.CartSummaryBase;
        cartHeader: CartHeaderBase;
    }

    interface RepairCartHeaderXlResponse extends RepairCartHeaderBaseResponse {
        items: b2bCart.CartArticleListItemWithStockLevelXl[];
        cartSummary: b2bCart.CartSummaryXl;
        cartHeader: CartHeaderXl;
    }

    interface RepairCartHeaderAltumResponse extends RepairCartHeaderBaseResponse {
        items: b2bCart.CartArticleListItemWithStockLevelAltum[];
        cartSummary: b2bCart.CartSummaryAltum;
        cartHeader: CartHeaderAltum;
    }


    //----other

    interface CartHeaderValidationObjectBase {
        addressValidationResult: AddressValidationEnum;
        deliveryMethodValidateResult: DeliveryMethodValidationEnum;
        paymentDateValidateResult: PaymentDateValidationEnum;
        paymentFormValidateResult: PaymentFormValidationEnum;
        realisationDateValidateResult: RealizationDateValidationEnum;
        warehouseValidateResult: WarehouseValidationEnum;
        cartHeaderCheckExecuteQuoteResultEnum: CheckQuoteValidationEnum;
    }

    interface CartHeaderValidationObjectXl extends CartHeaderValidationObjectBase {
        completionEntirelyValidateEnum: RealizationValidationEnum;
    }

    interface CartHeaderValidationObjectAltum extends CartHeaderValidationObjectBase {
        completionEntirelyValidateEnum: RealizationValidationEnum; //TODO - temp
    }

    interface CartHeaderSimpleValidationBaseObject {
        isAddressValid: boolean;
        isDeliveryMethodValid: boolean;
        isPaymentDateValid: boolean;
        isPaymentFormValid: boolean;
        isRealizationDateValid: boolean;
        isWarehouseValid: boolean;
        quoteValidationEnum: CheckQuoteValidationEnum;
        validationType: ValidationTypeEnum;
    }

    interface CartHeaderSimpleValidationXlObject extends CartHeaderSimpleValidationBaseObject {
        isCompletionEntirelyValid: boolean;
    }

    interface CartHeaderSimpleValidationAltumObject extends CartHeaderSimpleValidationBaseObject {
        isCompletionEntirelyValid: boolean; //TODO - temp solution
    }


    interface CartHeaderBase {
        headerId: number;
        realisationDate: string;
        paymentFormId: number;
        paymentFormName: string;
        deliveryMethodName: string;
        paymentDate: string;
        cartId: number;
        description: string;
        sourceNumber: string;
        warehouseId: number;
        warehouseName: string;
        fromQuote: number;
        quoteNumber: string;
        cartName: string;
    }

    interface CartHeaderXl extends CartHeaderBase {
        completionType: CartDetailRealizationType;
        shippingAddress: ShippingAddressXl;
    }

    interface CartHeaderAltum extends CartHeaderBase {
        deliveryMethodId: number;
        addressId: number;
        addressName: string;
    }

    interface CartHeaderPermisions {
        hasAccessToChangePaymentForm: boolean;
        hasAccessToChangePaymentDate: boolean;
        hasAccessToShowDeliveryMethod: boolean;
        hasAccessToChangeDeliveryMethod: boolean;
        hasAccessToChangeRealizationTime: boolean;
        hasAccessToChangeWarehouse: boolean;
        hasAccessToChangeCompletionEntirely: boolean;
    }

    interface CartHeaderAttributes {
        orderAttributes: CartHeaderAttribute[];
        inquiryAttributes: CartHeaderAttribute[];
    }

    interface CartHeaderAttribute {
        attributeClassId: number;
        name: string;
        traslateName: string;
        type: number;
        format: string;
        value: string;
        required: boolean;
    }

    interface CartHeaderSavingSummary {
        isAddressSaving?: boolean;
        isDeliveryMethodSaving?: boolean;
        isPaymentDateSaving?: boolean;
        isPaymentFormSaving?: boolean;
        isRealizationDateSaving?: boolean;
        isWarehouseSaving?: boolean;
        isSourceNumberSaving?: boolean;
        isDescriptionSaving?: boolean;
        isRealizationSaving?: boolean;
    }


    interface ShippingAddressBase {
        addressId: number;
        companyName: string;
        nameAndLastName?: string;
        street: string;
        zipCode: string;
        city: string;
        country: b2bShared.Country;
        phoneNumber: string;
        email: string;
        isTempAddress: boolean;
        isPossibleToEdit: boolean;
    }

    interface ShippingAddressXl extends ShippingAddressBase {
        addressType: AddressType;
    }

    interface AddressFormInputData {
        formMode: FormMode;
        editModelData: ShippingAddressXl;
        isOpen: boolean;
    }

    interface AddressFormSubmitData {
        shippingAddressModel: ShippingAddressRequestModel;
        isAddressTemp?: boolean;
        addressId?: number;
        formMode: FormMode;
    }

    interface AddressFormStatus {
        saveAddressStatus?: SaveAddressStatus;
        status: b2bShared.Status;
    }
}
