import { Component, ViewEncapsulation, ElementRef, HostBinding, Input, OnDestroy, ViewChild, AfterContentInit, AfterViewChecked } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { UiUtils } from '../../helpers/ui-utils';

@Component({
    selector: 'app-sticky',
    templateUrl: './sticky.component.html',
    styleUrls: ['./sticky.component.scss'],
    host: { class: 'app-sticky' },
    encapsulation: ViewEncapsulation.None
})
export class StickyComponent implements AfterViewChecked, AfterContentInit, OnDestroy {

    width: number;
    height: number;

    @HostBinding('class.sticked')
    isSticked: boolean;

    @Input()
    stickyClass: string;

    @Input()
    stickyInside: string;

    @Input() @HostBinding('class.fixed-height')
    fixedHeight: boolean;


    @ViewChild('container', { read: ElementRef })
    private container: ElementRef;

    @ViewChild('sizeGuard', { read: ElementRef })
    private sizeGuard: ElementRef;

    private scrollSub: Subscription;

    private bottom: number;

    private elementOffsetTop: number;
    private scrollOffsetTop: number;

    constructor(private el: ElementRef) {
        this.isSticked = false;
    }

    ngAfterContentInit() {
        this.elementOffsetTop = this.el.nativeElement.getBoundingClientRect().top + this.scrollOffsetTop;


        this.scrollSub = Observable.fromEvent(window, 'scroll').subscribe(event => {

            if (this.el && this.el.nativeElement && this.el.nativeElement.clientWidth) {

                if (this.stickyInside !== undefined && this.bottom === undefined) {
                    this.bottom = this.el.nativeElement.offsetTop + document.querySelector(this.stickyInside).clientHeight;
                }

                this.stick();
            }
        });
    }

    ngAfterViewChecked() {

        const newScrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const newFixedHeight = UiUtils.getWindowHeight() - Math.max(this.el.nativeElement.getBoundingClientRect().top, 0);
        const newWidth = this.container.nativeElement.getBoundingClientRect().width;

        if (this.scrollOffsetTop !== newScrollPos || this.width !== newWidth || (this.fixedHeight && newFixedHeight !== this.height)) {

            this.scrollOffsetTop = newScrollPos;

            if (this.container && this.container.nativeElement && this.container.nativeElement.style.position !== 'fixed') {

                if (this.container.nativeElement.style.position !== 'fixed') {

                    if (this.width !== newWidth) {
                        this.width = this.container.nativeElement.getBoundingClientRect().width;
                        this.sizeGuard.nativeElement.style.width = this.width + 'px';
                        this.container.nativeElement.style.width = this.width + 'px';
                    }

                    if (this.fixedHeight) {

                        if (newFixedHeight !== this.height) {
                            this.height = newFixedHeight;
                            this.sizeGuard.nativeElement.style.height = this.height + 'px';
                            this.sizeGuard.nativeElement.style.position = 'absolute';
                        }

                    } else {
                        if (this.height !== this.container.nativeElement.clientHeight) {
                            this.height = this.container.nativeElement.clientHeight;
                            this.sizeGuard.nativeElement.style.height = this.height + 'px';
                        }
                    }
                }


            }
        }

    }


    stick() {

        this.scrollOffsetTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.elementOffsetTop = this.el.nativeElement.getBoundingClientRect().top + this.scrollOffsetTop;
        

        if ((this.elementOffsetTop < this.scrollOffsetTop) && (this.bottom === undefined || this.bottom > this.scrollOffsetTop)) {

            this.isSticked = true;

            this.container.nativeElement.style.position = 'fixed';
            

            if (this.fixedHeight) {
                this.sizeGuard.nativeElement.style.position = 'fixed';
                
            }

        } else {

            this.isSticked = false;

            this.container.nativeElement.style.position = 'absolute';

            if (this.fixedHeight) {
                this.sizeGuard.nativeElement.style.position = 'absolute';
            }


        }
    }

    ngOnDestroy(): void {
        this.scrollSub.unsubscribe();
    }



}
