import { Pipe, PipeTransform } from '@angular/core';

/**
* Places given variables in place of indexed bracket substrings.
* Eg. {{page {0} of {1}' | format: page, pagesAmount}} => 'page 1 of 5'.
* If no variables are given: removes bracket strings, like: {{page {0} of {1}' | format}} => 'page of';
*/
@Pipe({
    name: 'format'
})
export class FormatPipe implements PipeTransform {

    transform(value: any, args?: any | any[]): any {

        if (value === undefined || value === null) {
            return '';
        }

        if (args === undefined) {
            return value.replace(/{\d}\s*/g, '').trim();
        }

        if (!(args instanceof Array)) {
            args = [args];
        }

        let str = value;

        args.forEach((item, i) => {
            const reg = new RegExp('\\{' + i + '\\}');
            str = str.replace(reg, args[i]);
        });

        return str;
    }
}
