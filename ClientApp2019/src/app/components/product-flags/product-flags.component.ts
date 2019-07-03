import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { ResourcesService } from '../../model/resources.service';

@Component({
    selector: 'app-product-flags',
    templateUrl: './product-flags.component.html',
    styleUrls: ['./product-flags.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { 'class': 'app-product-flags' }
})
export class ProductFlagsComponent implements OnInit {

    r: ResourcesService;

    @Input()
    value: number;

    @Input()
    amount: number;

    bitwiseTrues: number[];

    constructor(resourcesService: ResourcesService) {
        this.r = resourcesService;
        this.bitwiseTrues = [];
        
    }

    ngOnInit() {


        for (let i = 2; i <= 512; i = i << 1) {
            if (this.value & i) {
                this.bitwiseTrues.push(i);
            }

        }

        if (this.amount) {
            this.bitwiseTrues = this.bitwiseTrues.slice(0, this.amount);
        }
    }
}
