import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { b2b } from 'src/b2b';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigService } from 'src/app/model/config.service';
import { MenuService } from 'src/app/model/menu.service';
import { ServiceJobDetailsService } from 'src/app/model/service-job-details.service';
import { ResourcesService } from 'src/app/model/resources.service';

@Component({
    selector: 'app-service-job-details',
    templateUrl: './service-job-details.component.html',
    styleUrls: ['./service-job-details.component.scss'],
    host: { class: 'app-service-job-details app-document-details' },
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceJobDetailsComponent implements OnInit, OnDestroy {

    backMenuItem: b2b.MenuItem;
    currentMenuItem: b2b.MenuItem;

    detailsPopupVisible: boolean;
    popupData: b2b.ServiceJobDeviceActionDetails;

    paymentsPopupVisible: boolean;

    constructor(
        private activatedRoute: ActivatedRoute,
        public configService: ConfigService,
        public menuService: MenuService,
        private router: Router,
        public serviceJobDetailsService: ServiceJobDetailsService,
        private changeDetector: ChangeDetectorRef,
        public r: ResourcesService
    ) { }

    ngOnInit() {
        this.activatedRoute.params.subscribe(params => {

            this.configService.loaderSubj.next(true);

            this.loadDetails(params.id);

            this.menuService.loadFullMenuItems().then(res => {
                const defaultBackMenu = Object.assign({}, this.menuService.fullMenuItems.find(item => this.router.url.includes(item.url)));
                this.backMenuItem = this.menuService.convertLabelToBack(defaultBackMenu, 'back');
                this.changeDetector.markForCheck();
            });


        });
    }


    loadDetails(id) {
        this.configService.loaderSubj.next(true);

        return this.serviceJobDetailsService.loadDetails(id).then(() => {
            this.changeDetector.markForCheck();
            this.configService.loaderSubj.next(false);
        });

    }


    loadDeviceActions(deviceId) {
        return this.serviceJobDetailsService.loadDeviceActions(deviceId).then((res) => {
            this.changeDetector.markForCheck();
            return res;
        });
    }


    loadDeviceActionDetails(actionId, deviceId) {

        this.popupData = null;

        return this.serviceJobDetailsService.loadDeviceActionDetails(actionId, deviceId).then((res) => {
            this.popupData = res;
            this.changeDetector.markForCheck();
            return res;
        });
    }


    changeRowCollapserVisibility(row: any, visibility?: boolean, visibilityProperty = 'opened') {

        if (typeof visibility === 'boolean') {
            row[visibilityProperty] = visibility;
        } else {
            row[visibilityProperty] = !row[visibilityProperty];
        }

    }


    changePopupVisibility(popupType: 'actionDetails' | 'payments', visibility?: boolean) {

        if (popupType === 'actionDetails') {
            if (typeof visibility === 'boolean') {
                this.detailsPopupVisible = visibility;
            } else {
                this.detailsPopupVisible = !this.detailsPopupVisible;
            }
        } else {
            if (typeof visibility === 'boolean') {
                this.paymentsPopupVisible = visibility;
            } else {
                this.paymentsPopupVisible = !this.detailsPopupVisible;
            }
        }
    }


    loadPayments() {
        this.serviceJobDetailsService.loadPayments().then((res) => {
            this.changeDetector.markForCheck();
            return res;
        });
    }

    print() {
        this.serviceJobDetailsService.clearDetailsBoxMessages();
        this.serviceJobDetailsService.print().then(() => {
            this.changeDetector.markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.serviceJobDetailsService.clearDetailsBoxMessages();
    }
}
