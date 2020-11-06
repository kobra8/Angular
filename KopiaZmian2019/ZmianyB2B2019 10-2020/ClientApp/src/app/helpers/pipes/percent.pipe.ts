import { Pipe, PipeTransform } from '@angular/core';
import { ConvertingUtils } from '../converting-utils';

@Pipe({
  name: 'percent'
})
export class PercentPipe implements PipeTransform {

  transform(value = ''): any {

      if (value === null) {
          return '';
      }

      if (value === '' || (value.includes && value.includes('%'))) {
          return value;
      }

      let numericValue = <any>value;

      if (typeof numericValue === 'string') {
          numericValue = ConvertingUtils.stringToNum(value);
      }

      return value + ' %';

  }

}
