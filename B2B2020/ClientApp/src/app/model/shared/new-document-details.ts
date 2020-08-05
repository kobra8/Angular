import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { b2b } from 'src/b2b';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';
import { PrintHandlerService } from './printhandler.service';
import { BoxMessageClass } from './enums/box-message-class.enum';
import { BoxMessageType } from './enums/box-message-type.enum';
import { b2bShared } from 'src/integration/b2b-shared';


/**
 * Base object for new documents lists (after swagger and refactoring api)
 * T - Details intrface
 * */
export abstract class NewDocumentDetails<T> implements Resolve<ThisType<any>> {

    id: number;
    detailsBoxMessages: b2bShared.BoxMessages;
    details: T & b2b.NewCustomerListDetails;
    abstract headerResource: string;

    constructor(
        protected httpClient: HttpClient,
        protected configService: ConfigService,
        protected printHandlerService: PrintHandlerService) { }


    protected abstract requestDetails(id: number): Promise<T & b2b.NewCustomerListDetails>;

    loadDetails(id: number) {
        return this.requestDetails(id).then((res) => {
            this.id = id;
            this.details = res;
            return res;
        });
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this;
    }

    print(pageId: number, documentId: number, documentTypeId?: number, documentMode?: number): Promise<void> {
        this.configService.loaderSubj.next(true);
        return this.printHandlerService.print(pageId, documentId, documentTypeId, documentMode).then(() => {
            this.configService.loaderSubj.next(false);
        }).catch(() => {
            this.detailsBoxMessages = this.preparePrintBoxMessages();
            this.configService.loaderSubj.next(false);
        });
    }

    clearDetailsBoxMessages() {
        this.detailsBoxMessages = null;
    }

    private preparePrintBoxMessages(): b2bShared.BoxMessages {
        return <b2bShared.BoxMessages>{ boxMessageClass: BoxMessageClass.Danger, messages: [BoxMessageType.PrintFailed], showBoxMessage: true };
    }

}
