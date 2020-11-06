import { Pipe, PipeTransform } from '@angular/core';
import { DateHelper } from '../date-helper';

@Pipe({
    name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {

    transform(value: string, arg: string): string {
        return DateHelper.format(value, arg);
    }

}
