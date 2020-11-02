
import {filter} from 'rxjs/operators';
import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter, OnDestroy, HostBinding, HostListener } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfigService } from '../../model/config.service';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    host: { 'class': 'app-dropdown' },
    styleUrls: ['./dropdown.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DropdownComponent implements OnInit, OnDestroy {

    @HostBinding('class.opened')
    private _isOpen: boolean;

    @Input() 
    set isOpen(visibility: boolean) {

        //displaying options has to be done via changeDisplay method

        if (this._isOpen !== visibility) {
            this.changeDisplay(visibility);
        }
    }

    get isOpen() {
        return this._isOpen;
    }

    @Input()
    ariaLabel: string;

    @Input()
    ariaContentLabel: string;

    @Output()
    close: EventEmitter<void>;

    @Output()
    open: EventEmitter<void>;

    @Output()
    firstOpen: EventEmitter<void>;


    wasOpen: boolean;

    private routeChangeSubscription: Subscription;

    constructor(private router: Router, private configService: ConfigService, public r: ResourcesService) {
        this.close = new EventEmitter<void>();
        this.open = new EventEmitter<void>();
        this.firstOpen = new EventEmitter<void>();
    }


    ngOnInit() {

        this.wasOpen = false;

        if (this._isOpen === undefined) {
            this._isOpen = false;

        } else if (this._isOpen === true) {
            this.firstOpen.emit();
            this.wasOpen = true;
        }


        this.routeChangeSubscription = this.router.events.pipe(
            filter(event => (event instanceof NavigationStart)))
            .subscribe(() => {

                this.changeDisplay(false);
                this.close.emit();
            });
    }


    @HostListener('document:keydown.escape')
    onEscape() {
        this.changeDisplay(false);
    }

    @HostListener('keydown.enter')
    onEnter() {
        this.changeDisplay(true);
    }

    changeDisplay(visibility?: boolean) {

        if (visibility === undefined) {
            this._isOpen = !this._isOpen;
        } else {
            this._isOpen = visibility;
        }


        if (this._isOpen) {

            if (!this.wasOpen) {
                this.firstOpen.emit();
                this.wasOpen = true;
            }

            if (this.configService.isMobile) {
                this.configService.bodyRef.style.overflowY = 'hidden';
            }

            this.open.emit();

        } else {

            if (this.configService.isMobile) {
                this.configService.bodyRef.style.overflowY = 'scroll';
            }

            this.close.emit();
        }

    }

    ngOnDestroy() {
        this.routeChangeSubscription.unsubscribe();
    }
}
