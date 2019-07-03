import { Component, OnInit, ViewEncapsulation, Input, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-lazy-image',
    templateUrl: './lazy-image.component.html',
    styleUrls: ['./lazy-image.component.scss'],
    host: {class: 'app-lazy-image'},
    encapsulation: ViewEncapsulation.None
})
export class LazyImageComponent implements OnInit {


    @Input()
    src: string;

    @Input()
    alt: string;

    @Output()
    loaded: EventEmitter<void>;

    loading: boolean;

    constructor() {
        this.loading = true;
        this.loaded = new EventEmitter<void>();
    }

    ngOnInit() {
    }

    removeLoading() {
        this.loading = false;
        this.loaded.emit();
    }
}
