import { Component, ViewEncapsulation } from '@angular/core';
import { ResourcesService } from 'src/app/model/resources.service';

// JD
@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    host: {class: 'app-contact'},
    encapsulation: ViewEncapsulation.None
})
export class ContactComponent {

    r: ResourcesService;

    constructor(
        resourcesService: ResourcesService,
    ) {
        this.r = resourcesService;
    }


}
