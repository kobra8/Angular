import { Component, OnInit, Output, Input, ViewEncapsulation, EventEmitter } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    host: { 'class': 'app-pager' },
    styleUrls: ['./pager.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PagerComponent implements OnInit {

    @Input()
    page: number;

    @Input()
    isPrevPage: boolean;

    @Input()
    isNextPage: boolean;

    @Output()
    prev: EventEmitter<any>;

    @Output()
    next: EventEmitter<any>;

    @Output()
    change: EventEmitter<any>;

    @Input()
    pageSize: number;

    constructor(public r: ResourcesService) {

        this.prev = new EventEmitter<any>();
        this.next = new EventEmitter<any>();
        this.change = new EventEmitter<any>();

    }

    ngOnInit() {

        if (this.pageSize === undefined) {
            this.pageSize = 48;
        }

        if (this.page === undefined) {
            this.page = 0;
        }

        if (this.isPrevPage === undefined) {
            this.isPrevPage = this.page > 0;
        }

        if (this.isNextPage === undefined) {
            this.isNextPage = false;
        }


    }

    onPrev(): void {

        if (this.isPrevPage) {

            this.page--;
            this.isPrevPage = this.page > 0;

            this.prev.emit(this.page);

            this.change.emit(this.page);
        }
    }


    onNext(): void {

        if (this.isNextPage) {

            this.page++;
            this.isPrevPage = this.page > 0;

            this.next.emit(this.page);

            this.change.emit(this.page);
        }

    }


}
