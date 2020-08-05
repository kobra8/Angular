import { Component, ViewEncapsulation, Input } from '@angular/core';
import { b2bShared } from 'src/integration/b2b-shared';

@Component({
    selector: 'app-status',
    templateUrl: './status.component.html',
    styleUrls: ['./status.component.scss'],
    host: { 'class': 'app-status' },
    encapsulation: ViewEncapsulation.None
})
export class StatusComponent {

    private _status: b2bShared.Status;

    @Input()
    set status(status: b2bShared.Status) {
        this._status = status;

        if (this._status && this._status.isVisible && this._status.autoHide) {
            const hideTimeout = this._status.autoHideTimeout || 5000;

            setTimeout(() => {
                this.startHide = true;

                setTimeout(() => {
                    this._status.isVisible = false;
                    this.startHide = false;
                }, 800);

            }, hideTimeout - 800);
        }
    }

    get status() {
        return this._status;
    }

    startHide: boolean;
}
