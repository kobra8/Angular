import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'highlight'
})
export class HighlightPipe implements PipeTransform {

    transform(value = '', arg?: string): string {

        if (arg === undefined) {
            return value;
        }

        const regex = new RegExp(arg.replace(/[.*+?^${}()|[\]/\\]/g, ''), 'gi');
        const matches = new Set(value.match(regex));

        if (matches && matches.size > 0) {
            matches.forEach(item => {
                const regexOfMatch = new RegExp(item, 'g');
                value = value.replace(regexOfMatch, '<mark>' + item + '</mark>');
            });
        }


        return value;
    }

}
