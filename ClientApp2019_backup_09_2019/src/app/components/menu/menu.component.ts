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

    @ViewChild('importCsvForm')
    importCsvForm: NgForm;


    constructor(
        public menuService: MenuService,
        public accountService: AccountService,
        resourcesService: ResourcesService,
        public cartsService: CartsService,
        public configService: ConfigService,
        private changeDetector: ChangeDetectorRef,
        public router: Router
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

    importCsv(files: FileList) {

        const file = files.item(0);
        const cartId = this.importCsvForm.controls.cartId.value;

        if (file && cartId !== undefined) {

            this.configService.loaderSubj.next(true);

            this.cartsService.importFromCsv(cartId, file).then(res => {

                this.configService.loaderSubj.next(false);

                if (res.responseEnum === CsvParserResponseEnum.Ok && res.lineSummary.length === 0) {

                    this.cartsService.productAdded.next({ cartId: cartId, addedCount: 2, notAddedCount: 0 });

                    if (this.router.url.includes(this.configService.routePaths.fileImportResult)) {
                        this.router.navigate([this.configService.routePaths.home]);
                    }

                    this.cartsService.productAdded.next({ cartId: cartId, addedCount: 2, notAddedCount: 0 });

                } else {

                    this.menuService.cartImportedResponse = res;
                    this.menuService.cartIdFormImported = cartId;

                    if (res.lineSummary.length > 50) {
                        this.router.navigate([this.configService.routePaths.fileImportResult]);
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

    ngOnDestroy(): void {
        if (!this.logInSub.closed) {
            this.logInSub.unsubscribe();
        }

        if (!this.logOutSub.closed) {
            this.logOutSub.unsubscribe();
        }
    }
}
