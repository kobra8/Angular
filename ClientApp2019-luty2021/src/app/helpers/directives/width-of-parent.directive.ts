import { Directive, ElementRef, HostBinding, OnInit, ChangeDetectorRef } from '@angular/core';

@Directive({
    selector: '[appWidthOfParent]'
})
export class WidthOfParentDirective implements OnInit {
    
    @HostBinding('style.width')
    widthStyle: string;

    constructor(private el: ElementRef<HTMLElement>, private changeDetector: ChangeDetectorRef) { }


    ngOnInit(): void {
        window.setTimeout(() => {
            this.widthStyle = window.getComputedStyle(this.el.nativeElement.parentElement).width;
            this.changeDetector.markForCheck();
        }, 0);
        
    }

}
