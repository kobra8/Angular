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

    private _treeParameters: b2b.TreeParameters;

    @Input()
    set initialGroupId(val) {

        if (val !== undefined && val !== null && val.groupId !== null && val.groupId !== undefined && this._treeParameters === undefined) {
            this._treeParameters = val;

            if (this._treeParameters.groupId !== this.groups.currentGroupId || this.groups.childGroups.length === 0) {
                this.groups.goToGroup(this._treeParameters.groupId, 1, this._treeParameters.parentId).then(() => {
                    this.changeDetector.markForCheck();
                });
            }
        }
    }

    articlesMenuItem: b2b.MenuItem;

    barExceptItems: b2b.MenuItem[];

    constructor(
        resourcesService: ResourcesService,
        groupsService: GroupsService,
        private menuService: MenuService,
        private changeDetector: ChangeDetectorRef,
        public configService: ConfigService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
    }

    ngOnInit() {

        this.menuService.loadFullMenuItems().then((fullItems) => {
            this.articlesMenuItem = fullItems.find(item => item.url === this.menuService.routePaths.items);
            this.barExceptItems = this.menuService.defaultMenuItems.filter(item => item.url !== this.menuService.routePaths.items);
            this.changeDetector.markForCheck();
        });

    }

    backToPreviousGroup() {
        this.groups.backToPreviousGroup().then(() => {
            this.changeDetector.markForCheck();
        });
    }

    goToGroup(groupId = 0, isExpand: 0 | 1, parentId = null) {

        if (this.groups.currentGroupId !== groupId) {
            return this.groups.goToGroup(groupId, isExpand, parentId).then(() => {
                this.changeDetector.markForCheck();
            });
        }

        return Promise.resolve();
    }

    goToNewList(groupId = 0, isExpand: 0 | 1, parentId = null) {

        if (this.groups.currentGroupId !== groupId) {
            return this.groups.goToNewList(groupId, isExpand, parentId).then(() => {
                this.changeDetector.markForCheck();
            }).catch(() => {
                this.changeDetector.markForCheck(); 
            });
        }

        return Promise.resolve();
    }

}
