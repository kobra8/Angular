import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { ConfigService } from 'src/app/model/config.service';

/**
 * Formats numeric price to proper string format.
 * arg[0]: decimal places (optional, default 2)
 * arg[1]: decimal separator (optional, default coma)
 * arg[2]: thousand separator (optional, default space)
 */
@Injectable({
    providedIn: 'root'
})
@Pipe({
    name: 'toPrice'
})
export class ToPricePipe implements PipeTransform {

    constructor(private configService: ConfigService) {

    }

    transform(value: any, args?: any): any {

        if (!this.configService.config) {
            return '';
        }

        if (value === null || value === undefined || +value !== +value) {
            return value;
        }

        let defaultDecimalPlaces = this.configService.config.precision;

        if (this.configService.applicationId === 0) {
            if (this.configService.config.precision === 1) {
                defaultDecimalPlaces = 2;
            } else {
                defaultDecimalPlaces = 4;
            }
        }


        const decimalPlaces: number = (args !== undefined && args[0] !== undefined) ? args[0] : defaultDecimalPlaces || 2;
        const decimalSeparator: string = (args !== undefined && args[2] !== undefined) ? args[1] : ',';
        const thousandSeparator: string = (args !== undefined && args[1] !== undefined) ? args[2] : ' ';



        const re = '\\d(?=(\\d{' + 3 + '})+' + (decimalPlaces > 0 ? '\\D' : '$') + ')';
        const num = Number(value).toFixed(Math.max(0, Math.trunc(decimalPlaces)));

        return num.replace('.', decimalSeparator).replace(new RegExp(re, 'g'), '$&' + (thousandSeparator || ','));

    }

}
