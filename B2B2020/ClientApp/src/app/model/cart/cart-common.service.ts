import { Injectable } from '@angular/core';
import { StockLevelBehavoiurEnum } from './enums/stock-level-behavoiur.enum';
import { b2bCartCheck } from 'src/integration/b2b-cart-check';
import { CartDocumentType } from '../enums/cart-document-type.enum';
import { CreditLimitBehaviourEnum } from '../shared/enums/credit-limit-behaviour.enum';
import { b2bCart } from 'src/integration/b2b-cart';
import { b2b } from 'src/b2b';
import { b2bShared } from 'src/integration/b2b-shared';
import { ConvertingUtils } from '../../helpers/converting-utils';
import { ConfigService } from '../config.service';
import { CartRequestsService } from './cart-requests.service';
import { CustomerService } from '../customer.service';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { Pagination } from '../shared/pagination';
import { PriceMode } from '../enums/price-mode.enum';
import { Subject } from 'rxjs';
import { Config } from '../../helpers/config';
import { MaxQuantityDisplayType } from '../shared/enums/max-quantity-type.enum';

@Injectable()
export class CartCommonService {

    private _cartId: number;
    get cartId() { return this._cartId; }
    set cartId(cartId) { this._cartId = cartId; }

    private _cartName: string;
    get cartName() { return this._cartName; }

    private _isCartFromQuote: boolean;
    get isCartFromQuote() { return this._isCartFromQuote; }
    set isCartFromQuote(isCartFromQuote) { this._isCartFromQuote = isCartFromQuote; }

    private _isValid: boolean;
    get isValid() { return this._isValid; }
    set isValid(isValid: boolean) { this._isValid = isValid; }

    private _productsConfig: b2bShared.ProductTableConfig;
    get productsConfig() { return this._productsConfig; }

    private _columns: b2b.ColumnConfig[];
    get columns() { return this._columns; }

    private _pagination: Pagination;
    get pagination() { return this._pagination; }


    private _products: b2b.CartProduct[];
    get products() { return this._products; }
    set products(products) { this._products = products; }

    private _outdatedProductsDetails: b2bCartCheck.CheckCartSummaryObjectBase[];
    get outdatedProductsDetails() { return this._outdatedProductsDetails; }
    set outdatedProductsDetails(outdatedProductsDetails) {
        this._outdatedProductsDetails = outdatedProductsDetails;
        if (this._outdatedProductsDetails) {
            this.adjustOutdatedProductsDetails(this._outdatedProductsDetails);
            this._outdatedDetailsChanged.next(this.prepareOutdatedDetails(this._outdatedProductsDetails.slice()));
        }
    }

    private _outdatedDetailsChanged: Subject<b2bCartCheck.OutdatedDetails>;
    get outdatedDetailsChanged() { return this._outdatedDetailsChanged; }

    private _outdatedProductsSummary: b2bCartCheck.CheckCartSummaryDetailsBase;
    get outdatedProductsSummary() { return this._outdatedProductsSummary; }
    set outdatedProductsSummary(outdatedProductsSummary) { this._outdatedProductsSummary = outdatedProductsSummary; }


    private _cartProductsSummaries: b2b.CartSummary[];
    get cartProductsSummaries() { return this._cartProductsSummaries; }
    set cartProductsSummaries(cartProductsSummaries) { this._cartProductsSummaries = cartProductsSummaries; }

    private _summaries: b2b.CartSummary[];
    get summaries() { return this._summaries; }
    set summaries(summaries) { this._summaries = summaries; }

    private _delivery: b2b.CartSummary;
    get delivery() { return this._delivery; }
    set delivery(delivery) { this._delivery = delivery; }

    private _weight: b2b.CartWeight;
    get weight() { return this._weight; }
    set weight(weight) { this._weight = weight; }


    private _headerData: b2b.CartHeader;
    get headerData() { return this._headerData; }
    set headerData(header) { this._headerData = header; }

    private _attributes: b2b.CartHeaderAttribute[];
    get attributes() { return this._attributes; }
    set attributes(attributes) { this._attributes = attributes; }

    private _orderAttributes: b2bCartHeader.CartHeaderAttribute[];
    get orderAttributes() { return this._orderAttributes; }
    set orderAttributes(orderAttributes) { this._orderAttributes = orderAttributes; }

    private _wasOrderAttributesChecked: boolean;
    get wasOrderAttributesChecked() { return this._wasOrderAttributesChecked; }

    private _inquiryAttributes: b2bCartHeader.CartHeaderAttribute[];
    get inquiryAttributes() { return this._inquiryAttributes; }
    set inquiryAttributes(inquiryAttributes) { this._inquiryAttributes = inquiryAttributes; }

    private _wasInquiryAttributesChecked: boolean;
    get wasInquiryAttributesChecked() { return this._wasInquiryAttributesChecked; }

    private _headerPermissions: b2bCartHeader.CartHeaderPermisions;
    get headerPermissions() { return this._headerPermissions; }
    set headerPermissions(headerPermissions) { this._headerPermissions = headerPermissions; }

    private _headerValidationSummary: b2bCartHeader.CartHeaderSimpleValidationXlObject;
    get headerValidationSummary() { return this._headerValidationSummary; }
    set headerValidationSummary(headerValidationSummary) { this._headerValidationSummary = headerValidationSummary; }

    private _headerSavingSummary: b2bCartHeader.CartHeaderSavingSummary;
    get headerSavingSummary() { return this._headerSavingSummary; }
    set headerSavingSummary(headerSavingSummary) { this._headerSavingSummary = headerSavingSummary; }

    private _isCartHeaderCorrect: boolean;
    get isCartHeaderCorrect() { return this._isCartHeaderCorrect; }
    set isCartHeaderCorrect(isCartHeaderCorrect) { this._isCartHeaderCorrect = isCartHeaderCorrect; }

    private _areCartAttributesValid: boolean;
    get areCartAttributesValid() { return this._areCartAttributesValid; }
    set areCartAttributesValid(areCartAttributesValid) { this._areCartAttributesValid = areCartAttributesValid; }

    private _isQuoteValid: boolean;
    get isQuoteValid() { return this._isQuoteValid; }
    set isQuoteValid(isQuoteValid) { this._isQuoteValid = isQuoteValid; }


    private _hasValidCartCheckDetails: boolean;
    get hasValidCartCheckDetails() { return this._hasValidCartCheckDetails; }
    set hasValidCartCheckDetails(hasValidCartCheckDetails) { this._hasValidCartCheckDetails = hasValidCartCheckDetails; }


    private _selectedDocumentId: CartDocumentType;
    get selectedDocumentId() { return this._selectedDocumentId; }
    set selectedDocumentId(selectedDocumentId) { this._selectedDocumentId = selectedDocumentId; }

    private _forbiddenOrder: boolean;
    get forbiddenOrder() { return this._forbiddenOrder; }
    set forbiddenOrder(isForbidden) { this._forbiddenOrder = isForbidden; }

    private _orderNumber: string;
    get orderNumber() { return this._orderNumber; }
    set orderNumber(orderNumber) { this._orderNumber = orderNumber; }


    private _stockLevelBehaviour: StockLevelBehavoiurEnum;
    get stockLevelBehaviour() { return this._stockLevelBehaviour; }
    set stockLevelBehaviour(stockLevelBehaviour) { this._stockLevelBehaviour = stockLevelBehaviour; }

    private _creditLimitBehaviour: CreditLimitBehaviourEnum;
    get creditLimitBehaviour() { return this._creditLimitBehaviour; }
    set creditLimitBehaviour(creditLimitBehaviour) { this._creditLimitBehaviour = creditLimitBehaviour; }

    constructor(
        private configService: ConfigService,
        private cartRequestsService: CartRequestsService,
        private customerService: CustomerService) {

        this.selectedDocumentId = CartDocumentType.order;
        this._pagination = new Pagination();
        this._productsConfig = <b2bShared.ProductTableConfig>{
            priceMode: PriceMode.both,
            haveProductsDescription: true,
            productDescriptionMaxLength: Config.maxDescriptionLength,
            canEditProductsDescription: true,
            hasRemoveButton: true
        };
        this._columns = [
            { property: 'remove', translation: ' ', type: 'remove' },
            { property: 'name', translation: 'article', type: 'productName' },
            { property: 'subtotalPrice', translation: 'netPrice', type: 'priceWithConverter', priceConverter: 'basicUnitSubtotalPrice' },
            { property: 'totalPrice', translation: 'grossPrice', type: 'priceWithConverter', priceConverter: 'basicUnitTotalPrice' },
            { property: 'quantity', type: 'quantityWithStepper' },
            { property: 'discount', type: 'percent' },
            { property: 'subtotalValue', translation: 'netValue', type: 'price', summaryProperty: 'netAmount' },
            { property: 'totalValue', translation: 'grossValue', type: 'price', summaryProperty: 'grossAmount' },
            { property: 'currency' }
        ];

        this._outdatedDetailsChanged = new Subject();
    }


    private refreshProductsReference() {
        if (this.products) {
            this._products = this._products.slice();
        }
    }

    updateCartName(cartName: string) {
        this._cartName = cartName;
    }

    setCorrectProductsStatusIfPossible() {
        if (this.selectedDocumentId === CartDocumentType.order) {
            this.products.forEach((currentProduct) => {
                this.setCorrectProductStatusIfPossible(currentProduct);
            });
        }
    }

    private adjustOutdatedProductsDetails(outdatedProductsDetails: b2bCartCheck.CheckCartSummaryObjectBase[]) {
        outdatedProductsDetails.forEach(product => {
            if (product.cartItem.unit.auxiliaryUnit.unit) {
                product.cartItem.unit.converter = ConvertingUtils.unitConverterString(product.cartItem.unit.denominator.value, product.cartItem.unit.auxiliaryUnit.unit, product.cartItem.unit.numerator.value, product.cartItem.unit.basicUnit);
            }
        });
    }

    private prepareOutdatedDetails(outdatedProductsDetails: b2bCartCheck.CheckCartSummaryObjectBase[]) {
        const unavailableCartItems = outdatedProductsDetails
            .filter(
                product => product.cartArticleListItemValidationSummary.hasInvalidUnit ||
                    product.cartArticleListItemValidationSummary.isNotAvailable)
            .map(product => product.cartItem);

        return {
            allOutdatedProducts: outdatedProductsDetails,
            unavailableCartItems: unavailableCartItems
        } as b2bCartCheck.OutdatedDetails;
    }

    private setCorrectProductStatusIfPossible(currentProduct) {
        currentProduct.status = null;
        if (!this.outdatedProductsDetails || this.outdatedProductsDetails.length === 0) {
            return;
        }
        const outdatedDetails = this.outdatedProductsDetails.find(details => details.cartItem.itemId === currentProduct.itemId);
        if (!outdatedDetails) {
            return;
        }

        const validationSummary = outdatedDetails.cartArticleListItemValidationSummary;
        currentProduct.status = {
            warning: validationSummary.hasExceededState && this.stockLevelBehaviour !== StockLevelBehavoiurEnum.NothingToDo,
            danger: validationSummary.hasOutdatedPrice,
            outdated: validationSummary.hasInvalidUnit || validationSummary.isNotAvailable,
            info: validationSummary.hasIncorrectQuantity
        };
    }


    updateCartSummaryBase(cartSummaryBase: b2bCart.CartSummaryBase) {
        this.summaries = <b2b.CartSummary[]>cartSummaryBase.cartSummaryPricesList;
        this.cartProductsSummaries = <b2b.CartSummary[]>cartSummaryBase.cartSummaryItemsPricesList;
        this.weight = <b2b.CartWeight>cartSummaryBase.weightAndVolume;
        if (cartSummaryBase.delivery) {
            this.delivery = <b2b.CartSummary>cartSummaryBase.delivery;
        }
    }

    updateCartProductsWithPriceBase(cartSummary: b2bCart.CartSummaryBase, refreshedProducts: b2bCart.CartArticleListItemBase[]) {
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedProducts.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProduct(currentProduct, refreshedProduct);
            return currentProduct;
        });
        this.updateCartSummaryBase(cartSummary);
        this.refreshCreditLimitIfRequired();
    }

    private updateCartProduct(currentProduct: b2b.CartProduct, refreshedProductBase: b2bCart.CartArticleListItemBase) {
        this.updateCartProductBase(currentProduct, refreshedProductBase);
        this.updateCartProductPriceBase(currentProduct, refreshedProductBase.price);
        this.updateCartArticleBase(currentProduct, refreshedProductBase.article);
    }

    private updateCartProductBase(currentProduct: b2b.CartProduct, refreshedProductBase: b2bCart.CartArticleListItemBase) {
        currentProduct.itemId = refreshedProductBase.itemId;
        currentProduct.quantity = refreshedProductBase.quantity.value;
        this.updateCartProductDescription(currentProduct, refreshedProductBase.description);

        currentProduct.auxiliaryUnit = refreshedProductBase.unit.auxiliaryUnit.unit;
        currentProduct.basicUnit = refreshedProductBase.unit.basicUnit;
        currentProduct.defaultUnitNo = refreshedProductBase.unit.defaultUnitNo;
        currentProduct.isUnitTotal = refreshedProductBase.unit.isUnitTotal ? 1 : 0;
        currentProduct.denominator = refreshedProductBase.unit.denominator.value;
        currentProduct.numerator = refreshedProductBase.unit.numerator.value;

        currentProduct.unit = refreshedProductBase.unit.auxiliaryUnit.representsExistingValue ? refreshedProductBase.unit.auxiliaryUnit.unit : refreshedProductBase.unit.basicUnit;
        currentProduct.converter = null;

        if (refreshedProductBase.unit.auxiliaryUnit.representsExistingValue) {
            currentProduct.converter = ConvertingUtils.unitConverterString(currentProduct.denominator, refreshedProductBase.unit.auxiliaryUnit.unit, currentProduct.numerator, currentProduct.basicUnit);
        }
    }

    updateCartProductDescription(currentProduct: b2b.CartProduct, description: string) {
        currentProduct.description = description;
        if (description && description.length > Config.collapsedDescriptionLength) {
            currentProduct.collapsedDescription = description.slice(0, Config.collapsedDescriptionLength) + '...';
            currentProduct.isDescriptionOverflow = true;
        } else {
            currentProduct.collapsedDescription = description;
            currentProduct.isDescriptionOverflow = false;
        }
    }

    private updateCartProductPriceBase(currentProduct: b2b.CartProduct, refreshedPriceBase: b2bShared.ArticlePriceBase) {
        currentProduct.discount = refreshedPriceBase.discount;
        currentProduct.currency = refreshedPriceBase.currency;
        currentProduct.subtotalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.subtotalPrice);
        currentProduct.subtotalValue = refreshedPriceBase.subtotalValue;
        currentProduct.totalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.totalPrice);
        currentProduct.totalValue = refreshedPriceBase.totalValue;
        currentProduct.basicUnitSubtotalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.subtotalUnitPrice.value);
        currentProduct.basicUnitTotalPrice = ConvertingUtils.stringToNum(refreshedPriceBase.totalUnitPrice.value);
    }

    private updateCartArticleBase(currentProduct: b2b.CartProduct, refreshedArticleBase: b2bShared.ArticleBase) {
        currentProduct.id = refreshedArticleBase.id;
        currentProduct.code = refreshedArticleBase.code.value;
        currentProduct.name = refreshedArticleBase.name;
        currentProduct.imageId = refreshedArticleBase.imageId.value;
        currentProduct.type = refreshedArticleBase.type;
        currentProduct.discountAllowed = refreshedArticleBase.discountPermission;


        if (currentProduct.name.length > 50) {
            currentProduct.name = currentProduct.name.substring(0, 50).trim() + '...';
        }
    }

    updateCartProductsWithPriceAndStockStateXl(cartSummary: b2bCart.CartSummaryXl, refreshedCartItems: b2bCart.CartArticleListItemWithStockLevelXl[], stockLevelModeBehaviour: StockLevelBehavoiurEnum) {
        this.updateCartProductsWithPriceAndStockStateBase(cartSummary, refreshedCartItems, stockLevelModeBehaviour);
    }

    updateCartProductsWithPriceAndStockStateAltum(cartSummary: b2bCart.CartSummaryAltum, refreshedCartItems: b2bCart.CartArticleListItemWithStockLevelAltum[], stockLevelModeBehaviour: StockLevelBehavoiurEnum) {
        this.updateCartProductsWithPriceAndStockStateBase(cartSummary, refreshedCartItems, stockLevelModeBehaviour);
    }

    updateCartProductsWithPriceAndStockStateBase(cartSummary: b2bCart.CartSummaryBase, refreshedCartItems: b2bCart.CartArticleListItemWithStockLevelBase[], stockLevelModeBehaviour: StockLevelBehavoiurEnum) {
        this.stockLevelBehaviour = stockLevelModeBehaviour;
        this.refreshCreditLimitIfRequired();
        this.products = this.products.map((currentProduct) => {
            const refreshedProduct = refreshedCartItems.find(product => product.itemId === currentProduct.itemId);
            this.updateCartProductWithPriceAndStockStateBase(currentProduct, refreshedProduct);
            return currentProduct;
        });
        this.updateCartSummaryBase(cartSummary);
    }

    initCartProductsWithPriceAndStockStateBase(cartItems: b2bCart.CartArticleListItemWithStockLevelBase[]) {
        const products: b2b.CartProduct[] = [];
        cartItems.forEach(cartItem => {
            const product = <b2b.CartProduct>{};
            this.updateCartProductWithPriceAndStockStateBase(product, cartItem);
            products.push(product);
        });
        this.products = products;
    }

    updateCartProductWithPriceAndStockStateBase(currentProduct: b2b.CartProduct, refreshedProduct: b2bCart.CartArticleListItemWithStockLevelBase) {
        this.updateCartProduct(currentProduct, refreshedProduct);
        this.updateCartProductStockState(currentProduct, refreshedProduct);
        return currentProduct;
    }

    updateCartProductsStockStateAltum(stockStateItems: b2bCart.CartItemStockLevelAltum[], stockLevelModeBehaviour: StockLevelBehavoiurEnum) {
        this.updateCartProductsStockStateBase(stockStateItems, stockLevelModeBehaviour);
    }

    updateCartProductsStockStateBase(stockStateItems: b2bCart.CartItemStockLevelBase[], stockLevelModeBehaviour: StockLevelBehavoiurEnum) {
        this.stockLevelBehaviour = stockLevelModeBehaviour;
        this.products = this.products.map((currentProduct) => {
            const refreshedItem = stockStateItems.find(item => item.itemId === currentProduct.itemId);
            this.updateCartProductStockState(currentProduct, refreshedItem);
            return currentProduct;
        });
    }

    private updateCartProductStockState(currentProduct: b2b.CartProduct, refreshedData: b2bCart.CartItemStockStateBase) {
        currentProduct.articleExceededStates = refreshedData.exceededStates.hasExceededStates;
        currentProduct.stockLevel = refreshedData.stockLevel.value;
        currentProduct.stockLevelNumber = ConvertingUtils.stringToNum(currentProduct.stockLevel);
        currentProduct.stockLevelBehaviour = refreshedData.stockLevelBehaviour;

        currentProduct.isQuantityChangeBlocked = refreshedData.quantity.isQuantityChangeBlocked;
        currentProduct.maxQuantityType = refreshedData.quantity.maxQuantityType;

        this.calculateCartProductStockState(currentProduct, this.selectedDocumentId);
    }

    private calculateCartProductStockState(currentProduct: b2b.CartProduct, selectedDocumentType: CartDocumentType) {
        switch (selectedDocumentType) {
            case CartDocumentType.inquiry:
                currentProduct.max = null;
                currentProduct.warn = false;
                currentProduct.disabled = false;
                break;
            default:
                currentProduct.max = currentProduct.maxQuantityType === MaxQuantityDisplayType.InStock ? currentProduct.stockLevelNumber : null;
                currentProduct.warn = currentProduct.stockLevelBehaviour !== StockLevelBehavoiurEnum.NothingToDo;
                currentProduct.disabled = currentProduct.isQuantityChangeBlocked || currentProduct.max === 0;
        }

        return currentProduct;
    }


    updateProductsStockLevelAfterCheckCart(outdatedProductsDetails: b2bCartCheck.CheckCartSummaryObjectBase[]) {
        this.products.forEach((currentProduct) => {
            const refreshedOutdatedProduct = outdatedProductsDetails.find(product => product.cartItem.itemId === currentProduct.itemId);
            if (!refreshedOutdatedProduct) {
                return currentProduct;
            }

            this.updateCartProductStockState(currentProduct, refreshedOutdatedProduct.cartItem);
            return currentProduct;
        });
    }

    updateCartProductsAfterUpdateItemQuantity(response: b2bCart.UpdateItemQuantityBaseResponse) {
        this.stockLevelBehaviour = response.stockLevelModeBehaviour;
        this.updateCartSummaryBase(response.cartSummary);

        const currentProduct = this.products.find(item => item.itemId === response.cartItem.itemId);
        if (currentProduct) {
            this.updateCartProductWithPriceAndStockStateBase(currentProduct, response.cartItem);
        }

        this.products.filter(item => item.id === response.cartItem.article.id).forEach(item => {
            item.articleExceededStates = response.cartItem.exceededStates.hasExceededStates;
            item.warn = this.selectedDocumentId === CartDocumentType.order
                && this.stockLevelBehaviour !== StockLevelBehavoiurEnum.NothingToDo && item.articleExceededStates;
        });
    }


    selectDocument(documentId: CartDocumentType) {

        this.selectedDocumentId = documentId;

        this.products.forEach((item) => {
            if (this.selectedDocumentId === CartDocumentType.inquiry) {
                item.status = null;
            } else {
                this.setCorrectProductStatusIfPossible(item);
            }

            this.calculateCartProductStockState(item, this.selectedDocumentId);
        });
        this.setCorrectAttributesType();
        this.refreshProductsConfig();
        this.refreshAttributesValidity();
        this.refreshOrderButtonValidity();
        this.refreshProductsReference(); //change reference for onPush table detection
    }

    private refreshProductsConfig() {
        if (this.selectedDocumentId === CartDocumentType.inquiry) {
            this._productsConfig.haveProductsDescription = false;
        } else {
            this._productsConfig.haveProductsDescription = true;
        }
    }

    setCorrectAttributesType() {
        if (this.selectedDocumentId === CartDocumentType.inquiry) {
            this.attributes = Object.assign([], <any>this.inquiryAttributes);
        } else {
            this.attributes = Object.assign([], <any>this.orderAttributes);
        }
    }


    refreshCreditLimitIfRequired(): Promise<void> {
        if (!this.configService.config.generateConfirmedOrders) {
            return Promise.resolve();
        }
        const request: b2bCart.GetCreditLimitBehavoiurRequest = { cartId: this.cartId };
        return this.cartRequestsService.getCreditLimitBehavoiurRequest(request).then(res => {
            this.creditLimitBehaviour = res.creditLimitBehaviour;
            this.customerService.refreshCreditInfo();
            this.refreshOrderButtonValidity();
        });
    }

    refreshOrderButtonValidity() {
        this.isValid = this.validate();
    }

    validate(): boolean {

        if (this.configService.config === undefined || this.headerData === undefined) {
            return false;
        }

        const baseValidation = !this.forbiddenOrder
            && !this.wasOrderAttributesChecked || this.selectedDocumentId === CartDocumentType.order && this.areCartAttributesValid
            && !this.wasInquiryAttributesChecked || this.selectedDocumentId === CartDocumentType.inquiry && this.areCartAttributesValid;

        if (this.selectedDocumentId === CartDocumentType.inquiry) {
            return baseValidation;
        }

        return baseValidation
            && !this.configService.config.orderBlock //changes only when log in or log out
            && this.creditLimitBehaviour !== CreditLimitBehaviourEnum.ShowErrorAndBlockOperation
            && this.stockLevelBehaviour !== StockLevelBehavoiurEnum.ShowErrorAndBlockOperation
            && this.validateHeaderData()
            && this.hasValidCartCheckDetails;
    }

    validateHeaderData(): boolean {

        const validCompletion = this.configService.applicationId === 1
            || !this.headerPermissions.hasAccessToChangeCompletionEntirely
            || (this.configService.applicationId === 0 && this.headerPermissions.hasAccessToChangeCompletionEntirely && Number.isInteger(this.headerData.completionEntirely));

        return validCompletion
            && this.isCartHeaderCorrect
            && this.isQuoteValid;
    }

    refreshAttributesValidity() {
        this.areCartAttributesValid = this.validateAttributes();
    }

    checkAttributesValidity() {
        if (this.selectedDocumentId === CartDocumentType.order) {
            this._wasOrderAttributesChecked = true;
        } else {
            this._wasInquiryAttributesChecked = true;
        }
        this.areCartAttributesValid = this.validateAttributes();
    }

    private validateAttributes(): boolean {
        if (!this.attributes || this.attributes.length === 0) {
            return true;
        }

        if (this.attributes.length === 1) {
            const current = this.attributes[0];
            if (current.required) {
                if (current.type === 3) {
                    return Number.parseFloat(current.value) > 0;
                }
                return !!current.value;
            }
            return true;
        }

        return (<any>this.attributes).reduce((reduced: boolean & b2b.CartHeaderAttribute, current: b2b.CartHeaderAttribute, i) => {
            if (i === 1 && reduced.required && !reduced.value) {
                return false;
            }

            if (current.required) {
                if (current.type === 3) {
                    return reduced && Number.parseFloat(current.value) > 0;
                }
                return reduced && !!current.value;
            }
            return !!reduced;
        });
    }

    initCartValidation() {
        this.isQuoteValid = true;
        this.headerValidationSummary = null;
        this.isCartHeaderCorrect = true;
        this.areCartAttributesValid = true;
        this._wasOrderAttributesChecked = false;
        this._wasInquiryAttributesChecked = false;
    }
}
