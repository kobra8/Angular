import { Injectable } from '@angular/core';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { ConfigService } from '../config.service';
import { CartRequestsService } from './cart-requests.service';
import { b2b } from 'src/b2b';
import { b2bCart } from 'src/integration/b2b-cart';
import { CartDocumentType } from '../enums/cart-document-type.enum';
import { DateHelper } from 'src/app/helpers/date-helper';
import { CartDetailRealizationType } from './enums/cart-detail-realization-type.enum';
import { CartDetailType } from './enums/cart-detail-type.enum';
import { CheckQuoteValidationEnum } from './enums/validation/check-quote-validation.enum';
import { CartCommonService } from './cart-common.service';
import { CartCheckService } from './cart-check.service';
import { RealizationValidationEnum } from './enums/validation/realization-validation.enum';
import { AddressValidationEnum } from './enums/validation/address-validation.enum';
import { DeliveryMethodValidationEnum } from './enums/validation/delivery-method-validation.enum';
import { PaymentDateValidationEnum } from './enums/validation/payment-date-validation.enum';
import { PaymentFormValidationEnum } from './enums/validation/payment-form-validation.enum';
import { RealizationDateValidationEnum } from './enums/validation/realization-date-validation.enum';
import { WarehouseValidationEnum } from './enums/validation/warehouse-validation.enum';
import { ApplicationType } from '../enums/application-type.enum';
import { ValidationTypeEnum } from './enums/validation/validation-type.enum';
import { WarehousesService } from '../warehouses.service';
import { AddressType } from '../shared/enums/address-type.enum';

@Injectable()
export class CartHeaderService {

    get isCartFromQuote(): boolean { return this.cartCommonService.isCartFromQuote; }

    get selectedDocumentId(): CartDocumentType { return this.cartCommonService.selectedDocumentId; }

    get headerData(): b2b.CartHeader { return this.cartCommonService.headerData; }
    set headerData(header: b2b.CartHeader) { this.cartCommonService.headerData = header; }

    get orderAttributes(): b2bCartHeader.CartHeaderAttribute[] { return this.cartCommonService.orderAttributes; }
    set orderAttributes(orderAttributes) { this.cartCommonService.orderAttributes = orderAttributes; }
    get inquiryAttributes(): b2bCartHeader.CartHeaderAttribute[] { return this.cartCommonService.inquiryAttributes; }
    set inquiryAttributes(inquiryAttributes) { this.cartCommonService.inquiryAttributes = inquiryAttributes; }
    get attributes(): b2b.CartHeaderAttribute[] { return this.cartCommonService.attributes; }
    set attributes(attributes) { this.cartCommonService.attributes = attributes; }

    get headerPermissions(): b2bCartHeader.CartHeaderPermisions { return this.cartCommonService.headerPermissions; }
    set headerPermissions(headerPermissions) { this.cartCommonService.headerPermissions = headerPermissions; }

    get isCartHeaderCorrect(): boolean { return this.cartCommonService.isCartHeaderCorrect; }
    set isCartHeaderCorrect(isCartHeaderCorrect) { this.cartCommonService.isCartHeaderCorrect = isCartHeaderCorrect; }

    get headerValidationSummary(): b2bCartHeader.CartHeaderSimpleValidationXlObject { return this.cartCommonService.headerValidationSummary; }
    set headerValidationSummary(headerValidationSummary) { this.cartCommonService.headerValidationSummary = headerValidationSummary; }

    get headerSavingSummary() { return this.cartCommonService.headerSavingSummary; }
    set headerSavingSummary(headerSavingSummary) { this.cartCommonService.headerSavingSummary = headerSavingSummary; }

    get isQuoteValid(): boolean { return this.cartCommonService.isQuoteValid; }
    set isQuoteValid(isQuoteValid) { this.cartCommonService.isQuoteValid = isQuoteValid; }

    deliveryMethods: b2bCartHeader.DeliveryMethodOption[];
    paymentForms: b2bCartHeader.PaymentFormOption[];
    shippingAddresses: b2bCartHeader.ShippingAddressOption[];
    shippingAddressesXl: b2bCartHeader.ShippingAddressXl[];
    warehouses: b2bCartHeader.WarehouseOption[];

    deliveryLoaded: boolean;
    paymentsLoaded: boolean;
    adressesLoaded: boolean;
    warehousesLoaded: boolean;

    constructor(
        private configService: ConfigService,
        private cartRequestsService: CartRequestsService,
        private cartCommonService: CartCommonService,
        private cartCheckService: CartCheckService,
        private warehousesService: WarehousesService) {

        this.headerData = {};
    }

    initCartHeaderXl(cartHeader: b2bCartHeader.CartHeaderXl, attributes: b2bCartHeader.CartHeaderAttributes) {
        this.updateCartHeaderXl(cartHeader);
        this.initCartHeaderBase(cartHeader, attributes);
        this.initDeliveryMethods(cartHeader.deliveryMethodName, cartHeader.deliveryMethodName);
        this.initShippingAddressesXl(cartHeader.shippingAddress);
    }

    initCartHeaderAltum(cartHeader: b2bCartHeader.CartHeaderAltum, attributes: b2bCartHeader.CartHeaderAttributes) {
        this.updateCartHeaderAltum(cartHeader);
        this.initCartHeaderBase(cartHeader, attributes);
        this.initDeliveryMethods(cartHeader.deliveryMethodId.toString(), cartHeader.deliveryMethodName);
        this.initShippingAddressesAltum(cartHeader.addressId, cartHeader.addressName);
    }

    private initCartHeaderBase(cartHeader: b2bCartHeader.CartHeaderBase, attributes: b2bCartHeader.CartHeaderAttributes) {
        if (this.isCartFromQuote) {
            this.headerPermissions = this.initQuoteCartHeaderPermissions();
        } else {
            this.headerPermissions = this.initCartHeaderPermissions();
        }
        this.initCartHeaderAttributesBase(attributes);

        this.initPaymentForms(cartHeader.paymentFormId, cartHeader.paymentFormName);
        this.initWarehouses(cartHeader.warehouseId, cartHeader.warehouseName);
        this.headerSavingSummary = {};
    }

    private initQuoteCartHeaderPermissions(): b2bCartHeader.CartHeaderPermisions {
        const permissions = this.configService.permissions;
        return {
            hasAccessToChangeCompletionEntirely: permissions.hasAccessToChangeCompletionEntirelyInQuotes,
            hasAccessToChangeDeliveryMethod: permissions.hasAccessToChangeDeliveryMethodInQuotes,
            hasAccessToChangePaymentDate: permissions.hasAccessToChangePaymentDateInQuotes,
            hasAccessToChangePaymentForm: permissions.hasAccessToChangePaymentFormInQuotes,
            hasAccessToChangeRealizationTime: permissions.hasAccessToChangeReceiptDateInQuotes,
            hasAccessToChangeWarehouse: permissions.hasAccessToChangeWarehouseInQuotes,
            hasAccessToShowDeliveryMethod: permissions.hasAccessToShowDeliveryMethodInQuotes
        };
    }

    private initCartHeaderPermissions(): b2bCartHeader.CartHeaderPermisions {
        const permissions = this.configService.permissions;
        return {
            hasAccessToChangeCompletionEntirely: permissions.hasAccessToMarkOrderToEntirelyRealization,
            hasAccessToChangeDeliveryMethod: permissions.hasAccessToChangeDeliveryMethod,
            hasAccessToChangePaymentDate: permissions.hasAccessToChangePaymentDateTime,
            hasAccessToChangePaymentForm: permissions.hasAccessToChangePaymentMethod,
            hasAccessToChangeRealizationTime: permissions.hasAccessToChangeRealizationTime,
            hasAccessToChangeWarehouse: permissions.hasAccessToChangeDefaultWarehouse && permissions.hasAccessToChangeOrderWarehouse,
            hasAccessToShowDeliveryMethod: permissions.hasAccessToShowDeliveryMethod
        };
    }

    initHeaderValidationSummary() {
        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.initHeaderValidationSummaryXl();

            case ApplicationType.ForAltum:
                return this.initHeaderValidationSummaryAltum();

            default:
                console.error(`initHeaderValidationSummary(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
                break;
        }
    }

    private initHeaderValidationSummaryXl() {
        const isAddressValid = this.headerData.shippingAddress && Number.isInteger(this.headerData.addressId);
        this.initHeaderValidationSummaryBase(isAddressValid);
    }

    private initHeaderValidationSummaryAltum() {
        const isAddressValid = !!this.headerData.address && !!this.headerData.address.trim() && Number.isInteger(this.headerData.addressId);
        this.initHeaderValidationSummaryBase(isAddressValid);
    }

    private initHeaderValidationSummaryBase(isAddressValid: boolean) {
        this.headerValidationSummary = {
            isAddressValid,
            isCompletionEntirelyValid: true,
            isDeliveryMethodValid: true,
            isPaymentDateValid: !this.headerPermissions.hasAccessToChangePaymentDate || !!this.headerData.dueDate,
            isPaymentFormValid: !this.headerPermissions.hasAccessToChangePaymentForm || !!this.headerData.paymentForm && !!this.headerData.paymentForm.trim() && Number.isInteger(this.headerData.paymentFormId),
            isRealizationDateValid: !this.headerPermissions.hasAccessToChangeRealizationTime || !!this.headerData.receiptDate,
            isWarehouseValid: !this.headerPermissions.hasAccessToChangeWarehouse || Number.isInteger(this.headerData.warehouseId) && ((!!this.headerData.warehouseName && !!this.headerData.warehouseName.trim()) || this.headerData.warehouseId === 0),
            quoteValidationEnum: CheckQuoteValidationEnum.Success,
            validationType: ValidationTypeEnum.OnlyNotEmpty
        };
        this.isCartHeaderCorrect = this.isCartHeaderCorrectXl(this.headerValidationSummary);
    }

    private initDeliveryMethods(deliveryMethodName: string, deliveryMethodTranslationName: string) {
        this.deliveryLoaded = false;

        this.deliveryMethods = [{
            name: deliveryMethodName,
            translationName: deliveryMethodTranslationName
        }];
    }

    loadDeliveryMethodsIfRequired(cartId: number): void {
        if (!this.deliveryLoaded) {
            this.cartRequestsService.requestDeliveryMethods(cartId).then((res: b2bCartHeader.DeliveryMethodOption[]) => {

                if (res && res.length > 0) {
                    this.deliveryMethods = res.map((item: b2bCartHeader.DeliveryMethodOption, index) => {
                        return {
                            id: index,
                            name: item.name.toString(),
                            translationName: item.translationName
                        };
                    });
                }
                this.deliveryLoaded = true;
            });
        }
    }

    private initPaymentForms(paymentFormId: number, paymentFormName: string) {
        this.paymentsLoaded = false;

        this.paymentForms = [{
            id: paymentFormId,
            name: paymentFormName
        }];
    }

    loadPaymentFormsIfRequired(cartId: number): void {
        if (!this.paymentsLoaded) {
            this.cartRequestsService.requestPaymetForms(cartId).then((res: b2bCartHeader.PaymentFormOption[]) => {
                this.paymentsLoaded = true;

                if (res && res.length > 0) {
                    this.paymentForms = res;
                }
            });
        }
    }

    private initShippingAddressesXl(shippingAddress: b2bCartHeader.ShippingAddressXl) {
        this.adressesLoaded = false;
        this.shippingAddressesXl = this.calculateShippingAddressesXl([shippingAddress]);
    }

    private calculateShippingAddressesXl(addresses: b2bCartHeader.ShippingAddressXl[]) {
        if (!addresses) {
            return addresses;
        }
        return addresses.map(address => {
            return this.calculateShippingAddressXl(address);
        });
    }

    private calculateShippingAddressXl(address: b2bCartHeader.ShippingAddressXl) {
        if (!address) {
            return address;
        }
        return {
            ...address,
            addressType: address.isTempAddress ? AddressType.Temp : AddressType.Perm,
        };
    }


    private initShippingAddressesAltum(addressId: number, addressName: string) {
        this.adressesLoaded = false;

        this.shippingAddresses = [{
            id: addressId,
            name: addressName
        }];
    }

    loadShippingAddressesIfRequired(cartId: number): void {
        if (this.adressesLoaded) {
            return;
        }

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.loadShippingAddressesXl(cartId);

            case ApplicationType.ForAltum:
                return this.loadShippingAddressesAltum(cartId);

            default:
                console.error(`loadShippingAddressesIfRequired(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
                break;
        }
    }

    private loadShippingAddressesXl(cartId: number): void {
        this.cartRequestsService.getShippingAddressesXlRequest(cartId).then((res: b2bCartHeader.GetShippingAddressXlResponse) => {
            this.adressesLoaded = true;
            this.shippingAddressesXl = this.calculateShippingAddressesXl(res.shippingAddresses);
        });
    }

    private loadShippingAddressesAltum(cartId: number): void {
        this.cartRequestsService.getShippingAddressesAltumRequest(cartId).then((res: b2bCartHeader.ShippingAddressOption[]) => {
            this.adressesLoaded = true;

            if (res && res.length > 0) {
                this.shippingAddresses = res;
            }
        });
    }


    addShippingAddresses(shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.addShippingAddressesXl(shippingAddressModel, isAddressTemp);

            default:
                console.error(`addShippingAddresses(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
                break;
        }
    }

    private addShippingAddressesXl(shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.shippingAddress);

        const request = this.prepareAddShippingAddressesRequest(shippingAddressModel, isAddressTemp);
        return this.cartRequestsService.addShippingAddressesXlRequest(request).then((res) => {
            this.setHeaderShippingAddress(res.shippingAddress);
            this.initShippingAddressesXl(this.headerData.shippingAddress);
            this.setHeaderFieldStatusToSaved(CartDetailType.shippingAddress);
        });
    }

    private prepareAddShippingAddressesRequest(shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): b2bCartHeader.AddShippingAddressXlRequest {
        return {
            shippingAddressModel,
            isAddressTemp,
            cartId: this.cartCommonService.cartId,
        };
    }

    updateShippingAddresses(addressId: number, shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                return this.updateShippingAddressesXl(addressId, shippingAddressModel, isAddressTemp);

            default:
                console.error(`updateShippingAddresses(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
                break;
        }
    }

    private updateShippingAddressesXl(addressId: number, shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.shippingAddress);

        const request = this.prepareUpdateShippingAddressesRequest(shippingAddressModel, isAddressTemp);
        return this.cartRequestsService.updateShippingAddressesXlRequest(addressId, request).then(() => {
            this.initShippingAddressAfterUpdate(addressId, shippingAddressModel);
            this.setHeaderFieldStatusToSaved(CartDetailType.shippingAddress);
        });
    }

    private prepareUpdateShippingAddressesRequest(shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel, isAddressTemp: boolean): b2bCartHeader.UpdateShippingAddressXlRequest {
        return {
            shippingAddressModel,
            cartId: this.cartCommonService.cartId,
            isAddressTemp,
        };
    }

    private initShippingAddressAfterUpdate(addressId: number, shippingAddressModel: b2bCartHeader.ShippingAddressRequestModel): void {
        if (this.headerData
            && this.headerData.shippingAddress
            && this.headerData.shippingAddress.addressId === addressId) {

            const address = {
                ...this.headerData.shippingAddress,
                street: shippingAddressModel.street,
                zipCode: shippingAddressModel.zipCode,
                city: shippingAddressModel.city,
            };

            this.setHeaderShippingAddress(address);
        }

        this.initShippingAddressesXl(this.headerData.shippingAddress);
    }

    private initWarehouses(warehouseId: number, warehouseName: string) {
        this.warehousesLoaded = false;

        this.warehouses = [{
            id: warehouseId,
            name: warehouseName
        }];
    }

    loadWarehousesIfRequired(cartId: number): void {
        if (!this.warehousesLoaded) {
            this.cartRequestsService.requestWarehouses(cartId).then((res: b2bCartHeader.WarehouseOption[]) => {
                this.warehousesLoaded = true;

                if (res && res.length > 0) {
                    this.warehouses = res;
                }
            });
        }
    }

    updateHeaderAttribute(index: number, value = this.attributes[index].value): Promise<void> {
        this.attributes[index].value = value;
        if (this.selectedDocumentId === CartDocumentType.inquiry) {
            this.inquiryAttributes[index].value = value;
        } else {
            this.orderAttributes[index].value = value;
        }

        const attributeReq: b2b.CartHeaderAttributeRequest = {
            applicationId: this.attributes[index].applicationId || this.configService.applicationId,
            attributeClassId: this.attributes[index].attributeClassId,
            documentId: this.attributes[index].documentId || this.selectedDocumentId,
            headerId: this.attributes[index].headerId || this.headerData.headerId,
            itemId: 0, //hardcoded
            type: this.attributes[index].type,
            value: this.attributes[index].value
        };

        return this.cartRequestsService.updateHeaderAttributeRequest(attributeReq).then(() => {
            this.cartCommonService.checkAttributesValidity();
            this.refreshOrderButtonValidity();
        });
    }

    updateSourceNumberXl(cartId: number, newSourceNumber: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.sourceNumber);
        return this.cartRequestsService.updateSourceNumberXlRequest(<b2bCartHeader.UpdateSourceNumberRequest>{ cartId: cartId, newSourceNumber: newSourceNumber }).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.sourceNumber);
        });
    }

    updateSourceNumberAltum(cartId: number, newSourceNumber: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.sourceNumber);
        return this.cartRequestsService.updateSourceNumberAltumRequest(<b2bCartHeader.UpdateSourceNumberRequest>{ cartId: cartId, newSourceNumber: newSourceNumber }).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.sourceNumber);
        });
    }

    updateDescriptionXl(cartId: number, description: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.description);
        return this.cartRequestsService.updateDescriptionXlRequest(<b2bCartHeader.UpdateDescriptionRequest>{ cartId: cartId, newDescription: description }).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.description);
        });
    }

    updateDescriptionAltum(cartId: number, description: string): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.description);
        return this.cartRequestsService.updateDescriptionAltumRequest(<b2bCartHeader.UpdateDescriptionRequest>{ cartId: cartId, newDescription: description }).then(() => {
            this.setHeaderFieldStatusToSaved(CartDetailType.description);
        });
    }

    updateAddressXl(cartId: number, addressId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.shippingAddress);
        return this.cartRequestsService.updateAddressXlRequest(<b2bCartHeader.UpdateAddressRequest>{ cartId: cartId, addressId: addressId }).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.shippingAddress);
            this.setHeaderFieldStatusToSaved(CartDetailType.shippingAddress);
            this.refreshOrderButtonValidity();
        });
    }

    updateAddressAltum(cartId: number, addressId: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.shippingAddress);
        return this.cartRequestsService.updateAddressAltumRequest(<b2bCartHeader.UpdateAddressRequest>{ cartId: cartId, addressId: addressId }).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.shippingAddress);
            this.setHeaderFieldStatusToSaved(CartDetailType.shippingAddress);
            this.refreshOrderButtonValidity();
        });
    }

    updateRealizationDateXl(cartId: number, realizationDate: Date): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.realizationDate);
        return this.cartRequestsService.updateRealizationDateXlRequest(<b2bCartHeader.UpdateRealizationDateRequest>{ cartId: cartId, realisationDate: DateHelper.dateToString(realizationDate) }).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.realizationDate);
            this.setHeaderFieldStatusToSaved(CartDetailType.realizationDate);
            this.refreshOrderButtonValidity();
        });
    }

    updateRealizationDateAltum(cartId: number, realizationDate: Date): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.realizationDate);
        return this.cartRequestsService.updateRealizationDateAltumRequest(<b2bCartHeader.UpdateRealizationDateRequest>{ cartId: cartId, realisationDate: DateHelper.dateToString(realizationDate) }).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.realizationDate);
            this.setHeaderFieldStatusToSaved(CartDetailType.realizationDate);
            this.refreshOrderButtonValidity();
        });
    }

    updateRealizationXl(cartId: number, realizationType: CartDetailRealizationType): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.realization);
        return this.cartRequestsService.updateRealizationXlRequest(<b2bCartHeader.UpdateRealizationRequest>{ cartId: cartId, realisationType: realizationType.valueOf() }).then(() => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.realization);
            this.setHeaderFieldStatusToSaved(CartDetailType.realization);
            this.refreshOrderButtonValidity();
        });
    }

    updateDeliveryMethodXl(cartId: number, deliveryMethod: string, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.deliveryMethod);
        const request: b2bCartHeader.UpdateDeliveryMethodXlRequest = { cartId: cartId, deliveryMethod: deliveryMethod, pageNumber: pageNumber };
        return this.cartRequestsService.updateDeliveryMethodXlRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.deliveryMethod);
            this.cartCommonService.updateCartProductsWithPriceBase(res.cartSummary, res.items);
            this.refreshOutdatedProductsWithPriceBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.deliveryMethod);
            this.refreshOrderButtonValidity();
        });
    }

    updateDeliveryMethodAltum(cartId: number, deliveryMethod: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.deliveryMethod);
        const request: b2bCartHeader.UpdateDeliveryMethodAltumRequest = { cartId: cartId, deliveryMethod: deliveryMethod };
        return this.cartRequestsService.updateDeliveryMethodAltumRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.deliveryMethod);
            this.cartCommonService.updateCartSummaryBase(res.cartSummary);
            this.setHeaderFieldStatusToSaved(CartDetailType.deliveryMethod);
            this.refreshOrderButtonValidity();
        });
    }


    updatePaymentFormXl(cartId: number, paymentFormId: number, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentForm);
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bCartHeader.UpdatePaymentFormRequest = { cartId: cartId, paymentFormId: paymentFormId, pageNumber: pageNumber };
        return this.cartRequestsService.updatePaymentFormXlRequest(request).then((res: b2bCartHeader.IUpdatePaymentFormXlResponse) => {
            this.setPaymentDate(res.newPaymentDate);
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.paymentForm);
            this.cartCommonService.updateCartProductsWithPriceBase(res.cartSummary, res.items);
            this.refreshOutdatedProductsWithPriceBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updatePaymentFormAltum(cartId: number, paymentFormId: number, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentForm);
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bCartHeader.UpdatePaymentFormRequest = { cartId: cartId, paymentFormId: paymentFormId, pageNumber: pageNumber };
        return this.cartRequestsService.updatePaymentFormAltumRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.paymentForm);
            this.cartCommonService.updateCartProductsWithPriceBase(res.cartSummary, res.items);
            this.refreshOutdatedProductsWithPriceBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentForm);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }


    updatePaymentDateXl(cartId: number, paymentDate: Date, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        const request: b2bCartHeader.UpdatePaymentDateXlRequest = { cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate), pageNumber: pageNumber };
        return this.cartRequestsService.updatePaymentDateXlRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.paymentDate);
            this.cartCommonService.updateCartProductsWithPriceBase(res.cartSummary, res.items);
            this.refreshOutdatedProductsWithPriceBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updatePaymentDateAltum(cartId: number, paymentDate: Date): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.paymentDate);
        return this.cartRequestsService.updatePaymentDateAltumRequest(<b2bCartHeader.UpdatePaymentDateAltumRequest>{ cartId: cartId, paymentDate: DateHelper.dateToString(paymentDate) }).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.paymentDate);
            this.setHeaderFieldStatusToSaved(CartDetailType.paymentDate);
            this.refreshOrderButtonValidity();
        });
    }

    updateWarehouseXl(cartId: number, warehouseId: number, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.warehouse);
        const request: b2bCartHeader.UpdateWarehouseRequest = { cartId: cartId, warehouseId: warehouseId, pageNumber: pageNumber };
        return this.cartRequestsService.updateWarehouseXlRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredXl(CartDetailType.warehouse);
            this.cartCommonService.updateCartProductsWithPriceAndStockStateXl(res.cartSummary, res.items, res.stockLevelModeBehaviour);
            this.refreshOutdatedProductsWithPriceAndStockLevelBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.warehouse);
            this.refreshOrderButtonValidity();
        });
    }

    updateWarehouseAltum(cartId: number, warehouseId: number, pageNumber: number): Promise<void> {
        this.setHeaderFieldStatusToProcessing(CartDetailType.warehouse);
        const request: b2bCartHeader.UpdateWarehouseRequest = { cartId: cartId, warehouseId: warehouseId, pageNumber: pageNumber };
        return this.cartRequestsService.updateWarehouseAltumRequest(request).then((res) => {
            this.correctCartHeaderFieldValidationIfRequiredAltum(CartDetailType.warehouse);
            this.cartCommonService.updateCartProductsStockStateAltum(res.items, res.stockLevelModeBehaviour);
            this.cartCheckService.refreshOutdatedProductsStockLevelBase(res.items);
            this.setHeaderFieldStatusToSaved(CartDetailType.warehouse);
            this.refreshOrderButtonValidity();
        });
    }

    setPaymentDate(newPaymentDateString: string) {
        this.headerData.dueDate = <Date>DateHelper.stringToDate(newPaymentDateString);
    }


    repairCartHeaderXl(cartId: number): Promise<void> {
        const request: b2bCartHeader.RepairCartHeaderXlRequest = { cartId: cartId };
        return this.cartRequestsService.repairCartHeaderXlRequest(request).then(res => this.inCaseSuccessRepairCartHeaderXl(res));
    }

    repairCartHeaderAltum(cartId: number): Promise<void> {
        const request: b2bCartHeader.RepairCartHeaderAltumRequest = { cartId: cartId };
        return this.cartRequestsService.repairCartHeaderAltumRequest(request).then(res => this.inCaseSuccessRepairCartHeaderAltum(res));
    }

    private inCaseSuccessRepairCartHeaderXl(response: b2bCartHeader.RepairCartHeaderXlResponse) {
        this.updateCartHeaderXl(response.cartHeader);
        this.inCaseSuccessRepairCartHeaderBase(response.cartHeader);
        this.initDeliveryMethods(response.cartHeader.deliveryMethodName, response.cartHeader.deliveryMethodName);
        this.initShippingAddressesXl(response.cartHeader.shippingAddress);

        this.cartCommonService.updateCartProductsWithPriceAndStockStateXl(response.cartSummary, response.items, response.stockLevelBehaviourEnum);
        this.refreshOrderButtonValidity();
    }

    private inCaseSuccessRepairCartHeaderAltum(response: b2bCartHeader.RepairCartHeaderAltumResponse) {
        this.updateCartHeaderAltum(response.cartHeader);
        this.inCaseSuccessRepairCartHeaderBase(response.cartHeader);
        this.initDeliveryMethods(response.cartHeader.deliveryMethodId.toString(), response.cartHeader.deliveryMethodName);
        this.initShippingAddressesAltum(response.cartHeader.addressId, response.cartHeader.addressName);

        this.cartCommonService.updateCartProductsWithPriceAndStockStateAltum(response.cartSummary, response.items, response.stockLevelBehaviourEnum);
        this.refreshOrderButtonValidity();
    }

    private inCaseSuccessRepairCartHeaderBase(cartHeader: b2bCartHeader.CartHeaderBase) {
        this.isCartHeaderCorrect = true;
        this.headerValidationSummary = null;

        this.initPaymentForms(cartHeader.paymentFormId, cartHeader.paymentFormName);
        this.initWarehouses(cartHeader.warehouseId, cartHeader.warehouseName);
    }

    correctCartHeaderFieldValidationIfRequiredXl(fieldType: CartDetailType) {
        if (this.isCartHeaderCorrect || !this.headerValidationSummary) {
            return;
        }
        this.correctSingleHeaderFieldValidity(fieldType);
        this.isCartHeaderCorrect = this.isCartHeaderCorrectXl(this.headerValidationSummary);
    }

    correctCartHeaderFieldValidationIfRequiredAltum(fieldType: CartDetailType) {
        if (this.isCartHeaderCorrect || !this.headerValidationSummary) {
            return;
        }
        this.correctSingleHeaderFieldValidity(fieldType);
        this.isCartHeaderCorrect = this.isCartHeaderCorrectAltum(this.headerValidationSummary);
    }

    correctCartHeaderFieldValidationIfRequiredBoth(fieldType: CartDetailType) {
        if (this.isCartHeaderCorrect || !this.headerValidationSummary) {
            return;
        }

        this.correctSingleHeaderFieldValidity(fieldType);

        switch (this.configService.applicationId) {
            case ApplicationType.ForXL:
                this.isCartHeaderCorrect = this.isCartHeaderCorrectXl(this.headerValidationSummary);
                break;

            case ApplicationType.ForAltum:
                this.isCartHeaderCorrect = this.isCartHeaderCorrectAltum(this.headerValidationSummary);
                break;

            default:
                console.error(`correctCartHeaderField(ERROR): Not implemented action for application type: ${this.configService.applicationId}`);
                break;
        }
    }

    private correctSingleHeaderFieldValidity(fieldType: CartDetailType) {
        switch (fieldType) {
            case CartDetailType.deliveryMethod:
                this.headerValidationSummary.isDeliveryMethodValid = true;
                break;
            case CartDetailType.paymentDate:
                this.headerValidationSummary.isPaymentDateValid = true;
                break;
            case CartDetailType.paymentForm:
                this.headerValidationSummary.isPaymentFormValid = true;
                break;
            case CartDetailType.realizationDate:
                this.headerValidationSummary.isRealizationDateValid = true;
                break;
            case CartDetailType.shippingAddress:
                this.headerValidationSummary.isAddressValid = true;
                break;
            case CartDetailType.warehouse:
                this.headerValidationSummary.isWarehouseValid = true;
                break;
            case CartDetailType.realization:
                this.headerValidationSummary.isCompletionEntirelyValid = true;
                break;
        }
    }

    setHeaderValidationSummaryXl(headerValidationObject: b2bCartHeader.CartHeaderValidationObjectXl) {
        const validation = this.prepareHeaderSimpleValidationSummaryXl(headerValidationObject, ValidationTypeEnum.Full);

        this.setHeaderSimpleValidationSummaryXl(validation);
        this.headerValidationSummary = validation;
        this.isCartHeaderCorrect = this.isCartHeaderCorrectXl(validation);
    }

    setHeaderValidationSummaryAltum(headerValidationObject: b2bCartHeader.CartHeaderValidationObjectAltum) {
        const validation = this.prepareHeaderSimpleValidationSummaryAltum(headerValidationObject, ValidationTypeEnum.Full);

        this.setHeaderSimpleValidationSummaryAltum(validation);
        this.headerValidationSummary = validation;
        this.isCartHeaderCorrect = this.isCartHeaderCorrectAltum(validation);
    }


    private prepareHeaderSimpleValidationSummaryXl(headerValidationSummary: b2bCartHeader.CartHeaderValidationObjectXl, validationType: ValidationTypeEnum) {
        return {
            ...this.prepareHeaderSimpleValidationSummaryBase(headerValidationSummary, validationType),
            isCompletionEntirelyValid: headerValidationSummary.completionEntirelyValidateEnum === RealizationValidationEnum.Success
        } as b2bCartHeader.CartHeaderSimpleValidationXlObject;
    }

    private prepareHeaderSimpleValidationSummaryAltum(headerValidationSummary: b2bCartHeader.CartHeaderValidationObjectAltum, validationType: ValidationTypeEnum) {
        return {
            ...this.prepareHeaderSimpleValidationSummaryBase(headerValidationSummary, validationType),
            isCompletionEntirelyValid: false //TODO temp
        } as b2bCartHeader.CartHeaderSimpleValidationAltumObject;
    }

    private prepareHeaderSimpleValidationSummaryBase(headerValidationSummary: b2bCartHeader.CartHeaderValidationObjectBase, validationType: ValidationTypeEnum): b2bCartHeader.CartHeaderSimpleValidationBaseObject {
        return {
            isAddressValid: headerValidationSummary.addressValidationResult === AddressValidationEnum.Success,
            isDeliveryMethodValid: headerValidationSummary.deliveryMethodValidateResult === DeliveryMethodValidationEnum.Success,
            isPaymentDateValid: headerValidationSummary.paymentDateValidateResult === PaymentDateValidationEnum.Success,
            isPaymentFormValid: headerValidationSummary.paymentFormValidateResult === PaymentFormValidationEnum.Success,
            isRealizationDateValid: headerValidationSummary.realisationDateValidateResult === RealizationDateValidationEnum.Success,
            isWarehouseValid: headerValidationSummary.warehouseValidateResult === WarehouseValidationEnum.Success,
            quoteValidationEnum: headerValidationSummary.cartHeaderCheckExecuteQuoteResultEnum,
            validationType
        };
    }

    private setHeaderSimpleValidationSummaryXl(validation: b2bCartHeader.CartHeaderSimpleValidationXlObject) {
        if (!validation.isAddressValid) {
            this.initShippingAddressesXl(this.headerData.shippingAddress);
        }

        this.setHeaderSimpleValidationSummaryBase(validation);
    }

    private setHeaderSimpleValidationSummaryAltum(validation: b2bCartHeader.CartHeaderSimpleValidationAltumObject) {
        if (!validation.isAddressValid) {
            this.initShippingAddressesAltum(this.headerData.addressId, this.headerData.address);
        }

        this.setHeaderSimpleValidationSummaryBase(validation);
    }


    private setHeaderSimpleValidationSummaryBase(validation: b2bCartHeader.CartHeaderSimpleValidationBaseObject) {
        if (!validation.isDeliveryMethodValid) {
            this.initDeliveryMethods(this.headerData.deliveryMethod, this.headerData.translationDeliveryMethod);
        }

        if (!validation.isPaymentFormValid) {
            this.initPaymentForms(this.headerData.paymentFormId, this.headerData.paymentForm);
        }

        if (!validation.isWarehouseValid) {
            this.initWarehouses(this.headerData.warehouseId, this.headerData.warehouseName);
        }

        this.isQuoteValid = validation.quoteValidationEnum === CheckQuoteValidationEnum.Success
            || validation.quoteValidationEnum === CheckQuoteValidationEnum.CartIsNotFromQuote;
    }

    private isCartHeaderCorrectXl(validation: b2bCartHeader.CartHeaderSimpleValidationXlObject) {
        return this.isCartHeaderCorrectBase(validation) && validation.isCompletionEntirelyValid;
    }

    private isCartHeaderCorrectAltum(validation: b2bCartHeader.CartHeaderSimpleValidationXlObject) {
        return this.isCartHeaderCorrectBase(validation);
    }

    private isCartHeaderCorrectBase(validation: b2bCartHeader.CartHeaderSimpleValidationBaseObject) {
        return validation.isAddressValid
            && validation.isDeliveryMethodValid
            && validation.isPaymentDateValid
            && validation.isPaymentFormValid
            && validation.isRealizationDateValid
            && validation.isWarehouseValid;
    }

    private updateCartHeaderBase(cartHeader: b2bCartHeader.CartHeaderBase) {
        this.headerData.headerId = cartHeader.headerId;
        this.headerData.translationDeliveryMethod = cartHeader.deliveryMethodName;
        this.headerData.description = cartHeader.description;
        this.headerData.dueDate = new Date(cartHeader.paymentDate);
        this.headerData.paymentFormId = cartHeader.paymentFormId;
        this.headerData.paymentForm = cartHeader.paymentFormName;
        this.headerData.receiptDate = new Date(cartHeader.realisationDate);
        this.headerData.sourceNumber = cartHeader.sourceNumber;
        this.headerData.warehouseId = cartHeader.warehouseId;
        this.headerData.warehouseName = cartHeader.warehouseName;
        this.headerData.fromQuote = cartHeader.fromQuote;
        this.headerData.quoteNumber = cartHeader.quoteNumber;
    }

    private updateCartHeaderXl(cartHeader: b2bCartHeader.CartHeaderXl) {
        this.updateCartHeaderBase(cartHeader);
        this.headerData.completionEntirely = cartHeader.completionType;
        this.headerData.deliveryMethod = cartHeader.deliveryMethodName;
        this.setHeaderShippingAddress(this.calculateShippingAddressXl(cartHeader.shippingAddress));
    }

    private setHeaderShippingAddress(address: b2bCartHeader.ShippingAddressXl) {
        this.headerData.shippingAddress = address;
        this.headerData.addressId = address ? address.addressId : null;
    }

    private updateCartHeaderAltum(cartHeader: b2bCartHeader.CartHeaderAltum) {
        this.updateCartHeaderBase(cartHeader);
        this.headerData.deliveryMethod = cartHeader.deliveryMethodId.toString();
        this.headerData.addressId = cartHeader.addressId;
        this.headerData.address = cartHeader.addressName;
    }

    private initCartHeaderAttributesBase(attributes: b2bCartHeader.CartHeaderAttributes) {
        this.orderAttributes = attributes.orderAttributes;
        this.inquiryAttributes = attributes.inquiryAttributes;

        this.cartCommonService.setCorrectAttributesType();
    }

    private refreshOrderButtonValidity() {
        this.cartCommonService.refreshOrderButtonValidity();
    }

    refreshOutdatedProductsWithPriceAndStockLevelBase(refreshProducts: b2bCart.CartArticleListItemWithStockLevelBase[]) {
        this.cartCheckService.refreshOutdatedProductsWithPriceAndStockLevelBase(refreshProducts);
    }

    refreshOutdatedProductsWithPriceBase(refreshProducts: b2bCart.CartArticleListItemBase[]) {
        this.cartCheckService.refreshOutdatedProductsWithPriceBase(refreshProducts);
    }

    setHeaderFieldStatusToProcessing(fieldType: CartDetailType) {
        this.setSingleHeaderFieldSavingStatus(fieldType, true);
    }

    setHeaderFieldStatusToSaved(fieldType: CartDetailType) {
        this.setSingleHeaderFieldSavingStatus(fieldType, false);
    }

    private setSingleHeaderFieldSavingStatus(fieldType: CartDetailType, isSaving: boolean) {
        switch (fieldType) {
            case CartDetailType.deliveryMethod:
                this.headerSavingSummary.isDeliveryMethodSaving = isSaving;
                break;
            case CartDetailType.paymentDate:
                this.headerSavingSummary.isPaymentDateSaving = isSaving;
                break;
            case CartDetailType.paymentForm:
                this.headerSavingSummary.isPaymentFormSaving = isSaving;
                break;
            case CartDetailType.realizationDate:
                this.headerSavingSummary.isRealizationDateSaving = isSaving;
                break;
            case CartDetailType.shippingAddress:
                this.headerSavingSummary.isAddressSaving = isSaving;
                break;
            case CartDetailType.warehouse:
                this.headerSavingSummary.isWarehouseSaving = isSaving;
                break;
            case CartDetailType.sourceNumber:
                this.headerSavingSummary.isSourceNumberSaving = isSaving;
                break;
            case CartDetailType.description:
                this.headerSavingSummary.isDescriptionSaving = isSaving;
                break;
            case CartDetailType.realization:
                this.headerSavingSummary.isRealizationSaving = isSaving;
                break;
        }
    }
}
