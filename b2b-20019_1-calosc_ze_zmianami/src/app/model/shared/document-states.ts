import { XLQuoteStatus } from '../enums/xl-quote-status.enum';
import { AltumDocumentStatus } from '../enums/altum-document-status.enum';
import { XlInquiryStatus } from '../enums/xl-inquiry-status.enum';
import { XlOrderStatus } from '../enums/xl-order-status.enum';

export class DocumentStates {

    static xlOrderStates = new Map<XlOrderStatus, string>()
        .set(XlOrderStatus.unconfirmed, 'orderStateNotConfirmed')
        .set(XlOrderStatus.confirmed, 'orderStateConfirmed')
        .set(XlOrderStatus.accepted, 'orderStateAccepted')
        .set(XlOrderStatus.inRealization, 'inRealization')
        .set(XlOrderStatus.canceledAfterConfirm, 'orderStateCanceledAfterConfirm')
        .set(XlOrderStatus.canceledAfterPending, 'orderStateCanceledAfterPending')
        .set(XlOrderStatus.closedAfterConfirm, 'orderStateClosedAfterConfirm')
        .set(XlOrderStatus.closedAfterPending, 'orderStateClosedAfterPending')
        .set(XlOrderStatus.rejected, 'orderStateRejected')
        .set(XlOrderStatus.completed, 'orderStateCompleted');

    static xlInquiryStates = new Map<XlInquiryStatus, string>()
        .set(XlInquiryStatus.unconfirmed, 'inquiryStateUnconfirmed')
        .set(XlInquiryStatus.confirmed, 'inquiryStateConfirmed')
        .set(XlInquiryStatus.rejected, 'inquiryStateRejected');

    static xlQuoteStates = new Map<XLQuoteStatus, string>()
        .set(XLQuoteStatus.unconfirmed, 'quoteStateUnconfirmed')
        .set(XLQuoteStatus.confirmed, 'quoteStateConfirmed')
        .set(XLQuoteStatus.accepted, 'quoteStateAccepted')
        .set(XLQuoteStatus.rejected, 'quoteStateRejected')
        .set(XLQuoteStatus.sent, 'quoteStateSent')
        .set(XLQuoteStatus.orderCreated, 'quoteStateCreatedOrder');

    static xlPaymentStates = new Map<number, string>()
        .set(0, 'notApplied')
        .set(1, 'applied')
        .set(2, 'doNotApply');

    static xlDeliveryStates = new Map<number, string>()
        .set(1, 'inPreparation')
        .set(2, 'deliveryReady')
        .set(3, 'deliveryDuringLoading')
        .set(4, 'deliverySent')
        .set(5, 'deliveryDelivered')
        .set(6, 'deliveryReturned')
        .set(7, 'deliveryCanceled');

    static xlComplaintStates = new Map<number, string>() 
        .set(1, 'complaintStateUnconfirmed')
        .set(10, 'complaintStateConfirmed')
        .set(20, 'complaintStateInRealization')
        .set(30, 'complaintStateConsidered')
        .set(40, 'complaintStateClosed')
        .set(0, 'complaintStateConsistering')
        .set(1, 'complaintStateRecognized')
        .set(2, 'complaintStateRejected')
        .set(4, 'complaintStateCompleted');

    static altumAllStates = new Map<AltumDocumentStatus, string>()
        .set(AltumDocumentStatus.unconfirmed, 'unconfirmed')
        .set(AltumDocumentStatus.confirmed, 'confirmed')
        .set(AltumDocumentStatus.inRealization, 'inRealization')
        .set(AltumDocumentStatus.completed, 'completed')
        .set(AltumDocumentStatus.closed, 'documentStateClosed')
        .set(AltumDocumentStatus.canceled, 'canceled')
        .set(AltumDocumentStatus.accepted, 'accepted')
        .set(AltumDocumentStatus.rejected, 'rejected');

    private constructor() {}
}
