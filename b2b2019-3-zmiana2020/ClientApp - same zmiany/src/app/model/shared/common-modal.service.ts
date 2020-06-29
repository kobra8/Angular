import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { ResourcesService } from '../resources.service';
import { ModalMessageType } from './enums/modal-message-type';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CommonModalService {

    showModalSubject: Subject<string>;
    //JD
    private showCommercialSubject = new BehaviorSubject<boolean>(false);
    showCommercialEmited$ = this.showCommercialSubject.asObservable();

    constructor(
        private resourcesService: ResourcesService,
        private httpClient: HttpClient
        ) {
        this.showModalSubject = new Subject<string>();
        // JD
        this.preloadCommercialImage();
    }

    showModalMessage(message: string) {
        this.showModalSubject.next(message);
    }
    //JD
    showModalCommercial(value: boolean) {
        this.showCommercialSubject.next(value);
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

    // JD
    preloadCommercialImage(){
        this.httpClient.get('/ClientApp/assets/images/promocja-microtec-komp.jpg', { responseType: 'blob' }).toPromise().then(
          ( image => {
              const blob: Blob = new Blob([image], { type: 'image/jpeg' });
            })
          )
    }
}
