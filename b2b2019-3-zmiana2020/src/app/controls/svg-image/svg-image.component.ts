import { Component, OnInit, ViewEncapsulation, Input, ViewContainerRef, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, HostBinding } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-svg-image',
    templateUrl: './svg-image.component.html',
    styleUrls: ['./svg-image.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'app-svg-image' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SvgImageComponent implements OnInit {


    static svgSprite: SVGImageElement;
    static svgSpritePromise: Promise<void>;

    svgImage: string;

    @Input()
    svgId: string;

    constructor(
        private el: ElementRef<HTMLUnknownElement>,
        private httpClient: HttpClient,
        private changeDetector: ChangeDetectorRef
    ) {}

    ngOnInit() {

        if (!SvgImageComponent.svgSpritePromise) {
            SvgImageComponent.svgSpritePromise = this.loadSvgSprite();
        }

        SvgImageComponent.svgSpritePromise.then(() => {
            this.loadImageFromSprite();
        });

    }

    loadImageFromSprite() {
        const dom = SvgImageComponent.svgSprite.querySelector<SVGImageElement>('#' + this.svgId);
        if (dom) {
            this.svgImage = dom.outerHTML;
            this.el.nativeElement.innerHTML = this.svgImage;
            this.changeDetector.markForCheck();
        }
    }


    loadSvgSprite() {

        const headers = new HttpHeaders();
        headers.set('Accept', 'image/svg+xml');

        return this.httpClient.get((<any>window).svgPath, { headers, responseType: 'text' }).toPromise().then(res => {
            (<any>window).svgPath = undefined;

            const domParser = new DOMParser();
            const svgDom = domParser.parseFromString(res, 'image/svg+xml');
            SvgImageComponent.svgSprite = <any>svgDom.documentElement;

        }).catch(err => {
            return Promise.reject(err);
        });

    }
}
