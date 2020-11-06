import { Component, OnInit, ViewEncapsulation, Input, EventEmitter, Output, HostBinding, ElementRef } from '@angular/core';
import { ConfigService } from 'src/app/model/config.service';

@Component({
    selector: 'app-lazy-image',
    templateUrl: './lazy-image.component.html',
    styleUrls: ['./lazy-image.component.scss'],
    host: {class: 'app-lazy-image image-container'},
    encapsulation: ViewEncapsulation.None
})
export class LazyImageComponent implements OnInit {


    @Input()
    src: string;

    @Input()
    alt: string;

    @Input()
    width: number;

    @Input()
    height: number;

    @Input()
    fromBinary: boolean | '';

    @Input()
    id: number;

    @Output()
    loaded: EventEmitter<void>;

    @Output()
    error: EventEmitter<void>;

    @HostBinding('class.loading')
    loading: boolean;

    isError: boolean;

    constructor(private configService: ConfigService) {
        this.loading = true;
        this.loaded = new EventEmitter<void>();
        this.error = new EventEmitter<void>();
    }

    ngOnInit() {

        if (this.fromBinary === undefined) {
            this.fromBinary = this.configService.applicationId ? false : '';
        }

        if (!this.width) {
            this.width = 100;
        }

        if (!this.height) {
            this.height = 100;
        }

        if (!this.src) {
            this.src = `/imagehandler.ashx?id=${this.id}&fromBinary=${this.fromBinary}&width=${this.width}&height=${this.height}`;
        }
    }

    removeLoading() {
        this.loading = false;
        this.loaded.emit();
    }

    handleError() {
        this.loading = false;
        this.isError = true;
        this.error.emit();
    }
}
