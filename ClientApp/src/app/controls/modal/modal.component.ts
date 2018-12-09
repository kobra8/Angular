import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, OnDestroy, HostBinding } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { ConfigService } from '../../model/config.service';



@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ModalComponent implements OnInit, OnDestroy {

    private _isOpened: boolean;

    @Input()
    set isOpened(visibility: boolean) {

        //displaying modal has to be done via changeDisplay method

        if (this._isOpened !== visibility) {

            this.changeDisplay(visibility);

            if (this.autoClose && this._isOpened !== undefined) {
                this.timeoutId = window.setTimeout(() => this.changeDisplay(false), 5000);
            }
        }
    }

    get isOpened() {
        return this._isOpened;
    }

    @Input()
    autoClose: boolean;

    @Input()
    routeChangeClose: boolean;

    @Output()
    open: EventEmitter<void>;

    @Output()
    close: EventEmitter<void>;

    private _type: 'modal' | 'singleToastr';

    @Input()
    set type(value: 'modal' | 'singleToastr') {

        this._type = value;

        if (this._type === 'singleToastr') {
            this.singleToastrClass = true;
        } else {
            this.singleToastrClass = false;
        }
    }

    @HostBinding('class.single-toastr')
    singleToastrClass: boolean;

    private timeoutId: number;

    private routerSub: Subscription;

    constructor(private router: Router, private configService: ConfigService) {
        this.timeoutId = null;
        this.open = new EventEmitter();
        this.close = new EventEmitter();
        this._type = 'modal';
    }

    ngOnInit() {
        if (this._isOpened === undefined) {
            this._isOpened = false;
        }

        if (this.autoClose === undefined) {
            this.autoClose = true;
        }

        if (this.routeChangeClose === undefined) {
            this.routeChangeClose = true;
        }



        if (this.routeChangeClose) {
            this.routerSub = this.router.events.filter((event) => event instanceof NavigationStart).subscribe((event) => {
                this.changeDisplay(false);
            });
        }
    }

    changeDisplay(isOpened: boolean): void {

        if (isOpened === undefined || isOpened === null) {
            this._isOpened = !this._isOpened;
        } else {
            this._isOpened = isOpened;
        }

        if (this._isOpened) {

            if (this._type === 'modal') {
                this.configService.bodyRef.style.overflowY = 'hidden';
            }

            this.open.emit();
        } else {

            if (this._type === 'modal') {
                this.configService.bodyRef.style.overflowY = 'scroll';
            }

            this.close.emit();

        }

        if (this.autoClose && isOpened === false && this.timeoutId !== null) {
            window.clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

    }


    ngOnDestroy(): void {

        if (this.routeChangeClose) {
            this.routerSub.unsubscribe();
        }
    }
}
