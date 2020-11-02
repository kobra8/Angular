import { BoxMessageClass } from './app/model/shared/enums/box-message-class.enum';
import { BoxMessageType } from './app/model/shared/enums/box-message-type.enum';

export module b2bShared {

    interface RepresentsExistingValueBase {
        representsExistingValue: boolean;
    }

    interface ImageId extends RepresentsExistingValueBase {
        value: number;
    }

    interface ArticleCode extends RepresentsExistingValueBase {
        value: string;
    }

    interface CalculatingParameter extends RepresentsExistingValueBase {
        value: number;
    }

    interface WeightAndVolume {
        weightGross: number;
        volume: number;
    }

    interface RemainingCustomerLimit {
        creditLimit: number;
        customerCurrency: string;
    }

    interface OldPaginationRequestParams {

        skip: number;
        take: number;
    }

    interface Price extends RepresentsExistingValueBase {
        value: string;
    }

    interface AuxiliaryUnit extends RepresentsExistingValueBase {
        unit: string;
    }

    interface ArticleBase {
        id: number;
        imageId: ImageId;
        name: string;
        type: number;
        code: ArticleCode;
        discountPermission: boolean;
    }

    interface ArticleXl extends ArticleBase {
        reverseCharge: boolean;
        basePriceNo: number;
    }

    interface ArticleAltum extends ArticleBase { }

    interface ArticlePriceBase {
        currency: string;
        discount: string;
        subtotalPrice: string;
        totalPrice: string;
        subtotalValue: string;
        totalValue: string;
        subtotalUnitPrice: b2bShared.Price;
        totalUnitPrice: b2bShared.Price;
    }

    interface ArticlePriceXl extends ArticlePriceBase {
        purchasePrice: number;
    }

    interface ArticlePriceAltum extends ArticlePriceBase { }


    interface ArticleUnits {
        auxiliaryUnit: AuxiliaryUnit;
        numerator: CalculatingParameter;
        denominator: CalculatingParameter;
        basicUnit: string;
        defaultUnitNo: number;
        isUnitTotal: boolean;
    }

    interface StockLevel extends RepresentsExistingValueBase {
        value: string;
    }

    interface ExceededStates extends RepresentsExistingValueBase {
        hasExceededStates: boolean;
    }

    interface AvailableCarts {
        cartsIds: number[];
    }

    interface BoxMessages {
        messages: BoxMessageType[];
        showBoxMessage: boolean;
        boxMessageClass: BoxMessageClass;
    }

}
