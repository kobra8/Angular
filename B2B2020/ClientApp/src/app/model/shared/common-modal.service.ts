import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ResourcesService } from '../resources.service';

@Injectable()
export class CommonModalService {

    showModalSubject: Subject<string>;

    constructor(private resourcesService: ResourcesService) {
        this.showModalSubject = new Subject<string>();
    }

    showModalMessage(message: string) {
        this.showModalSubject.next(message);
    }

    showNoAvailableCartsModalMessage() {
        this.showModalSubject.next(this.resourcesService.translations.noAvailableCartsToAddArticle);
    }
}
