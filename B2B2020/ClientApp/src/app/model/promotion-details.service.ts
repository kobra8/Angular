import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pagination } from './shared/pagination';
import { b2b } from '../../b2b';
import { ArrayUtils } from '../helpers/array-utils';
import { ConfigService } from './config.service';
import { ProductBase } from './shared/products-repo';
import { WarehousesService } from './warehouses.service';
import { ConvertingUtils } from '../helpers/converting-utils';
import { ProductStatus } from './enums/product-status.enum';
import { Subscription } from 'rxjs';
import { AccountService } from './account.service';

@Injectable()
export class PromotionDetailsService extends ProductBase {

    id: number;
    pagination: Pagination;
    productsOrDetails: b2b.PromotionProduct[];
    config: b2b.Permissions & b2b.CustomerConfig;
    promotionWarehouse: b2b.AddProductToWarehouse;

    logoutSub: Subscription;

    constructor(httpClient: HttpClient, configService: ConfigService, warehousesService: WarehousesService, private accountService: AccountService) {
        super(httpClient, warehousesService, configService);

        this.pagination = new Pagination();


        this.logoutSub = this.accountService.logOutSubj.subscribe(() => {
            this.productsOrDetails = undefined;
            this.config = undefined;
            this.id = undefined;
        });

    }

    protected requestDetails(id = this.id): Promise<b2b.PromotionDetailsResponseConverted> {

        const params = Object.assign(
            { groupId: 0 },
            this.pagination.getRequestParams()
        );

        return this.httpClient.get<b2b.PromotionDetailsResponse>('/api/promotions/' + id, { params: <any>params })
            .toPromise()
            .then(res => {

                const newSet = res.items.set1.map(product => {
                    const convertedData = {
                        itemExistsInCurrentPriceList: Number(product.itemExistsInCurrentPriceList)
                    };

                    return Object.assign(product, convertedData);
                });

                const newItems = Object.assign(res.items, { set1: newSet });

                return Object.assign(res, { items: newItems });
            });
    }


    loadDetails(id = this.id): Promise<b2b.PromotionDetailsResponseConverted> {

        return this.requestDetails(id).then((res) => {

            this.config = Object.assign({}, this.configService.permissions, this.configService.config, { calculateDiscount: true, showState: false });

            this.id = id;

            this.productsOrDetails = <b2b.PromotionProduct[]>res.items.set1.map((item: b2b.PromotionProduct) => {
                item.quantity = item.quantity || 0;
                item.cartId = 1;
                item.unitId = item.defaultUnitNo;
                item.status = item.itemExistsInCurrentPriceList ? item.status : ProductStatus.unavaliable;

                if (item.auxiliaryUnit && item.denominator) {
                    item.converter = ConvertingUtils.unitConverterString(item.denominator, item.auxiliaryUnit, item.numerator, item.basicUnit);
                }

                return item;
            });

            this.promotionWarehouse = res.warehouse;

            if (this.promotionWarehouse.isPromotionForWarehouse) {
                this.config = Object.assign(this.config, { addToWarehouseId: this.promotionWarehouse.warehouseId });
            }

            this.pagination.changeParams(res.paging);

            return res;
        }).catch(err => {
            return Promise.reject(err);
        });

    }

    loadUnits(ids: number[]) {

        return this.requestUnitsForManyAndGroupById(ids).then(res => {

            for (const id in res) {

                const indexes = [];

                this.productsOrDetails.forEach((prod, i) => {
                    if (prod.id === Number(id)) {
                        indexes.push(i);
                    }
                });

                indexes.forEach(index => {

                    this.fillUnits(index, res[id], this.productsOrDetails);

                    const defaultUnitData: b2b.UnitMapElement = {
                        basicUnit: this.productsOrDetails[index].basicUnit,
                        isUnitTotal: this.productsOrDetails[index].isUnitTotal,
                        type: this.productsOrDetails[index].type,
                        denominator: this.productsOrDetails[index].denominator,
                        numerator: this.productsOrDetails[index].numerator,
                        converter: this.productsOrDetails[index].converter
                    };

                    this.fillUnitMapElement(index, this.productsOrDetails[index].defaultUnitNo, defaultUnitData, this.productsOrDetails);
                });

            }

        });
    }

    unitConverter(index) {

        const params: b2b.UnitConvertRequest = {
            id: this.productsOrDetails[index].id,
            unitNo: this.productsOrDetails[index].unitId || 0,
            features: '',
            warehouseId: 0
        };

        return super.unitConverter(index, params, this.productsOrDetails);

    }
}
