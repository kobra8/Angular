import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ResourcesService } from 'src/app/model/resources.service';

@Component({
    selector: 'app-old-pager',
    templateUrl: './old-pager.component.html',
    host: { 'class': 'app-pager app-old-pager' },
    styleUrls: ['../pager/pager.component.scss', './old-pager.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OldPagerComponent implements OnInit {

    private _currentPage: number;
    isPrevPage: boolean;

    @Input()
    isNextPage: boolean;

    @Input()
    pageSize: number;

    @Input()
    set currentPage(val) {
        if (val !== this._currentPage) {

            this._currentPage = val;
            this.isPrevPage = this._currentPage > 0;
        }
    }

    get currentPage() {
        return this._currentPage;
    }

    @Output()
    prev: EventEmitter<any>;

    @Output()
    next: EventEmitter<any>;

    @Output()
    changePage: EventEmitter<any>;


    constructor(public r: ResourcesService) {

        this.prev = new EventEmitter<any>();
        this.next = new EventEmitter<any>();
        this.changePage = new EventEmitter<any>();

    }

    ngOnInit() {

        if (this.currentPage === undefined) {
            this.currentPage = 1;
        }
    }

    onPrev(): void {

        if (this.isPrevPage) {

            this.currentPage--; //isPrevPage updated in setter

            this.prev.emit(this.currentPage);

            this.changePage.emit(this.currentPage);
        }
    }


    onNext(): void {

        if (this.isNextPage) {

            this.currentPage++;

            this.next.emit(this.currentPage);

            this.changePage.emit(this.currentPage);
        }

    }

}
