import { b2b } from '../../b2b';
import { PriceMode } from '../model/enums/price-mode.enum';

/**
 * Helper for checkichg user's permissions
 */
export class PermissionHelper {

    private constructor() { }

    static getShowNetPrice(pricesVisibility: boolean, priceMode: PriceMode): boolean {

        return pricesVisibility && (priceMode === PriceMode.subtotal || priceMode === PriceMode.both);

    }

    static getShowGrossPrice(pricesVisibility: boolean, priceMode: number): boolean {

        return pricesVisibility && (priceMode === PriceMode.total || priceMode === PriceMode.both);

    }

    static getShowPrice(pricesVisibility: boolean): boolean {

        return pricesVisibility;

    }

    static removeForbiddenColumns(columns: b2b.ColumnConfig[], config: b2b.CustomerConfig & b2b.Permissions): b2b.ColumnConfig[] {

        const priceMode = Number(config.priceMode);

        const newColumns = columns.filter(el => {

            if (el.property === 'netPrice'
                || el.property === 'netValue'
                || el.property === 'subtotalPrice'
                || el.property === 'subtotalValue') {

                return config.pricesVisibility && priceMode !== PriceMode.total;
            }

            if (el.property === 'grossPrice'
                || el.property === 'grossValue'
                || el.property === 'totalPrice'
                || el.property === 'totalValue') {

                return config.pricesVisibility && priceMode !== PriceMode.subtotal;
            }

            if (el.property === 'price'
                || el.property === 'currency'
                || el.property === 'amount'
                || el.property === 'remaining') {

                return config.pricesVisibility;
            }

            if (el.property === 'complain') {
                return config.canComplain;
            }


            if (el.property === 'addToCart') {
                return config.showCarts;
            }


            if (el.property === 'discount') {
                return config.showDiscount;
            }

            return true;

        });

        return newColumns;
    }


    static clearForbiddenSummaryData(summaries, config) {

        const grossVisible = PermissionHelper.getShowGrossPrice(config.pricesVisibility, Number(config.priceMode));
        const netVisible = PermissionHelper.getShowNetPrice(config.pricesVisibility, Number(config.priceMode));

        return summaries.map(item => {

            if (item.grossAmount) {
                return Object.assign(item, {
                    grossAmount: grossVisible ? item.grossAmount : null,
                    netAmount: netVisible ? item.netAmount : null,
                    vatValue: (grossVisible || netVisible) ? item.vatValue : null
                });
            }

            if (item.gross) {

                return Object.assign(item, {
                    gross: grossVisible ? item.gross : null,
                    net: netVisible ? item.net : null,
                    vatValue: (grossVisible || netVisible) ? (item.vatValue || item.gross - item.net) : null
                });
            }

            return item;

        });
    }
}
