import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';
import { MenuService } from '../../model/menu.service';


@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    host: { 'class': 'app-menu' },
    encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit {

    r: ResourcesService;

    @Input()
    menuItems: b2b.MenuItem[];

    @Input()
    groupsAsDrop: boolean;

    @Input()
    initialGroupId: number;
     
    @Output()
    toggleExternalGroups: EventEmitter<void>;

    externalGroupsOpened: boolean;

    constructor(
        private menuService: MenuService,
        resourcesService: ResourcesService
    ) {
        this.r = resourcesService;
        this.toggleExternalGroups = new EventEmitter<void>();
    }


    ngOnInit() {

        if (this.groupsAsDrop === undefined) {
            this.groupsAsDrop = true;
        }

        if (this.menuService.fullMenuItems === undefined) {

            this.menuService.loadFullMenuItems().then(res => {

                if (this.menuItems === undefined) {
                    this.menuItems = this.menuService.defaultMenuItems;
                }
            });
        }

        if (this.menuItems === undefined && this.menuService.fullMenuItems !== undefined) {
            this.menuItems = this.menuService.defaultMenuItems;
        }


    }


}
