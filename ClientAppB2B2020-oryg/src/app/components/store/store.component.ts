import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { b2bStore } from 'src/integration/store/b2b-store';
import { b2bArticleGrid } from 'src/integration/shared/b2b-article-grid';
import { Subscription, Subject, Observable, combineLatest } from 'rxjs';
import { StoresService } from '../../model/store/stores.service';
import { ConfigService } from '../../model/config.service';
import { MenuService } from '../../model/menu.service';
import { b2b } from 'src/b2b';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourcesService } from '../../model/resources.service';
import { StoreService } from '../../model/store/store.service';
import { Pagination } from '../../model/shared/pagination';
import { ConvertingUtils } from '../../helpers/converting-utils';
import { SelectionType } from '../../model/shared/enums/selection-type.enum';
import { debounceTime, map, tap, withLatestFrom } from 'rxjs/operators';
import { CommonModalService } from '../../model/shared/common-modal.service';
import { QuantityDisplayType } from '../../model/shared/enums/quantity-display-type.enum';

@Component({
    selector: 'app-store',
    templateUrl: './store.component.html',
    styleUrls: ['./store.component.scss'],
    host: { 'class': 'app-store' },
    encapsulation: ViewEncapsulation.None
})
export class StoreComponent implements OnInit, OnDestroy {

    storeId: number;
    storeExist: boolean;
    stores: b2bStore.StoreIdentifier[];
    storeIdentifier: b2bStore.StoreIdentifier;

    articles: b2bStore.StoreArticleListItem[];
    summary: b2bStore.StoreSummary;
    selectedArticles: b2b.GenericCollection<number, b2bStore.StoreArticleListItem>;
    isSelectedByDefault = true;

    private routeChangedSub: Subscription;
    private storesChangedSub: Subscription;
    private articlesChangedSub: Subscription;
    private storeNameChangedSub: Subscription;
    private changeQuantitySub: Subscription;
    private changeQuantitySubject: Subject<void>;

    pagination: Pagination;
    backMenuItem: b2b.MenuItem;

    config: b2bArticleGrid.GridArticleConfig;

    selectedCartId: number;
    disableCopyToCartButton: boolean;
    savingData: boolean;

    removeStoreData: b2bStore.RemoveStoreData;

    isNameEdited: boolean;

    constructor(
        private storesService: StoresService,
        private storeService: StoreService,
        public configService: ConfigService,
        public menuService: MenuService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        public r: ResourcesService,
        private commonModalService: CommonModalService) {

        this.storeExist = true;
        this.config = {
            showImages: true,
            showCode: true,
            showItemsSelection: true,
            showRemoveButtons: true,
            quantityDisplayType: QuantityDisplayType.Editable,
            allItemsSelected: true,
            allItemsSelectedByUser: true
        };
        this.selectedArticles = {};
        this.changeQuantitySubject = new Subject();

        this.removeStoreData = {
            isModalOpen: false,
            store: undefined
        };
    }

    ngOnInit() {
        this.routeChangedSub = this.activatedRoute.params
            .pipe(
                withLatestFrom(this.storesService.storesChanged),
                map(results => ({ params: results[0], stores: results[1], })))
            .subscribe(results => {
                this.configService.loaderSubj.next(true);
                if (results.params.id) {
                    this.storeId = Number.parseInt(results.params.id);
                    this.storeService.getStoreContent(this.storeId);
                    return;
                }

                if (results.stores[0]) {
                    this.router.navigate([this.menuService.routePaths.store, results.stores[0].id]);
                    return;
                }

                this.storeExist = false;
                this.configService.loaderSubj.next(false);
            });

        this.storesChangedSub = this.storesService.storesChanged.subscribe(res => {
            this.stores = res;
        });

        this.articlesChangedSub = this.storeService.articlesChanged.subscribe((res: b2bStore.StoreArticlesSummary) => {
            this.storeExist = res.storeExists;
            if (res.storeExists) {
                this.articles = res.articles;
                this.adjustArticles(this.articles);
                this.summary = res.summary;
            }
            this.pagination = this.storeService.pagination;
            this.configService.loaderSubj.next(false);
            this.savingData = false;
        });

        this.changeQuantitySub = this.changeQuantitySubject.pipe(debounceTime(1000)).subscribe(() => {
            const quantityRequests: Observable<void>[] = new Array();

            this.articles.forEach((item) => {
                if (item.quantityChanged) {
                    quantityRequests.push(this.storeService.updateItemQuantity(item.itemId, item.quantity));
                    item.quantityChanged = false;
                }
            });

            combineLatest(quantityRequests).subscribe(() => {
                this.savingData = false;
            });
        });

        this.storeNameChangedSub = this.storeService.storeNameChanged.subscribe((res) => {
            this.storeIdentifier = res;
            this.isNameEdited = false;
        });

        this.backMenuItem = this.menuService.defaultBackItem;
    }

    changeStore(storeId: number) {
        this.router.navigate([this.menuService.routePaths.store, storeId]);
    }

    changePage(pageNumber: number) {
        this.configService.loaderSubj.next(true);
        this.storeService.changePage(pageNumber, this.storeId);
    }

    removeCartItem(itemId: number) {
        this.savingData = true;
        this.configService.loaderSubj.next(true);

        this.storeService.removeStoreItem(this.storeId, itemId);
    }

    changeItemQuantity(request: b2bArticleGrid.ChangeItemQuantity) {
        this.savingData = true;
        const currentArticle = this.articles.find(item => item.itemId === request.itemId);
        if (!currentArticle) {
            return;
        }
        currentArticle.quantity = request.quantity;
        currentArticle.quantityChanged = true;
        this.selectedArticles[request.itemId].quantity = request.quantity;
        this.changeQuantitySubject.next();
    }

    private adjustArticles(articles: b2bStore.StoreArticleListItem[]) {
        if (articles && articles.length > 0) {
            articles.forEach(item => {
                this.initArticlesSelection(item);

                if (item.unit.auxiliaryUnit.unit) {
                    item.unit.converter = ConvertingUtils.unitConverterString(item.unit.denominator.value, item.unit.auxiliaryUnit.unit, item.unit.numerator.value, item.unit.basicUnit);
                }
            });
        }
    }

    private initArticlesSelection(currentArticle: b2bStore.StoreArticleListItem) {
        if (!currentArticle.selected) {
            currentArticle.selected = this.config.allItemsSelectedByUser;
        }

        if (!this.selectedArticles[currentArticle.itemId]) {
            this.selectedArticles[currentArticle.itemId] = currentArticle;
        } else {
            currentArticle.selected = this.selectedArticles[currentArticle.itemId].selected;
        }
    }

    onSelectedAllItemsChanged(selectionType: SelectionType) {
        switch (selectionType) {
            case SelectionType.All:
                return this.selectAllArticles();

            case SelectionType.None:
                return this.unselectAllArticles();
        }
    }

    onSingleItemSelectionChanged(itemSelection: b2bArticleGrid.GridArticleSelection) {
        this.selectedArticles[itemSelection.itemId].selected = itemSelection.isSelected;
        if (!itemSelection.isSelected) {
            this.config.allItemsSelected = false;
        }
    }

    private selectAllArticles() {
        this.config.allItemsSelected = true;
        this.config.allItemsSelectedByUser = true;
        this.updateAllSelectedArticles(true);
    }

    private unselectAllArticles() {
        this.config.allItemsSelected = false;
        this.config.allItemsSelectedByUser = false;
        this.updateAllSelectedArticles(false);
    }

    private updateAllSelectedArticles(isSelected: boolean) {
        this.articles.forEach(item => item.selected = isSelected);
        for (const key of Object.keys(this.selectedArticles)) {
            this.selectedArticles[key].selected = isSelected;
        }
    }

    copyToCart() {
        if (!this.selectedCartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        if (this.config.allItemsSelected) {
            this.storesService.copyAllArticlesToCart(this.selectedCartId, this.storeId);
            return;
        }

        const selectedArticles = Object.values(this.selectedArticles).filter(item => item.selected);
        if (selectedArticles.length === 0) {
            return;
        }
        this.storesService.copySelectedArticlesToCart(this.selectedCartId, selectedArticles);
    }

    removeStore() {
        this.storesService.removeStore(this.storeId);
        this.closeRemoveStoreConfirmModal();
    }

    showRemoveStoreConfirmModal() {
        this.removeStoreData.store = this.storeIdentifier;
        this.removeStoreData.isModalOpen = true;
    }

    closeRemoveStoreConfirmModal() {
        this.removeStoreData.store = undefined;
        this.removeStoreData.isModalOpen = false;
    }

    onClickEditStoreName() {
        this.isNameEdited = true;
    }

    onClickSaveNewStoreName() {
        this.storeService.updateStoreName(this.storeId, this.storeIdentifier.name);
    }

    ngOnDestroy(): void {
        if (this.routeChangedSub) {
            this.routeChangedSub.unsubscribe();
        }
        if (this.storesChangedSub) {
            this.storesChangedSub.unsubscribe();
        }
        if (this.articlesChangedSub) {
            this.articlesChangedSub.unsubscribe();
        }
        if (this.storeNameChangedSub) {
            this.storeNameChangedSub.unsubscribe();
        }
        if (this.changeQuantitySub) {
            this.changeQuantitySub.unsubscribe();
        }
    }
}
