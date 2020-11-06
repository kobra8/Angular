import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MenuService } from '../../model/menu.service';
import { b2b } from '../../../b2b';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-profile-menu',
    templateUrl: './profile-menu.component.html',
    styleUrls: ['./profile-menu.component.scss'],
    host: { class: 'app-profile-menu' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileMenuComponent implements OnInit {

    items: b2b.MenuItem[];
    r: ResourcesService;

    constructor(private menuService: MenuService, resourcesService: ResourcesService, private changeDetector: ChangeDetectorRef) {
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
            this.changeDetector.markForCheck();
        });
    }
}
