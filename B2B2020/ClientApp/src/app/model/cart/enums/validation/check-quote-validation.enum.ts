export const enum CheckQuoteValidationEnum {
    QuoteIsExpired = 1,
    QuoteIsAlreadyRealizedAndCustomerHasNoRightToGenerateManyOrdersFromOneQuote = 2,
    Success = 3,
    CartIsNotFromQuote = 4
}
