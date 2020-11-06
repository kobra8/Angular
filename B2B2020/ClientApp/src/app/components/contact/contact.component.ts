import { Component, ViewEncapsulation } from '@angular/core';
import { ResourcesService } from 'src/app/model/resources.service';
import { ConfigService } from 'src/app/model/config.service';

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
        public configService: ConfigService,
        resourcesService: ResourcesService

    ) {
        this.r = resourcesService;
    }


}
