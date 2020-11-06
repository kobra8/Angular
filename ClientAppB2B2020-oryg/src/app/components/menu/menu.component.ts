import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterContentChecked, ViewChild, Type } from '@angular/core';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { MenuService } from '../../model/menu.service';
import { AccountService } from '../../model/account.service';
import { Subscription } from 'rxjs';
import { ConfigService } from '../../model/config.service';
import { CartsService } from '../../model/carts.service';
import { NgForm } from '@angular/forms';
import { CsvParserResponseEnum } from '../../model/enums/csv-parser-response-enum.enum';
import { Router } from '@angular/router';
import { AddToCartResponseEnum } from 'src/app/model/enums/add-to-cart-response-enum';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';
import { b2bCarts } from 'src/integration/b2b-carts';
import { Config } from '../../helpers/config';
import { AfterAddingToCart } from '../../model/enums/after-adding-to-cart.enum';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    host: { 'class': 'app-menu' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit, OnDestroy, AfterContentChecked {

    r: ResourcesService;

    @Input()
    groupsAsDrop: boolean;

    getTreeParams: b2b.TreeParameters;

    @Input()
    set initialGroupId(val : number) {

        this.getTreeParams = {
            groupId: val,
            parentId: null
        };
    }

    @Output()
    toggleExternalGroups: EventEmitter<void>;

    private _menuItems: b2b.MenuItem[];

    @Input()
    set menuItems(menuItems: b2b.MenuItem[]) {
        this._menuItems = menuItems;
        this.isDefaultMenu = false;
    }

    get menuItems() {
        return this._menuItems;
    }

    externalGroupsOpened: boolean;

    logInSub: Subscription;
    logOutSub: Subscription;

    cartImportedResponse: b2b.ImportFromCsvResponse;

    isDefaultMenu: boolean;

    @ViewChild('importCsvForm', { static: false })
    importCsvForm: NgForm;

    constructor(
        public menuService: MenuService,
        public accountService: AccountService,
        resourcesService: ResourcesService,
        public cartsService: CartsService,
        public configService: ConfigService,
        private changeDetector: ChangeDetectorRef,
        public router: Router,
        private commonModalService: CommonModalService,
        private commonAvailableCartsService: CommonAvailableCartsService
    ) {
        this.r = resourcesService;
        this.toggleExternalGroups = new EventEmitter<void>();

        if (!this.menuItems) {
            this.logInSub = this.accountService.logInSubj.subscribe(() => {
                this.initMenu();
            });

            this.logOutSub = this.accountService.logOutSubj.subscribe(() => {
                this.clearMenu();
            });
        }
    }

    ngOnInit() {

        if (this.accountService.authenticated) {
            this.initMenu();
        }
    }

    ngAfterContentChecked(): void {
        this.changeDetector.markForCheck();
    }

    initMenu() {
        if (!this.menuItems || this.menuItems.length === 0) {
            this.menuService.loadFullMenuItems().then(() => {
                this._menuItems = this.menuService.defaultMenuItems;
                this.isDefaultMenu = true;
                this.changeDetector.markForCheck();
            });
        }
    }

    clearMenu() {
        this.menuService.clearMenu();
        this.menuItems = undefined;
        this.isDefaultMenu = false;
        this.changeDetector.markForCheck();
    }

    importCsv(files: FileList, cartId: number) {
        if (!cartId) {
            this.commonModalService.showNoAvailableCartsModalMessage();
            return;
        }

        const file = files.item(0);
        if (!file) {
            return;
        }
        this.configService.loaderSubj.next(true);

        const request = {
            cartId: cartId,
            createNewCart: cartId === Config.createNewCartId,
            csvFile: file
        } as b2bCarts.ImportFromCsvRequest;

        this.cartsService.importFromCsv(request).then(res => {
            this.configService.loaderSubj.next(false);

            if (res.responseEnum === CsvParserResponseEnum.Ok && res.lineSummary.length === 0) {
                const status = this.cartsService.prepareAddToCartStatus(res.cartIdentifier, AddToCartResponseEnum.AllProductsAdded);
                this.cartsService.productAdded.next(status);

                if (this.router.url.includes(this.menuService.routePaths.fileImportResult) && this.cartsService.addToCartBehaviour.behaviourType === AfterAddingToCart.stay) {
                    this.router.navigate([this.menuService.routePaths.home]);
                }

            } else {
                this.menuService.cartImportedResponse = res;
                this.menuService.cartIdFormImported = cartId;

                if (res.lineSummary.length > 50) {
                    this.router.navigate([this.menuService.routePaths.fileImportResult]);
                }
            }

            if (res.atLeastOneProductImported) {
                this.cartsService.loadList();
                this.commonAvailableCartsService.refreshAvailableCarts();
            }

            this.importCsvForm.controls.csvFile.reset();
            this.changeDetector.markForCheck();
        });
    }

    closeImportResponseModal() {
        this.menuService.cartImportedResponse = undefined;
        this.menuService.cartIdFormImported = undefined;
    }

    downloadDefaultCsv() {
        this.cartsService.downloadDefaultCsv();
    }


    ngOnDestroy(): void {
        if (!this.logInSub.closed) {
            this.logInSub.unsubscribe();
        }

        if (!this.logOutSub.closed) {
            this.logOutSub.unsubscribe();
        }
    }
}
