import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
    selector: 'app-file-icon',
    templateUrl: './file-icon.component.html',
    styleUrls: ['./file-icon.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileIconComponent implements OnInit {


    private _extension: string;

    @Input()
    set extension(val: string) {
        if (val.includes('.')) {
            val = val.replace('.', '');
        }
        this._extension = val;
    }

    get extension() {
        return this._extension;
    }

    constructor() { }

    ngOnInit() {
    }

}
