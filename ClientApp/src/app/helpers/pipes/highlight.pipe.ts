import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {

    transform(value: string, arg?: string): string {

        if (value === undefined) {
            return '';
        }

        if (arg === undefined) {
            return value;
        }

        const regex = new RegExp(arg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = value.match(regex);

        if (matches && matches.length > 0) {
            matches.forEach(item => {
                value = value.replace(item, '<mark>' + item + '</mark>');
            });
        }


        return value;
    }

}
