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

    static removeForbiddenColumns(columns, config: b2b.ProductsTableConfig): Map<string, string> {

        const priceMode = Number(config.priceMode);


        if (!config.pricesVisibility || priceMode === PriceMode.total) {
            columns.delete('netPrice');
            columns.delete('netValue');
            columns.delete('subtotalPrice');
            columns.delete('subtotalValue');
        }

        if (!config.pricesVisibility || priceMode === PriceMode.subtotal) {
            columns.delete('grossPrice');
            columns.delete('grossValue');
            columns.delete('totalPrice');
            columns.delete('totalValue');
        }

        if (!config.pricesVisibility) {
            columns.delete('price');
            columns.delete('currency');
            columns.delete('amount');
            columns.delete('remaining');
        }

        if (!config.canComplain) {
            columns.delete('complain');
        }

        if (!config.showCarts) {
            columns.delete('addToCart');
        }

        return columns;
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
