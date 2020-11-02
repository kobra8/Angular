import { Component, ViewEncapsulation } from '@angular/core';
import { ResourcesService } from 'src/app/model/resources.service';

// JD
@Component({
    selector: 'app-business-terms',
    templateUrl: './business-terms.component.html',
    styleUrls: ['./business-terms.component.scss'],
    host: {class: 'app-business-terms'},
    encapsulation: ViewEncapsulation.None
})
export class BusinessTermsComponent {

    r: ResourcesService;

    constructor(
        resourcesService: ResourcesService,
    ) {
        this.r = resourcesService;
    }


}
