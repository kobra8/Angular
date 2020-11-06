import { Component, OnInit, ViewEncapsulation, HostBinding, Input } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { FormatPipe } from '../../helpers/pipes/format.pipe';

@Component({
    selector: 'app-loading',
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss'],
    host: { class: 'app-loading overlay loader-before' },
    encapsulation: ViewEncapsulation.None
})
export class LoadingComponent implements OnInit {


    @HostBinding('attr.aria-live') @Input()
    ariaLive: string;

    @HostBinding('attr.aria-label') @Input()
    ariaLabel: string;

    @Input()
    sectionName: string;

    @HostBinding('attr.role') @Input()
    role: string;

    constructor(private r: ResourcesService) {
        this.ariaLive = 'polite';
        this.role = 'status';
    }

    ngOnInit() {

        if (this.ariaLabel === undefined) {

            this.r.translationsPromise.then(() => {
                if (this.sectionName) {
                    this.ariaLabel = (new FormatPipe()).transform(this.r.translations.loadingSection, this.sectionName);
                } else {
                    this.ariaLabel = this.r.translations.loading;
                }
            });
            
        }
    }

}
