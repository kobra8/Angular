import { Component, OnInit, ViewEncapsulation, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { GroupsService } from '../../model/groups.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';
import { ConfigService } from '../../model/config.service';

@Component({
    selector: 'app-groups',
    templateUrl: './groups.component.html',
    styleUrls: ['./groups.component.scss'],
    host: { class: 'app-groups'},
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupsComponent implements OnInit {

    r: ResourcesService;
    groups: GroupsService;

    @Input()
    isProductsPage: boolean;

    private _initialGroupId: number;

    @Input()
    set initialGroupId(val) {

        if (val !== undefined && val !== null && this._initialGroupId === undefined) {
            this._initialGroupId = val;

            if (this._initialGroupId !== this.groups.currentGroupId || this.groups.childGroups.length === 0) {
                this.groups.goToGroup(this.initialGroupId, 1).then(() => {
                    this.changeDetector.markForCheck();
                });
            }
        }
    }

    get initialGroupId() {
        return this._initialGroupId;
    }

    articlesMenuItem: b2b.MenuItem;

    barExceptItems: b2b.MenuItem[];

    constructor(
        resourcesService: ResourcesService,
        groupsService: GroupsService,
        private menuService: MenuService,
        private changeDetector: ChangeDetectorRef,
        private configService: ConfigService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
    }

    ngOnInit() {

        this.menuService.loadFullMenuItems().then((fullItems) => {
            this.articlesMenuItem = fullItems.find(item => item.url === this.configService.routePaths.items);
            this.barExceptItems = this.menuService.defaultMenuItems.filter(item => item.url !== this.configService.routePaths.items);
            this.changeDetector.markForCheck();
        });

    }

    backToPreviousGroup() {
        this.groups.backToPreviousGroup().then(() => {
            this.changeDetector.markForCheck();
        });
    }

    goToGroup(groupId = 0, isExpand: 0 | 1) {

        if (this.groups.currentGroupId !== groupId) {
            return this.groups.goToGroup(groupId, isExpand).then(() => {
                this.changeDetector.markForCheck();
            });
        }

        return Promise.resolve();
    }

    goToNewList(groupId = 0, isExpand: 0 | 1) {

        if (this.groups.currentGroupId !== groupId) {
            return this.groups.goToNewList(groupId, isExpand).then(() => {
                this.changeDetector.markForCheck();
            }).catch(() => {
                this.changeDetector.markForCheck();
            });
        }

        return Promise.resolve();
    }

}
