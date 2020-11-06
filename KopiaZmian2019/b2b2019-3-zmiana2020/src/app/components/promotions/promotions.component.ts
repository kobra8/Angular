import { Component, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { PromotionsService } from '../../model/promotions.service';
import { ResourcesService } from '../../model/resources.service';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { ConfigService } from '../../model/config.service';
import { b2b } from '../../../b2b';
import { MenuService } from 'src/app/model/menu.service';
import { CyclicityType } from 'src/app/model/enums/cyclicity-type.enum';
import { FormatPipe } from 'src/app/helpers/pipes/format.pipe';
import { ConvertingUtils } from 'src/app/helpers/converting-utils';
import { PromotionType } from 'src/app/model/enums/promotion-type.enum';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-promotions',
    templateUrl: './promotions.component.html',
    styleUrls: ['./promotions.component.scss'],
    host: { class: 'app-promotions view-with-sidebar' },
    encapsulation: ViewEncapsulation.None,
})
export class PromotionsComponent implements OnInit, OnDestroy {

    r: ResourcesService;
    activePromotionId: number;
    error: string;
    menuItems: b2b.MenuItem[];
    activePromotion: b2b.PromotionsListItem & { cyclicityInfo?: string[]; index: number };
    columns: b2b.ColumnConfig[];

    // JD
    grouptype = false;
    onlySpacesInSearchForm = false;
    private formSubscription = new Subscription;
    private formSubActive = false;
    @ViewChild('promotionProductForm', {static: false})
    searchForm: NgForm;

    constructor(
        resourcesService: ResourcesService,
        public promotionsService: PromotionsService,
        public promotionDetailsService: PromotionDetailsService,
        public configService: ConfigService,
        private menuService: MenuService
    ) {
        this.r = resourcesService;
        this.switchColumns();
    }

    ngOnInit() {

        this.menuService.loadFullMenuItems().then(() => {

            this.menuItems = [
                this.menuService.defaultBackItem
            ];

            const promotionMenuItem = this.menuService.fullMenuItems.find(item => item.url.includes(this.menuService.routePaths.promotions));

            if (promotionMenuItem) {
                this.menuItems.push(promotionMenuItem);
            }

        });

        if (!this.promotionsService.items) {
            this.promotionsService.pagination.goToStart();
            this.loadList();
        }

        if (this.promotionDetailsService.id) {
            const index = this.promotionsService.items.findIndex(item => item.id === this.promotionDetailsService.id);
            this.setActivePromotionData(this.promotionDetailsService.id, index);

        }
    }

    loadList(): Promise<b2b.PromotionsListResponse | null> {
        this.error = null;

        this.configService.loaderSubj.next(true);

        return this.promotionsService.loadList().then((res) => {


            if (this.promotionsService.items.length === 0) {
                this.error = this.r.translations.noPromotions;
            }

            this.configService.loaderSubj.next(false);



            return res;

        }).catch((err: HttpErrorResponse) => {

            if (!this.configService.isOnline && (this.promotionsService.items === undefined || this.promotionDetailsService.productsOrDetails === undefined)) {
                this.error = this.r.translations.noDataInOfflineMode;
            }

            if (err.status === 403) {
                this.error = this.r.translations.promotionForbidden;
            }


            if (err.status === 404) {
                this.error = this.r.translations.promotionNotFound;
            }

            this.configService.loaderSubj.next(false);




            return null;
        });
    }

    loadDetails(id, filter?): Promise<b2b.PromotionDetailsResponse | null> {

        this.configService.loaderSubj.next(true);

        return this.promotionDetailsService.loadDetails(id, filter).then(() => {

            this.configService.loaderSubj.next(false);

        }).catch((err) => {

            if (!this.configService.isOnline && this.promotionDetailsService.productsOrDetails === undefined) {
                this.error = this.r.translations.noDataInOfflineMode;
            }

            if (err.status === 403) {
                this.error = this.r.translations.promotionForbidden;
            }

            this.configService.loaderSubj.next(false);


            return Promise.resolve(err);
        });

    }

    changePage(pageNumber) {
        this.promotionsService.pagination.changePage(pageNumber);
        this.loadList();
    }

    changeDetailsPage(pageNumber) {

        this.promotionDetailsService.pagination.changePage(pageNumber, undefined, this.configService.isMobile);


        this.loadDetails(this.activePromotionId);
    }



    loadActive(id, index) {

        if (id !== this.activePromotionId) {

            this.promotionDetailsService.productsOrDetails = undefined;


            this.promotionDetailsService.pagination.goToStart(undefined, this.configService.isMobile);

            this.loadDetails(id).then(() => {

                this.setActivePromotionData(id, index);

                if (this.activePromotion.type !== PromotionType.PLT && this.activePromotion.type !== PromotionType.KNT) {

                    const groups = this.promotionDetailsService.productsOrDetails.filter(product => product.promotionPositionType === 1);
                    const onlyGroups = groups.length === this.promotionDetailsService.productsOrDetails.length;

                    if (onlyGroups) {
                        this.switchColumns('onlyGroups');
                    }

                    const ids = this.promotionDetailsService.productsOrDetails
                        .filter(prod => !prod.unitLockChange && prod.promotionPositionType !== 1)
                        .map(prod => prod.id);

                    if (ids.length > 0) {
                        this.promotionDetailsService.loadUnits(ids).then(() => {
                            this.promotionDetailsService.productsOrDetails = this.promotionDetailsService.productsOrDetails.slice();

                        });
                    }
                }
            });
        }
    }

    setActivePromotionData(id, index) {
        this.activePromotionId = id;
        this.activePromotion = Object.assign(this.promotionsService.items[index], { index: index });
        this.switchColumns(this.activePromotion.type);

        if (this.activePromotion.cyclicity) {
            this.activePromotion.cyclicityInfo = this.createCyclicityInfo();
        }

        if (this.activePromotion.type === PromotionType.PLT) {
            this.promotionDetailsService.productsOrDetails.forEach(product => {
                delete product.id;
            });
        }
    }

    unitConverter(i) {
        this.promotionDetailsService.unitConverter(i).then(() => {
            this.promotionDetailsService.productsOrDetails = this.promotionDetailsService.productsOrDetails.slice();

        });
    }

    createCyclicityInfo() {

        const formatPipe = new FormatPipe();

        let cyclicityTypeString;
        let cyclicityValuesArgsString;
        let cyclicityValuesString;
        let cyclicityRangeString;
        let cyclicityHoursString;

        if (this.activePromotion.cyclicity.values) {
            cyclicityValuesArgsString = this.activePromotion.cyclicity.values
                .map(val => this.r.translations[ConvertingUtils.lowercaseFirstLetter(val)])
                .join(', ');
        }

        switch (this.activePromotion.cyclicity.type) {

            case CyclicityType.days:

                if (this.activePromotion.cyclicity.value === 1) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryDay1'], this.activePromotion.cyclicity.value);
                } else {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryDay2_'], this.activePromotion.cyclicity.value);
                }

                break;

            case CyclicityType.weeks:

                if (this.activePromotion.cyclicity.value === 1) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryWeek1'], this.activePromotion.cyclicity.value);
                } else if (this.activePromotion.cyclicity.value > 1 && this.activePromotion.cyclicity.value <= 4) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryWeek2_4'], this.activePromotion.cyclicity.value);
                } else {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryWeek5_'], this.activePromotion.cyclicity.value);
                }

                if (cyclicityValuesArgsString) {
                    cyclicityValuesString = formatPipe.transform(this.r.translations['promotionEveryWeekDays'], cyclicityValuesArgsString);
                }

                break;

            case CyclicityType.months:

                if (this.activePromotion.cyclicity.value === 1) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryMonth1'], this.activePromotion.cyclicity.value);
                } else if (this.activePromotion.cyclicity.value > 1 && this.activePromotion.cyclicity.value <= 4) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryMonth2_4'], this.activePromotion.cyclicity.value);
                } else {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryMonth5_'], this.activePromotion.cyclicity.value);
                }

                break;

            case CyclicityType.years:

                if (this.activePromotion.cyclicity.value === 1) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryYear1'], this.activePromotion.cyclicity.value);
                } else if (this.activePromotion.cyclicity.value > 1 && this.activePromotion.cyclicity.value <= 4) {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryYear2_4'], this.activePromotion.cyclicity.value);
                } else {
                    cyclicityTypeString = formatPipe.transform(this.r.translations['promotionEveryYear5_'], this.activePromotion.cyclicity.value);
                }

                if (cyclicityValuesArgsString) {
                    cyclicityValuesString = formatPipe.transform(this.r.translations['promotionEveryYearMonths'], cyclicityValuesArgsString);
                }

                if (this.activePromotion.cyclicity.range) {
                    cyclicityRangeString = formatPipe.transform(this.r.translations['promotionEveryYearsDays'], this.activePromotion.cyclicity.range);
                }

                break;

            case CyclicityType.hours:

                cyclicityTypeString = this.r.translations['promotionEveryDay1'];

                break;

        }

        if (this.activePromotion.cyclicity.hours) {
            cyclicityHoursString = formatPipe.transform(this.r.translations['promotionHours'], this.activePromotion.cyclicity.hours);
        }


        return [cyclicityTypeString, cyclicityValuesString, cyclicityRangeString, cyclicityHoursString]
            .filter(el => el !== undefined);
    }


    switchColumns(type?: PromotionType | 'onlyGroups') {

        if (type === PromotionType.PLT) {
            this.grouptype = false;
            this.columns = [

                { property: 'name', translation: 'paymentForm' },
                { property: 'threshold' },
                { property: 'value', type: 'promotionValue' },
                {
                    property: 'type', translation: 'discountType', type: 'cases', cases: [
                        { case: 1, translation: 'percentage' },
                        { case: 2, translation: 'discountValue' },
                        { case: 3, translation: 'fixedPrice' }
                    ]
                },
                {
                    property: 'vatDirection', translation: 'priceType', type: 'cases', cases: [
                        { case: 'N', translation: 'net' },
                        { case: 'B', translation: 'gross' }
                    ]
                }
            ];

        } else if (type === 'onlyGroups') {
            this.grouptype = true;
            this.columns = [

                { property: 'name', translation: 'articles' },
                { property: 'threshold' },
                { property: 'value', type: 'promotionValue' },
                {
                    property: 'type', translation: 'discountType', type: 'cases', cases: [
                        { case: 1, translation: 'percentage' },
                        { case: 2, translation: 'discountValue' },
                        { case: 3, translation: 'fixedPrice' }
                    ]
                },
                {
                    property: 'vatDirection', translation: 'priceType', type: 'cases', cases: [
                        { case: 'N', translation: 'net' },
                        { case: 'B', translation: 'gross' }
                    ]
                }
            ];


        } else {
            this.grouptype = false;
            this.columns = [

                { property: 'name', translation: 'codeName', type: 'productName' },
                { property: 'threshold' },
                { property: 'value', type: 'promotionValue' },
                {
                    property: 'type', translation: 'discountType', type: 'cases', cases: [
                        { case: 1, translation: 'percentage' },
                        { case: 2, translation: 'discountValue' },
                        { case: 3, translation: 'fixedPrice' }
                    ]
                },
                {
                    property: 'vatDirection', translation: 'priceType', type: 'cases', cases: [
                        { case: 'N', translation: 'net' },
                        { case: 'B', translation: 'gross' }
                    ]
                },
                { property: 'addToCart', translation: '', type: 'addToCart' }
            ];
        }
    }


    clearDetails() {
        this.promotionDetailsService.productsOrDetails = undefined;
        this.promotionDetailsService.id = undefined;
        this.activePromotion = <any>{};
        this.activePromotionId = undefined;
        this.promotionDetailsService.pagination.goToStart();
    }

// JD
    search(formValid, formValue) {
        // JD - clear filter request after form input 'x' click
        if (!this.formSubActive) {
             this.formSubscription.add(this.searchForm.valueChanges.subscribe(x => {
                 if (x.searchPhrase === '') {
                     this.loadDetails(this.activePromotionId, null);
                    }
                })
            );
            this.formSubActive = true;
        }
        if (formValid) {
            this.loadDetails(this.activePromotionId, formValue.searchPhrase);
        }
    }
// JD
    searchInputKeyPress(event) {
        const trimmedValue = event.target.value.trim();
        (trimmedValue.length > 0) ? this.onlySpacesInSearchForm = false : this.onlySpacesInSearchForm = true;
    }
// JD
    ngOnDestroy(): void {
        this.formSubscription.unsubscribe();
        this.formSubActive = false;
    }
}
