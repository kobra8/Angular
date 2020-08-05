import { VatDirectionEnum } from 'src/app/model/shared/enums/vat-direction.enum';

export module b2bProductDetails {

    interface GetLastOrderRequest {
        articleId: number;
    }

    interface GetPlannedDeliveriesRequest {
        articleId: number;
    }

    interface GetThresholdPriceListBaseRequest {
        articleId: number;
    }

    interface GetThresholdPriceListXlRequest extends GetThresholdPriceListBaseRequest {
        warehouseId: number;
        vatValue: number;
        currency: string;
    }

    interface GetThresholdPriceListAltumRequest extends GetThresholdPriceListBaseRequest { }

    //------responses

    interface GetLastOrderResponse {
        isLastOrderPresent: boolean;
        lastOrderDetails: LastOrderDetailsResponse;
    }

    interface GetPlannedDeliveriesResponse {
        plannedDeliveries: PlannedDelivery[];
        isPlannedDeliveriesListPresent: boolean;
    }

    interface GetThresholdPriceListBaseResponse {
        constPriceThresholdPriceList: ConstThresholdPriceListBase[];
        hasAnyThresholdPriceList: boolean;
    }

    interface GetThresholdPriceListXlResponse extends GetThresholdPriceListBaseResponse {
        constPriceThresholdPriceList: ConstThresholdPriceListXl[];
        valuableThresholdPriceList: ValuableThresholdPriceListXl[];
        percentageThresholdPriceList: PercentageThresholdPriceListXl[];
    }

    interface GetThresholdPriceListAltumResponse extends GetThresholdPriceListBaseResponse {
        constPriceThresholdPriceList: ConstThresholdPriceListAltum[];
    }


    //Other

    interface LastOrderDetailsResponse {
        issueDate: string;
        orderNumber: string;
        price: number;
        basicUnitPrice: number;
        currency: string;
        quantity: number;
        auxiliaryUnit: string;
        quantityInBasicUnit: number;
        basicUnit: string;
        isOrderInBasicUnit: boolean;
        orderId: number;
        vatDirection: VatDirectionEnum;
    }

    interface LastOrderDetails extends LastOrderDetailsResponse {
        unit: string;
        converter: string;
    }

    interface PlannedDelivery {
        plannedDate: Date;
        quantityInBasicUnit: number;
        basicUnit: number;
    }


    interface ConstThresholdPriceListBase {
        netPrice: number;
        grossPrice: number;
        currency: string;
        unit: string;
        unitId: number;
        thresholdQuantity: number;
    }

    interface ConstThresholdPriceListXl extends ConstThresholdPriceListBase { }
    interface ConstThresholdPriceListAltum extends ConstThresholdPriceListBase { }

    interface ValuableThresholdPriceListXl {
        netValue: number;
        grossValue: number;
        currency: string;
        thresholdQuantity: number;
    }
    interface PercentageThresholdPriceListXl {
        value: number;
        thresholdQuantity: number;
    }

    interface ThresholdPriceLists {
        hasAnyThresholdPriceList: boolean;
        constPriceThresholdPriceList: ConstThresholdPriceListBase[];
        valuableThresholdPriceList?: ValuableThresholdPriceListXl[];
        percentageThresholdPriceList?: PercentageThresholdPriceListXl[];
    }
}
