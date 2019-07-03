import { Component, OnInit, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { ProductsService } from '../../model/products.service';
import { b2b } from '../../../b2b';
import { FiltersObjectType } from '../../model/enums/filters-object-type.enum';
import { DisplayType } from '../../model/enums/display-type.enum';
import { Subscription } from 'rxjs/Subscription';
import { CartsService } from '../../model/carts.service';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupsService } from '../../model/groups.service';
import { ConfigService } from '../../model/config.service';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    host: { 'class': 'app-products' },
    styleUrls: ['./products.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ProductsComponent implements OnInit, OnDestroy {

    groupsOpened: boolean;
    filtersOpened: boolean;

    r: ResourcesService;

    groupId: number;

    productsList: ProductsService;
    breadcrumbs: b2b.Group[];
    groups: GroupsService;
    areNoFilters: boolean;

    cartNumbers: string[];

    keys: Function;

    loadingList: boolean;

    filterMessageOpened: boolean;

    private searchFormEventSubscription: Subscription;
    globalCartId: number;

    /**
    * Watcher and debounce timer for filtering options.
    */
    private filtersSubject: Subject<void>;
    private filtersSubscription: Subscription;


    private groupChangesSub: Subscription;
    private newListSub: Subscription;
    private groupsLoaded: Subscription;

    private activatedRouteSub: Subscription;


    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router,
        public configService: ConfigService,
        resourcesService: ResourcesService,
        private cartsService: CartsService,
        groupsService: GroupsService,
        productsService: ProductsService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
        this.productsList = productsService;

        this.keys = Object.keys;


        this.filtersSubject = new Subject<void>();

    }


    ngOnInit() {

        this.areNoFilters = true;

        this.filterMessageOpened = false;
        this.groupsOpened = false;
        this.filtersOpened = false;

        this.globalCartId = 1;

        this.loadingList = true;

        this.activatedRouteSub = this.activatedRoute.params.subscribe(params => {

            this.groupId = Number(params.id);

            if (this.groupId === 0 && !this.productsList.filters.currentFilter.filter) {
                this.router.navigate(['/']);
                return;
            }

            if (!this.breadcrumbs && this.groups.history) {
                this.setBreadcrumbs(this.groups.history);
            }

            this.configService.permissionsPromise.then(() => {
                this.loadProducts(this.groupId);
            });
            
        });

        this.productsList.loadClassesParameters();

        this.productsList.loadFilters();

        /**
        * Observe search form
        */
        this.searchFormEventSubscription = this.productsList.searchEvent.subscribe((res) => {
            this.loadProducts(this.groupId);
        });

        /**
        * Observe filters with debounce timing
        */
        this.filtersSubscription = this.filtersSubject.debounceTime(1000).subscribe(() => {
            this.productsList.paginationRepo.changePage(0);
            this.loadProducts(this.groupId);
        });


        this.groupChangesSub = this.groups.groupChanged.subscribe((id) => {
            this.handleVisibility('groups', false);
        });

        this.groupsLoaded = this.groups.groupsLoaded.subscribe(res => {
            this.setBreadcrumbs(res.history);
            this.groupsLoaded.unsubscribe();
        });

        this.newListSub = this.groups.productsChanged.subscribe(res => {
            this.groupId = res.id;
            this.loadProducts(res.id);
            this.setBreadcrumbs(res.history);
        });

    }


    loadProducts(groupId: number, cartId?: number): Promise<void> {

        this.loadingList = true;

        this.productsList.products = [];

        return this.productsList.loadProducts(groupId, cartId).then((res) => {

            this.areNoFilters = this.productsList.areNoFilters();

            if (this.productsList.config.displayType === DisplayType.grid && this.configService.isMobile) {
                this.productsList.config.displayType = DisplayType.list;
            }

            this.productsList.products.forEach(item => {

                item.pricesLoaded = !this.configService.permissions.pricesVisibility;
        
                item.imageLoaded = !this.productsList.config.showImages || item.imageId === null;

                item.unitsLoaded = !!item.unitLockChange;

            });


            this.loadingList = false;
        });
    }

    pricesAsync(i: number) {

        if (this.configService.permissions.pricesVisibility) {

            let cartNumber = '1';

            if (this.cartNumbers) {
                cartNumber = this.cartNumbers[0];
            }

            this.productsList.pricesAsync(i).then((index: number) => {
                this.productsList.products[index] = Object.assign(this.productsList.products[index], this.productsList.products[index], { cartId: cartNumber });
                this.productsList.products[index].pricesLoaded = true;
            });
        }


    }

    imageLoaded(i: number) {
        this.productsList.products[i].imageLoaded = true;
    }


    updateCurrentFilter(filter: b2b.CurrentFilter) {

        this.productsList.setCurrentFilter(filter);

        if (filter.filter !== undefined) {
            this.productsList.searchEvent.next({ searchPhrase: filter.filter });
        }

        if (filter.isGlobalFilter === undefined && filter.filter === undefined) {
            this.filtersSubject.next();
        }

    }


    updateParameterValue(key, valueKey, triggeringSection) {

        if (triggeringSection === FiltersObjectType.current) {

            this.productsList.filters.features = <b2b.Collection<b2b.FilterParameter>>this.productsList.updateParameterValue(key, valueKey, triggeringSection);

        } else {

            this.productsList.filters.currentFilter.features = <b2b.FilterParameter[]>this.productsList.updateParameterValue(key, valueKey, triggeringSection);
        }

        this.filtersSubject.next();
    }


    resetAllFilters() {

        this.productsList.resetAllFilters();
        this.productsList.searchEvent.next({ searchPhrase: '' });
        this.loadProducts(this.groupId);

    }

    selectFilterProfile(id) {

        this.productsList.selectFilterProfile(id).then((res) => {

            this.loadProducts(this.groupId);

        });

    }

    changePage(currentPage) {

        this.productsList.paginationRepo.changePage(currentPage);
        this.loadProducts(this.groupId);
    }


    addToCart(item) {

        if (item.quantity && item.quantity > 0) {

            const productItem: b2b.AddToCartRequest = {
                id: item.cartId,
                articleId: item.id,
                quantity: item.quantity,
                warehouseId: this.productsList.filters.currentFilter.warehouse.id, //why cart needs warehouse?
                features: this.productsList.parametersToString(0),
                fromQuote: null,
                unitDefault: item.unitId
            };

            this.cartsService.addToCart(productItem).then(() => {
                item.quantity = 1;
            });

        }

    }


    trackByFn(index, item: b2b.ListProduct) {
        return item.id;
    }

    addManyToCart(cartId = 1) {

        const products = this.productsList.products.filter(item => {

            return item.quantity > 0;

        });

        if (products.length > 0) {

            const requestArray = products.map(item => {

                return <b2b.AddToCartRequest>{
                    id: cartId,
                    articleId: item.id, /* item.Id must be send as articleId (??? what about itemId property?) */
                    quantity: item.quantity,
                    warehouseId: this.productsList.filters.currentFilter.warehouse.id, //why cart needs warehouse?
                    features: this.productsList.parametersToString(0),
                    fromQuote: null,
                    unitDefault: item.unitId
                };
            });


            this.cartsService.addManyToCart(requestArray).then(res => {

                this.productsList.products.forEach((item, i) => {

                    if (item.quantityChanged) {
                        item.quantity = 0;
                        item.quantityChanged = false;
                    }
                });
            });
        }
    }

    setBreadcrumbs(breadcrumbs: b2b.Group[]) {
        this.breadcrumbs = breadcrumbs;
    }

    handleVisibility(section: 'groups' | 'filters' | 'filterMessage', visibility?: boolean) {

        if (visibility === undefined) {

            if (section === 'groups') {
                this.groupsOpened = !this.groupsOpened;

            } else if (section === 'filterMessage') {
                this.filterMessageOpened = !this.filterMessageOpened;

            } else {
                this.filtersOpened = !this.filtersOpened;
            }

        } else {

            if (section === 'groups') {
                this.groupsOpened = visibility;

            } else if (section === 'filterMessage') {
                this.filterMessageOpened = visibility;

            } else {
                this.filtersOpened = visibility;
            }
        }


    }


    addFilterProfile(form: FormGroup) {
        this.productsList.addFilterProfile().then(() => {

            if (this.productsList.filters.currentFilter.filterId !== 0) {
                this.handleVisibility('filterMessage', true);
                form.controls.profileName.reset();
            }
        });
    }

    ngOnDestroy() {

        this.activatedRouteSub.unsubscribe();
        this.filtersSubject.unsubscribe();
        this.filtersSubscription.unsubscribe();
        this.searchFormEventSubscription.unsubscribe();
        this.groupChangesSub.unsubscribe();
        this.newListSub.unsubscribe();
    }
}
