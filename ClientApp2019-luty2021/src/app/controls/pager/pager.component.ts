import { Component, OnInit, Output, Input, ViewEncapsulation, EventEmitter, ViewChild, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { debounceTime } from 'rxjs/operators';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    host: { 'class': 'app-pager' },
    styleUrls: ['./pager.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PagerComponent implements OnInit, OnDestroy {
    

    private _currentPage: number;
    isPrevPage: boolean;
    isNextPage: boolean;

    @Input()
    set currentPage(val) {

        if (this.validatePageNumber(val) && val !== this._currentPage) {
            this._currentPage = val;
            this.pageInput.nativeElement.value = val + '';

            this.isPrevPage = this._currentPage > 1;
            this.isNextPage = this._currentPage < this.totalPages;

        }
    }

    get currentPage() {
        return this._currentPage;
    }

    private _totalPages: number;

    @Input()
    set totalPages(val) {

        if (val !== this._totalPages) {
            this._totalPages = val;
            this.isNextPage = this._currentPage < this._totalPages;
        }
    }

    get totalPages() {
        return this._totalPages;
    }

    @Output()
    prev: EventEmitter<any>;

    @Output()
    next: EventEmitter<any>;

    @Output()
    changePage: EventEmitter<any>;

    @ViewChild('pageInput', { static: true })
    pageInput: ElementRef<HTMLInputElement>;

    inputObservable: Observable<number>;
    inputObserver: Subscriber<number>;
    inputSub: Subscription;

    constructor(public r: ResourcesService) {

        this.prev = new EventEmitter<any>();
        this.next = new EventEmitter<any>();
        this.changePage = new EventEmitter<any>();

        this.inputObservable = new Observable(observer => {
            this.inputObserver = observer;
        }).pipe(debounceTime<number>(1000));


        this.inputObservable.subscribe(page => {
            this.changePage.emit(page);
            if (document.activeElement === this.pageInput.nativeElement) {
                this.selectAllInputChars();
            }
        });
    }

    ngOnInit() {
        this.pageInput.nativeElement.value = this.currentPage + '';

        if (this.currentPage === undefined) {
            this.currentPage = 1;
        }
    }

    onPrev(): void {

        if (this.isPrevPage) {

            this.currentPage--; //isPrevPage updated in setter
            this.pageInput.nativeElement.value = this.currentPage + '';

            this.prev.emit(this.currentPage);

            this.changePage.emit(this.currentPage);
        }
    }


    onNext(): void {

        if (this.isNextPage) {

            this.currentPage++; //isNextPage updated in setter
            this.pageInput.nativeElement.value = this.currentPage + '';

            this.next.emit(this.currentPage);

            this.changePage.emit(this.currentPage);
        }

    }


    validatePageNumber(page: any): boolean {

        if (!Number.isInteger(page) || page < 1 || page > this.totalPages) {
            return false;
        }

        return true;

    }


    handleChange(inputVal: string) {

        const page = Number.parseInt(inputVal);

        if (this.validatePageNumber(page)) {
            this.currentPage = page;
            this.inputObserver.next(page);

        } else {
            this.pageInput.nativeElement.value = this.currentPage + '';
        }

    }


    selectAllInputChars() {
        const length = this.pageInput.nativeElement.value.length;
        this.pageInput.nativeElement.setSelectionRange(0, length);
    }


    ngOnDestroy(): void {
        this.inputObserver.complete();
    }

}
