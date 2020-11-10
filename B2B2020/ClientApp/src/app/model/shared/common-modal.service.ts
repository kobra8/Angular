import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ResourcesService } from '../resources.service';

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
    }

    showModalMessage(message: string) {
        this.showModalSubject.next(message);
    }

      //JD
      showModalCommercial(value: boolean) {
        this.showCommercialSubject.next(value);
    }

    showNoAvailableCartsModalMessage() {
        this.showModalSubject.next(this.resourcesService.translations.noAvailableCartsToAddArticle);
    }

      // JD
      preloadCommercialImage(){
        this.httpClient.get('/ClientApp/assets/images/promocja-jesien-2020.png', { responseType: 'blob' }).toPromise().then(
          ( image => {
              const blob: Blob = new Blob([image], { type: 'image/png' });
            })
          )
    }
}
