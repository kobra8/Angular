import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';
import { GroupsService } from '../../model/groups.service';
import { b2b } from '../../../b2b';
import { MenuService } from '../../model/menu.service';

@Component({
    selector: 'app-groups',
    templateUrl: './groups.component.html',
    styleUrls: ['./groups.component.scss'],
    host: { class: 'app-groups'},
    encapsulation: ViewEncapsulation.None
})
export class GroupsComponent implements OnInit {

    r: ResourcesService;
    groups: GroupsService;

    @Input()
    isProductsPage: boolean;

    @Input()
    initialGroupId: number;

    articlesMenuItem: b2b.MenuItem;

    barExceptItems: b2b.MenuItem[];

    constructor(
        resourcesService: ResourcesService,
        groupsService: GroupsService,
        private menuService: MenuService
    ) {
        this.r = resourcesService;
        this.groups = groupsService;
    }

    ngOnInit() {

        this.initialGroupId = (this.initialGroupId === undefined) ? 0 : Number(this.initialGroupId);

        this.groups.goToGroup(Number(this.initialGroupId), 1);

        this.menuService.loadFullMenuItems().then((fullItems) => {
            this.articlesMenuItem = fullItems.find(item => item.url.toLocaleLowerCase().includes('items'));
            this.barExceptItems = this.menuService.defaultMenuItems.filter(item => !item.url.toLocaleLowerCase().includes('items'));
        });

    }

}
