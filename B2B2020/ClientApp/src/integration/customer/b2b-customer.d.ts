export module b2bCustomer {

    interface GetCustomerAttributeResponseBase {
        attributes: CustomerAttribute[];
    }
    interface GetCustomerAttributeResponseXl extends GetCustomerAttributeResponseBase { }
    interface GetCustomerAttributeResponseAltum extends GetCustomerAttributeResponseBase { }


    interface CustomerAttribute {
        type: number;
        name: string;
        value: string;
    }
}
