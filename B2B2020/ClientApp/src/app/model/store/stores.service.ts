import { Injectable } from '@angular/core';
import { b2bStore } from 'src/integration/store/b2b-store';
import { StoreRequestsService } from './store-requests.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { b2b } from 'src/b2b';
import { Config } from '../../helpers/config';
import { ConfigService } from '../config.service';
import { CartsService } from '../carts.service';
import { Router } from '@angular/router';
import { MenuService } from '../menu.service';
import { AfterAddingToCart } from '../enums/after-adding-to-cart.enum';
import { b2bStore as B2BStore } from '../../../integration/store/b2b-store';


@Injectable({
    providedIn: 'root'
})
export class StoresService {

    private stores: b2bStore.StoreIdentifier[];
    storesChanged: BehaviorSubject<b2bStore.StoreIdentifier[]>;

    addToStoreBehaviour: b2bStore.AddToStoreBehaviour;
    productToStoreAdded: Subject<b2bStore.AddToStoreStatus>;

    constructor(
        private storeRequestsService: StoreRequestsService,
        private configService: ConfigService,
        private cartsService: CartsService,
        private router: Router,
        private menuService: MenuService) {

        this.stores = [];
        this.storesChanged = new BehaviorSubject(this.stores);
        this.productToStoreAdded = new Subject<B2BStore.AddToStoreStatus>();
        this.initAddToStoreBehaviour();
    }

    private initAddToStoreBehaviour() {
        const storageBehaviourType = window.localStorage.getItem('afterAddingToStore');

        if (storageBehaviourType) {
            this.addToStoreBehaviour = this.prepareAddToStoreBehaviour(true, Number(storageBehaviourType));
        } else {
            this.addToStoreBehaviour = this.prepareAddToStoreBehaviour(false, null);
        }
    }

    saveAddToStoreBehaviour(behaviourType: AfterAddingToCart): void {
        this.addToStoreBehaviour = this.prepareAddToStoreBehaviour(true, behaviourType);
        window.localStorage.setItem('afterAddingToStore', behaviourType + '');
    }

    private prepareAddToStoreBehaviour(isRemembered: boolean, behaviourType?: AfterAddingToCart): b2bStore.AddToStoreBehaviour {
        return {
            isBehaviourTypeRemembered: isRemembered,
            behaviourType: behaviourType
        };
    }

    refreshStores(): void {
        this.storeRequestsService.getStoresRequest().subscribe(res => {
            this.stores = res.stores;
            this.storesChanged.next(this.stores.slice());
        });
    }

    refreshStoreName(store: b2bStore.StoreIdentifier) {
        const currentStore = this.stores.find(item => item.id === store.id);
        if (currentStore) {
            currentStore.name = store.name;
        }
        this.storesChanged.next(this.stores.slice());
    }

    copySelectedArticlesToCart(cartId: number, selectedArticles: b2bStore.StoreArticleListItem[]) {
        this.configService.loaderSubj.next(true);
        const requestArray: b2b.AddToCartRequest = {
            cartId,
            warehouseId: this.configService.config.warehouseId || 0,
            createNewCart: cartId === Config.createNewCartId,
            items: selectedArticles.map(item => {
                return <b2b.AddToCartRequestItem>{
                    articleId: item.article.id,
                    quantity: item.quantity,
                    unitDefault: item.unit.defaultUnitNo
                };
            })
        };

        this.cartsService.addToCart(requestArray).then(() => {
            this.configService.loaderSubj.next(false);
        });
    }

    copyAllArticlesToCart(cartId: number, storeId: number) {
        this.configService.loaderSubj.next(true);
        const request: b2bStore.CopyAllArticlesToCartRequest = {
            cartId,
            storeId,
            createNewCart: cartId === Config.createNewCartId,
        };

        this.storeRequestsService.copyAllArticlesToCartRequest(request).subscribe((res) => {
            this.cartsService.inCaseSuccessAddToCart(res);
            this.configService.loaderSubj.next(false);
        });
    }

    removeStore(storeId: number) {
        this.configService.loaderSubj.next(true);
        const request: b2bStore.RemoveStoreRequest = {
            storeId
        };

        this.storeRequestsService.removeStore(request).subscribe(() => {
            this.router.navigate([this.menuService.routePaths.home]);
            this.refreshStores();
            this.configService.loaderSubj.next(false);
        });
    }

    createStore(items: b2bStore.AddItemToStore[]) {
        this.configService.loaderSubj.next(true);
        const request: b2bStore.CreateStoreRequest = { items };
        this.storeRequestsService.createStore(request).subscribe((res) => {
            this.inCaseSuccessAddToStore(res);
            this.configService.loaderSubj.next(false);
        });
    }

    addToStore(storeId: number, items: b2bStore.AddItemToStore[]) {
        this.configService.loaderSubj.next(true);
        const request: b2bStore.AddToStoreRequest = { storeId, items };
        this.storeRequestsService.addToStore(request).subscribe((res) => {
            this.inCaseSuccessAddToStore(res);
            this.configService.loaderSubj.next(false);
        });
    }

    private inCaseSuccessAddToStore(status: b2bStore.AddToStoreStatus) {
        this.refreshStores();
        this.productToStoreAdded.next(status);
    }
}
