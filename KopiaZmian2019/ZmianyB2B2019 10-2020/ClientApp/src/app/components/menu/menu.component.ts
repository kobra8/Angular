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
import { b2bShared } from 'src/b2b-shared';
import { CommonModalService } from 'src/app/model/shared/common-modal.service';
import { ModalMessageType } from 'src/app/model/shared/enums/modal-message-type';
import { CommonAvailableCartsService } from 'src/app/model/shared/common-available-carts.service';



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

    @Input()
    initialGroupId: number;

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

    cartsToAdd: number[];
    importToCartId: number;

    private cartsForArticlesChanged: Subscription;

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
                if (!this.cartsToAdd) {
                    this.loadCartsToAdd();
                }
                this.cartsForArticlesChanged = this.commonAvailableCartsService.cartsForArticlesChanged.subscribe((res) => {
                    this.cartsToAdd = res;
                    this.changeDetector.markForCheck();
                });
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

        const file = files.item(0);

        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }

        if (file && cartId !== undefined) {

            this.configService.loaderSubj.next(true);

            this.cartsService.importFromCsv(cartId, file).then(res => {

                this.configService.loaderSubj.next(false);

                if (res.responseEnum === CsvParserResponseEnum.Ok && res.lineSummary.length === 0) {

                    this.cartsService.productAdded.next({ cartId: cartId, addToCartResponseEnum: AddToCartResponseEnum.AllProductsAdded });
                    this.commonAvailableCartsService.refreshAvailableCarts();

                    if (this.router.url.includes(this.menuService.routePaths.fileImportResult)) {
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
                }

                this.importCsvForm.controls.csvFile.reset();
                this.changeDetector.markForCheck();

            });
        }

    }

    closeImportResponseModal() {
        this.menuService.cartImportedResponse = undefined;
        this.menuService.cartIdFormImported = undefined;
    }


    private loadCartsToAdd() {
        this.commonAvailableCartsService.getCartsForArticles().then((res) => {
            this.cartsToAdd = res;
            this.changeDetector.markForCheck();
        });
    }

    onOpenAddToCartSelect(cartId: number) {
        if (!cartId) {
            this.showNoAvailableCartsMessageInModal();
            return;
        }
    }

    private showNoAvailableCartsMessageInModal() {
        this.commonModalService.showModalMessageType(ModalMessageType.noAvailableCartsToAddArticle);
    }



    ngOnDestroy(): void {
        if (!this.logInSub.closed) {
            this.logInSub.unsubscribe();
        }

        if (!this.logOutSub.closed) {
            this.logOutSub.unsubscribe();
        }

        if (this.cartsForArticlesChanged) {
            this.cartsForArticlesChanged.unsubscribe();
        }
    }
}
