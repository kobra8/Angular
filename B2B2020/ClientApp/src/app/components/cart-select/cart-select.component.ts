import { Component, OnDestroy, ViewEncapsulation, forwardRef, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { b2bCart } from 'src/integration/b2b-cart';
import { Subscription } from 'rxjs';
import { CommonAvailableCartsService } from '../../model/shared/common-available-carts.service';
import { ResourcesService } from '../../model/resources.service';
import { CommonModalService } from '../../model/shared/common-modal.service';
import { Config } from '../../helpers/config';

@Component({
    selector: 'app-cart-select',
    templateUrl: './cart-select.component.html',
    styleUrls: ['./cart-select.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { 'class': 'app-cart-select' },
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: forwardRef(() => CartSelectComponent),
        }
    ],
})
export class CartSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
    cartId: number;

    @Input()
    disabled: boolean;

    @Input()
    name: string;

    availableCartsStatus: b2bCart.AvailableCartsStatus;
    private availableCartsChanged: Subscription;

    constructor(
        private commonAvailableCartsService: CommonAvailableCartsService,
        private r: ResourcesService,
        private commonModalService: CommonModalService,
        private changeDetector: ChangeDetectorRef) {

        this.disabled = false;
    }

    ngOnInit() {
        this.availableCartsChanged = this.commonAvailableCartsService.availableCartsStatusChanged.subscribe((res) => {
            this.updateAvailableCartsStatus(res);
        });
    }

    onChange: any = () => { };
    onTouch: any = () => { };

    writeValue(cartId: number): void {
        if (cartId) {
            this.cartId = cartId;
            this.onChange(cartId);
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onOpenSelect() {
        if (!this.cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
        }
    }

    onChangeValue(cartId: number) {
        this.writeValue(cartId);
    }

    private updateAvailableCartsStatus(status: b2bCart.AvailableCartsStatus) {
        this.availableCartsStatus = status;
        this.setPreviousCartIfAvailable();
        this.changeDetector.markForCheck();
    }

    private setPreviousCartIfAvailable() {
        if (!this.availableCartsStatus) {
            this.writeValue(undefined);
            return;
        }

        const carts = this.availableCartsStatus.availableCarts;
        if (!carts || carts.length < 1) {
            if (this.availableCartsStatus.isPermissionToCreateNewCart) {
                this.writeValue(Config.createNewCartId);
            } else {
                this.writeValue(undefined);
            }
            return;
        }

        const previousOption = carts.filter(x => x.cartId === this.cartId);
        if (previousOption.length < 1) {
            this.writeValue(carts[0].cartId);
        }
    }

    ngOnDestroy() {
        if (this.availableCartsChanged) {
            this.availableCartsChanged.unsubscribe();
        }
    }
}
