import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { b2bCart } from 'src/integration/b2b-cart';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class CommonAvailableCartsService {

    private _availableCartsStatus: b2bCart.AvailableCartsStatus;
    availableCartsStatusChanged: BehaviorSubject<b2bCart.AvailableCartsStatus>;

    constructor(private httpClient: HttpClient) {
        this._availableCartsStatus = { availableCarts: [], isPermissionToCreateNewCart: true };
        this.availableCartsStatusChanged = new BehaviorSubject<b2bCart.AvailableCartsStatus>(this._availableCartsStatus);
    }

    refreshAvailableCarts() {
        this.getAvailableCartsRequest().subscribe((res) => {
            this._availableCartsStatus = res;
            this.availableCartsStatusChanged.next(res);
        });
    }

    private getAvailableCartsRequest() {
        return this.httpClient.get<b2bCart.GetAvailableCartsResponse>('/api/Carts/availableCarts');
    }
}
