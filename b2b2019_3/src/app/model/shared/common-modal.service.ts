import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ResourcesService } from '../resources.service';
import { ModalMessageType } from './enums/modal-message-type';

@Injectable()
export class CommonModalService {

    showModalSubject: Subject<string>;

    constructor(private resourcesService: ResourcesService) {
        this.showModalSubject = new Subject<string>();
    }

    showModalMessage(message: string) {
        this.showModalSubject.next(message);
    }

    showModalMessageType(messageType: ModalMessageType) {
        switch (messageType) {
            case ModalMessageType.noAvailableCartsToAddArticle:
                this.showModalSubject.next(this.resourcesService.translations.noAvailableCartsToAddArticle);
                break;
            case ModalMessageType.noAvailableCartsToAddQuote:
                this.showModalSubject.next(this.resourcesService.translations.noAvailableCartsToAddQuote);
                break;
            default:
        }
    }
}
