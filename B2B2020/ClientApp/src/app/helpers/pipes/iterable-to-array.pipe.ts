import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'iterableToArray'
})
export class IterableToArrayPipe implements PipeTransform {

    transform(value: any): [any, any][] {

        if (value && value.entries) {
            return <[any, any][]>Array.from(value);

        } else {

            return value;
        }

    }

}
