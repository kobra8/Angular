import { Pipe, PipeTransform } from '@angular/core';
import { ConvertingUtils } from '../converting-utils';

/**
 * adds % to percent value
 * if 0, returns empty string
 */
@Pipe({
    name: 'percentOrEmpty'
})
export class PercentOrEmpty implements PipeTransform {

    transform(value = ''): any {

        if (value === '' || (value.includes && value.includes('%'))) {
            return value;
        }

        let numericValue = <any>value;

        if (typeof numericValue === 'string') {
            numericValue = ConvertingUtils.stringToNum(value);
        }

        if (numericValue === 0) {
            return '';
        }

        return value + ' %';
    }

}
