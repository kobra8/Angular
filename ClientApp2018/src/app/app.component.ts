import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CartsService } from './model/carts.service';
import { Subscription } from 'rxjs/Subscription';
import { AfterAddingToCart } from './model/enums/after-adding-to-cart.enum';
import { ResourcesService } from './model/resources.service';
import { Router } from '@angular/router';
import { ConfigService } from './model/config.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy {

    r: ResourcesService;

    private addingToCartSub: Subscription;

    afterAddingToCartModal: {
        opened: boolean;
        cartId?: number;
        saveBehaviour?: boolean;
        addedCount?: number;
        notAddedCount?: number;
    };

    noPermissions: boolean;

    constructor(
        public router: Router,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        public cartsService: CartsService
    ) {

        this.r = resourcesService;

        this.afterAddingToCartModal = {
            opened: false
        };

        this.noPermissions = false;
    }

    ngOnInit() {

        if (this.cartsService.afterAddingToCart !== AfterAddingToCart.go) {
            this.addingToCartSub = this.cartsService.productAdded.subscribe((res) => {
                this.afterAddingToCartModal.opened = true;
                this.afterAddingToCartModal.cartId = res.cartId;
                this.afterAddingToCartModal.addedCount = res.addedCount;
                this.afterAddingToCartModal.notAddedCount = res.notAddedCount;
            });
        }

        this.configService.permissionsPromise.then(() => {
            this.noPermissions = !Object.keys(this.configService.permissions).length;
        });

    }


    closeInform(modalType: 'afterAddingToCart' | 'noPermissions'): void {

        switch (modalType) {
            case 'afterAddingToCart':
                this.afterAddingToCartModal.opened = false;
                break;
            case 'noPermissions':
                this.noPermissions = false;
                break;
            default:
                break;
        }
    }

    saveAfterAddingBehaviour(behaviourType: AfterAddingToCart) {

        if (this.afterAddingToCartModal.saveBehaviour === true) {
            this.cartsService.saveAddToCartBehaviour(behaviourType);
        }
    }

    setIfSaveBehaviour(ifSave: boolean) {
        this.afterAddingToCartModal.saveBehaviour = ifSave;
    }

    ngOnDestroy(): void {

        if (this.addingToCartSub) {
            this.addingToCartSub.unsubscribe();
        }

    }

  
}
