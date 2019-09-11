import { Pipe, PipeTransform } from '@angular/core';
import { ConvertingUtils } from '../converting-utils';

/**
 * Places given variables in place of indexed bracket substgings.
 * Eg. ''page {0} of {1}' | format: page, pagesAmount' could be transformed to 'page 1 of 5'.
 */
@Pipe({
    name: 'format'
})
export class FormatPipe implements PipeTransform {

    transform(value: any, args?: any): any {

        return ConvertingUtils.format(value, args);
    }
}
