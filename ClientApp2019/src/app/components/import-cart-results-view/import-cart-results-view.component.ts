import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { MenuService } from '../../model/menu.service';
import { Router } from '@angular/router';
import { ConfigService } from '../../model/config.service';

@Component({
    selector: 'app-import-cart-results-view',
    templateUrl: './import-cart-results-view.component.html',
    styleUrls: ['./import-cart-results-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ImportCartResultsViewComponent implements OnInit, OnDestroy {
    
    constructor(private router: Router, private menuService: MenuService, private configService: ConfigService) { }

    ngOnInit() {
        if (!this.menuService.cartImportedResponse) {
            this.router.navigate([this.configService.routePaths.home]);
        }
    }


    ngOnDestroy(): void {
        this.menuService.cartImportedResponse = undefined;
        this.menuService.cartIdFormImported = undefined;
    }

}
