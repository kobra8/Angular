import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { PromotionsService } from '../../model/promotions.service';
import { ResourcesService } from '../../model/resources.service';
import { b2b } from '../../../b2b';
import { PromotionDetailsService } from '../../model/promotion-details.service';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-promotions',
    templateUrl: './promotions.component.html',
    styleUrls: ['./promotions.component.scss'],
    host: {class: 'app-promotions'},
    encapsulation: ViewEncapsulation.None
})
export class PromotionsComponent implements OnInit {

    r: ResourcesService;
    activePromotionId: number; 

    @ViewChild('promotionForm')
    searchForm: NgForm;


    constructor(
        resourcesService: ResourcesService,
        public promotionsService: PromotionsService,
        public promotionDetailsService: PromotionDetailsService
    ) {
        this.r = resourcesService;
    }

    ngOnInit() {

        this.promotionsService.loadList(true, true, true).then(() => {

            if (this.promotionsService.items.length > 0) {
                this.activePromotionId = this.promotionsService.items[0].id;
             //   this.promotionDetailsService.loadDetails(this.activePromotionId);
            } else {
                this.promotionDetailsService.products = [];
            }
        });

    }

    setActive(id) {
        if (id !== this.activePromotionId) {
            this.activePromotionId = id;
            this.promotionDetailsService.products = undefined;
         //   this.promotionDetailsService.loadDetails(this.activePromotionId);
        } 
    }

    search(formValid, formValue) {

        if (formValid) {
            this.promotionsService.filter = formValue.searchPhrase;
            this.promotionsService.loadList(false, true, true).then(() => {
                if (this.promotionsService.items.length > 0) {
                    this.activePromotionId = this.promotionsService.items[0].id;
                  //  this.promotionDetailsService.loadDetails(this.activePromotionId);
                } else {
                    this.promotionDetailsService.products = [];
                }
            })
        }
        else {
             this.promotionsService.loadList(false, true, true).then(() => {
                if (this.promotionsService.items.length > 0) {
                    this.activePromotionId = this.promotionsService.items[0].id;
                //    this.promotionDetailsService.loadDetails(this.activePromotionId);
                } else {
                    this.promotionDetailsService.products = [];
                }
            })
        }
    }
  
}
