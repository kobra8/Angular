import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'removeTime'
})
export class RemoveTimePipe implements PipeTransform {

    transform(value: string): string {
        return value.split('T')[0];
    }

}
