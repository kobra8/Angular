import { Injectable } from '@angular/core';
import { CartRequestsService } from './cart-requests.service';
import { b2bCartCheck } from 'src/integration/b2b-cart-check';
import { b2bCart } from 'src/integration/b2b-cart';
import { CartCheckResponseEnum } from './enums/cart-check-response.enum';
import { StockLevelBehavoiurEnum } from './enums/stock-level-behavoiur.enum';
import { CartCommonService } from './cart-common.service';
import { CreditLimitBehaviourEnum } from '../shared/enums/credit-limit-behaviour.enum';
import { ConfigService } from '../config.service';
import { CustomerService } from '../customer.service';

@Injectable()
export class CartCheckService {

    get outdatedProductsDetails(): b2bCartCheck.CheckCartSummaryObjectBase[] { return this.cartCommonService.outdatedProductsDetails; }
    set outdatedProductsDetails(outdatedProductsDetails) { this.cartCommonService.outdatedProductsDetails = outdatedProductsDetails; }

    get outdatedProductsSummary(): b2bCartCheck.CheckCartSummaryDetailsBase { return this.cartCommonService.outdatedProductsSummary; }
    set outdatedProductsSummary(outdatedProductsSummary) { this.cartCommonService.outdatedProductsSummary = outdatedProductsSummary; }

    get hasValidCartCheckDetails(): boolean { return this.cartCommonService.hasValidCartCheckDetails; }
    set hasValidCartCheckDetails(hasValidCartCheckDetails) { this.cartCommonService.hasValidCartCheckDetails = hasValidCartCheckDetails; }

    get creditLimitBehaviour(): CreditLimitBehaviourEnum { return this.cartCommonService.creditLimitBehaviour; }
    set creditLimitBehaviour(creditLimitBehaviour) { this.cartCommonService.creditLimitBehaviour = creditLimitBehaviour; }
    get stockLevelBehaviour(): StockLevelBehavoiurEnum { return this.cartCommonService.stockLevelBehaviour; }
    set stockLevelBehaviour(stockLevelBehaviour) { this.cartCommonService.stockLevelBehaviour = stockLevelBehaviour; }

    constructor(
        private cartRequestsService: CartRequestsService,
        private cartCommonService: CartCommonService,
        private configService: ConfigService,
        private customerService: CustomerService) {

        this.hasValidCartCheckDetails = true;
    }

    checkCartXl(cartId: number): Promise<b2bCartCheck.CheckCartXlResponse> {
        this.clearOutdatedProductDetails();
        const request = <b2bCartCheck.CheckCartXlRequest>{ cartId: cartId };
        return this.cartRequestsService.checkCartXlRequest(request).then(res => this.inCaseSuccessCheckCartXl(res));
    }

    checkCartAltum(cartId: number): Promise<b2bCartCheck.CheckCartAltumResponse> {
        this.clearOutdatedProductDetails();
        const request = <b2bCartCheck.CheckCartAltumRequest>{ cartId: cartId };
        return this.cartRequestsService.checkCartAltumRequest(request).then(res => this.inCaseSuccessCheckCartAltum(res));
    }

    inCaseSuccessCheckCartXl(res: b2bCartCheck.CheckCartXlResponse) {
        switch (res.cartCheckResponse) {
            case CartCheckResponseEnum.IsPossibleToOrder:
                this.inCaseIsPossibleToOrderBase(res);
                break;

            case CartCheckResponseEnum.IsNotPossibleToOrder:
                this.inCaseIsNotPossibleToOrderBase(res);
                break;
        }
        return res;
    }

    inCaseSuccessCheckCartAltum(res: b2bCartCheck.CheckCartAltumResponse) {
        switch (res.cartCheckResponse) {
            case CartCheckResponseEnum.IsPossibleToOrder:
                this.inCaseIsPossibleToOrderBase(res);
                break;

            case CartCheckResponseEnum.IsNotPossibleToOrder:
                this.inCaseIsNotPossibleToOrderBase(res);
                break;
        }
        return res;
    }

    private inCaseIsPossibleToOrderBase(res: b2bCartCheck.CheckCartBaseResponse) {
        this.updateCommonValuesInCaseCorrectCartHeaderBase(res.stockLevelBehaviourEnum, res.creditLimitBehaviourEnum);
        this.hasValidCartCheckDetails = true;
    }

    private inCaseIsNotPossibleToOrderBase(res: b2bCartCheck.CheckCartBaseResponse) {
        this.updateCommonValuesInCaseCorrectCartHeaderBase(res.stockLevelBehaviourEnum, res.creditLimitBehaviourEnum);
        this.outdatedProductsDetails = res.cartItemCheckSummaryObjects;
        this.updateOutdatedProductsSummary();
        this.setCorrectProductsStatusIfPossible();
        this.hasValidCartCheckDetails = false;
        this.cartCommonService.updateProductsStockLevelAfterCheckCart(res.cartItemCheckSummaryObjects); //TODO to refactor (refresh products states)
    }


    recalculatePricesXl(cartId: number): Promise<void> {
        const request = <b2bCartCheck.RecalculatePricesXlRequest>{ cartId: cartId };
        return this.cartRequestsService.recalculatePricesXlRequest(request).then(res => this.inCaseSuccessRecalculatePricesBase(res));
    }

    recalculatePricesAltum(cartId: number): Promise<void> {
        const request = <b2bCartCheck.RecalculatePricesAltumRequest>{ cartId: cartId };
        return this.cartRequestsService.recalculatePricesAltumRequest(request).then(res => this.inCaseSuccessRecalculatePricesBase(res));
    }

    private inCaseSuccessRecalculatePricesBase(response: b2bCartCheck.RecalculatePricesBaseResponse) {
        this.cartCommonService.updateCartProductsWithPriceBase(response.cartSummary, response.cartItems);
        this.refreshOutdatedProductsWithPriceBase(response.cartItems);
        this.refreshOrderButtonValidity();
    }

    repairQuantitiesXl(cartId: number): Promise<void> {
        const request = <b2bCartCheck.RepairQuantitiesXlRequest>{ cartId: cartId };
        return this.cartRequestsService.repairQuantitiesXlRequest(request).then(res => this.inCaseSuccessRepairQuantitiesBase(res));
    }

    repairQuantitiesAltum(cartId: number): Promise<void> {
        const request = <b2bCartCheck.RepairQuantitiesAltumRequest>{ cartId: cartId };
        return this.cartRequestsService.repairQuantitiesAltumRequest(request).then(res => this.inCaseSuccessRepairQuantitiesBase(res));
    }

    private inCaseSuccessRepairQuantitiesBase(res: b2bCartCheck.RepairQuantitiesBaseResponse) {
        this.cartCommonService.updateCartProductsWithPriceAndStockStateBase(res.cartSummary, res.items, res.stockLevelModeBehaviour);

        const request = { refreshedProductsWithPriceAndStockLevel: res.items, renewAllQuantities: true } as b2bCartCheck.RefreshOutdatedProductRequest;
        this.refreshOutdatedProductBase(request);
        this.setCorrectProductsStatusIfPossible();
        this.refreshOrderButtonValidity();
    }


    refreshOutdatedProductsAfterRemoveCartItem(removedItemId: number, productId: number, hasExceededStates: boolean) {
        if (this.outdatedProductsDetails && this.outdatedProductsDetails.length > 0) {
            const updateStockStatesOnSelectedProduct = { productId, hasExceededStates } as b2bCartCheck.StockStatesPerArticle;

            const request = {
                removedItemsIds: [removedItemId],
                updateStockStatesOnSelectedProduct
            } as b2bCartCheck.RefreshOutdatedProductRequest;

            this.refreshOutdatedProductBase(request);
        }
    }

    refreshOutdatedProductsAfterRemoveAllUnavailableCartItems(removedItemIds: number[]) {
        if (this.outdatedProductsDetails && this.outdatedProductsDetails.length > 0) {

            const request = {
                removedItemsIds: removedItemIds
            } as b2bCartCheck.RefreshOutdatedProductRequest;

            this.refreshOutdatedProductBase(request);
        }
    }

    refreshOutdatedProductsWithPriceAndStockLevelBase(refreshProducts: b2bCart.CartArticleListItemWithStockLevelBase[], renewAllPrices = true) {
        if (this.outdatedProductsDetails && this.outdatedProductsDetails.length > 0) {
            const request = { refreshedProductsWithPriceAndStockLevel: refreshProducts, renewAllPrices } as b2bCartCheck.RefreshOutdatedProductRequest;
            this.refreshOutdatedProductBase(request);
            this.setCorrectProductsStatusIfPossible();
        }
    }

    refreshOutdatedProductsWithPriceBase(refreshProducts: b2bCart.CartArticleListItemBase[], renewAllPrices = true) {
        if (this.outdatedProductsDetails && this.outdatedProductsDetails.length > 0) {
            const request = { refreshedProductsWithPrice: refreshProducts, renewAllPrices } as b2bCartCheck.RefreshOutdatedProductRequest;
            this.refreshOutdatedProductBase(request);
            this.setCorrectProductsStatusIfPossible();
        }
    }

    refreshOutdatedProductsStockLevelBase(refreshProductsStockLevel: b2bCart.CartItemStockLevelBase[]) { //TODO - tests
        if (this.outdatedProductsDetails && this.outdatedProductsDetails.length > 0) {
            const request = { refreshedProductsStockLevel: refreshProductsStockLevel } as b2bCartCheck.RefreshOutdatedProductRequest;
            this.refreshOutdatedProductBase(request);
            this.setCorrectProductsStatusIfPossible();
        }
    }

    private refreshOutdatedProductBase(refreshRequest: b2bCartCheck.RefreshOutdatedProductRequest) {
        if (refreshRequest.removedItemsIds && refreshRequest.removedItemsIds.length > 0) {
            this.updateOutdatedProductsAfterRemoveItems(refreshRequest.removedItemsIds);
        }

        if (!this.outdatedProductsDetails || this.outdatedProductsDetails.length === 0) {
            this.updateOutdatedProductsSummary();
            return;
        }

        if (refreshRequest.updateStockStatesOnSelectedProduct) {
            this.updateOutdatedProductsStockStateOnSelectedProduct(refreshRequest.updateStockStatesOnSelectedProduct);
        }

        if (refreshRequest.refreshedProductsWithPrice && refreshRequest.refreshedProductsWithPrice.length > 0) {
            this.updateOutdatedProductsWithPriceBase(refreshRequest.refreshedProductsWithPrice);
        }

        if (refreshRequest.refreshedProductsWithPriceAndStockLevel && refreshRequest.refreshedProductsWithPriceAndStockLevel.length > 0) {
            this.updateOutdatedProductsWithPriceAndStocksBase(refreshRequest.refreshedProductsWithPriceAndStockLevel);
        }

        if (refreshRequest.refreshedProductsStockLevel && refreshRequest.refreshedProductsStockLevel.length > 0) {
            this.updateOutdatedProductsStockStatesBase(refreshRequest.refreshedProductsStockLevel);
        }

        this.renewOutdatedProductsBase(refreshRequest.renewAllPrices, refreshRequest.renewAllQuantities);
    }

    private updateOutdatedProductsAfterRemoveItems(removedItemsIds: number[]) {
        this.outdatedProductsDetails = this.outdatedProductsDetails.filter(outdatedProduct => {
            return !removedItemsIds.includes(outdatedProduct.cartItem.itemId);
        });
    }

    private updateOutdatedProductsStockStateOnSelectedProduct(stockStatesPerArticle: b2bCartCheck.StockStatesPerArticle) {
        this.outdatedProductsDetails.forEach(outdatedProduct => {
            if (outdatedProduct.cartItem.article.id === stockStatesPerArticle.productId) {
                outdatedProduct.cartItem.exceededStates.hasExceededStates = stockStatesPerArticle.hasExceededStates;
                outdatedProduct.cartArticleListItemValidationSummary.hasExceededState = stockStatesPerArticle.hasExceededStates;
            }
        });
    }

    private updateOutdatedProductsWithPriceBase(refreshedProducts: b2bCart.CartArticleListItemBase[]) {
        refreshedProducts.forEach((refreshedProduct) => {
            this.outdatedProductsDetails.forEach(product => {
                if (product.cartItem.itemId === refreshedProduct.itemId) {
                    product.cartItem.article = refreshedProduct.article;
                    product.cartItem.price = refreshedProduct.price;
                    product.cartItem.unit = refreshedProduct.unit;
                    product.cartItem.itemId = refreshedProduct.itemId;
                    product.cartItem.quantity = refreshedProduct.quantity;
                    product.cartArticleListItemValidationSummary.hasOutdatedPrice = false;
                    return;
                }

                if (product.cartItem.article.id === refreshedProduct.article.id) {
                    product.cartArticleListItemValidationSummary.hasOutdatedPrice = false;
                }
            });
        });
    }

    private updateOutdatedProductsWithPriceAndStocksBase(refreshedProducts: b2bCart.CartArticleListItemWithStockLevelBase[]) {
        refreshedProducts.forEach((refreshedProduct) => {
            this.outdatedProductsDetails.forEach(product => {
                if (product.cartItem.itemId === refreshedProduct.itemId) {
                    product.cartItem = refreshedProduct;
                    product.cartArticleListItemValidationSummary.hasExceededState = refreshedProduct.exceededStates.hasExceededStates;
                    product.cartArticleListItemValidationSummary.hasOutdatedPrice = false;
                    return;
                }

                if (product.cartItem.article.id === refreshedProduct.article.id) {
                    product.cartArticleListItemValidationSummary.hasExceededState = refreshedProduct.exceededStates.hasExceededStates;
                    product.cartArticleListItemValidationSummary.hasOutdatedPrice = false;
                }
            });
        });
    }

    private updateOutdatedProductsStockStatesBase(refreshedProductStocks: b2bCart.CartItemStockLevelBase[]) { //TODO - tests
        refreshedProductStocks.forEach((refreshedProduct) => {
            this.outdatedProductsDetails.forEach(product => {
                if (product.cartItem.itemId === refreshedProduct.itemId) {
                    product.cartItem.exceededStates = refreshedProduct.exceededStates;
                    product.cartItem.stockLevel = refreshedProduct.stockLevel;
                    product.cartArticleListItemValidationSummary.hasExceededState = refreshedProduct.exceededStates.hasExceededStates;
                    return;
                }

                if (product.cartItem.article.id === refreshedProduct.article.id) {
                    product.cartArticleListItemValidationSummary.hasExceededState = refreshedProduct.exceededStates.hasExceededStates;
                }
            });
        });
    }

    private renewOutdatedProductsBase(renewAllPrices: boolean, renewAllQuantities: boolean) {
        this.outdatedProductsDetails = this.outdatedProductsDetails.reduce((total, currentOutdatedProduct) => {
            if (renewAllPrices) {
                currentOutdatedProduct.cartArticleListItemValidationSummary.hasOutdatedPrice = false;
            }

            if (renewAllQuantities) {
                currentOutdatedProduct.cartArticleListItemValidationSummary.hasIncorrectQuantity = false;
            }

            if (this.isProductStillOutdated(currentOutdatedProduct)) {
                total.push(currentOutdatedProduct);
            }
            return total;
        }, []);
        this.updateOutdatedProductsSummary();
    }

    private updateOutdatedProductsSummary() {
        if (!this.outdatedProductsDetails || this.outdatedProductsDetails.length === 0) {
            this.outdatedProductsSummary = null;
            this.hasValidCartCheckDetails = true;
            return;
        }

        const summary = {
            haveAnyExceededStates: false,
            haveAnyInvalidUnit: false,
            haveAnyOutDatedPrice: false,
            isAnyNotAllowed: false,
            haveAnyIncorrectQuantity: false
        } as b2bCartCheck.CheckCartSummaryDetailsBase;

        this.outdatedProductsDetails.forEach(item => {
            const validation = item.cartArticleListItemValidationSummary;
            if (!summary.haveAnyExceededStates && this.cartCommonService.stockLevelBehaviour === StockLevelBehavoiurEnum.ShowErrorAndBlockOperation) {
                summary.haveAnyExceededStates = validation.hasExceededState;
            }
            if (!summary.haveAnyInvalidUnit) {
                summary.haveAnyInvalidUnit = validation.hasInvalidUnit;
            }
            if (!summary.haveAnyOutDatedPrice) {
                summary.haveAnyOutDatedPrice = validation.hasOutdatedPrice;
            }
            if (!summary.isAnyNotAllowed) {
                summary.isAnyNotAllowed = validation.isNotAvailable;
            }
            if (!summary.haveAnyIncorrectQuantity) {
                summary.haveAnyIncorrectQuantity = validation.hasIncorrectQuantity;
            }
        });

        if (Object.values(summary).some(item => item)) {
            this.outdatedProductsSummary = summary;
            this.hasValidCartCheckDetails = false;
        } else {
            this.outdatedProductsSummary = null;
            this.hasValidCartCheckDetails = true;
        }
    }

    private isProductStillOutdated(outdatedProduct: b2bCartCheck.CheckCartSummaryObjectBase): boolean {
        const validationSummaryValues = Object.values(outdatedProduct.cartArticleListItemValidationSummary);
        return validationSummaryValues.some(item => item);
    }


    private updateCommonValuesInCaseCorrectCartHeaderBase(stockLevelBehaviour: StockLevelBehavoiurEnum, creditLimitBehaviour: CreditLimitBehaviourEnum) {
        this.stockLevelBehaviour = stockLevelBehaviour;
        this.creditLimitBehaviour = creditLimitBehaviour;
        if (this.configService.config.generateConfirmedOrders) {
            this.customerService.refreshCreditInfo();
        }
    }

    clearOutdatedProductDetails() {
        this.outdatedProductsDetails = null;
        this.outdatedProductsSummary = null;
        this.hasValidCartCheckDetails = true;
    }

    private refreshOrderButtonValidity() {
        this.cartCommonService.refreshOrderButtonValidity();
    }

    private setCorrectProductsStatusIfPossible() {
        this.cartCommonService.setCorrectProductsStatusIfPossible();
    }
}
