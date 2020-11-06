import { Component, ViewEncapsulation, Input } from '@angular/core';
import { b2bProductDetails } from 'src/integration/b2b-product-details';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-threshold-price-list',
    templateUrl: './threshold-price-list.component.html',
    styleUrls: ['./threshold-price-list.component.scss'],
    host: { 'class': 'app-threshold-price-list' },
    encapsulation: ViewEncapsulation.None
})
export class ThresholdPriceListComponent {

    @Input()
    thresholdPriceLists: b2bProductDetails.ThresholdPriceLists;

    @Input()
    productName: string;

    @Input()
    productCode: string;

    constructor(public r: ResourcesService) { }
}
