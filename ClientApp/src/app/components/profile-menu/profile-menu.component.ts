import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuService } from '../../model/menu.service';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-profile-menu',
    templateUrl: './profile-menu.component.html',
    styleUrls: ['./profile-menu.component.scss'],
    host: { class: 'app-profile-menu' },
    encapsulation: ViewEncapsulation.None
})
export class ProfileMenuComponent implements OnInit {

    items: b2b.MenuItem[];
    r: ResourcesService;

    constructor(private menuService: MenuService, resourcesService: ResourcesService) {
        this.r = resourcesService;
    }

    ngOnInit() {

        if (!this.items) {
            this.loadMenuItems();
        }
    }

    loadMenuItems() {

        this.menuService.loadFullMenuItems().then(() => {
            this.items = this.menuService.profileSidebar;
        });
    }
}
