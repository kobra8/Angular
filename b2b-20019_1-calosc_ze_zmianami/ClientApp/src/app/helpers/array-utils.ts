import { b2b } from '../../b2b';

/**
 * Handy methods for operations with arrays
 */
export class ArrayUtils {

    private constructor() { }

    /**
    * Groups given array by given property.
    */
    static groupBy<T>(array: T[], prop: string): b2b.Collection<T[]> {

        return array.reduce((groups: any, item: any) => {

            const val: T = item[prop];
            groups[val] = groups[val] || [];
            groups[val].push(item);
            return groups;

        }, {});
    }

    /**
     * Inserts element (or array of elements) before given index of array
     */
    static insert<T>(array: T[], index: number, elements: T | T[]): T[] {

        const a = array.slice(); //clear reference by copy 

        const newElements: T[] = (elements instanceof Array) ? elements : [elements];
        const args = [index, 0].concat(<any>newElements);
        Array.prototype.splice.apply(a, args);
        return a;

    }

    /**
     * Moves element with the given index to the top of array
     */
    static moveTop<T>(array: T[], index: number): T[] {

        const a = array.slice(); //clear reference by copy 

        const pulledElement = a.splice(index, 1)[0];
        a.unshift(pulledElement);

        return a;

    }

    /**
     * Creates range array. 
     */
    static toRangeArray<T>(count: T, startFromOne = false): T[] {

        return Array.from({ length: Number(count) }, (el, i) => {

            const val = startFromOne ? i + 1 : i;
            return ((typeof count === 'number') ? val : <any>(val + ''));

        });
    }

    /**
     * Removes array elements from given range 
     */
    static remove<T>(array: T[], from: number, to?: number): T[] {

        const top = array.slice(0, from);

        const rest = array.slice((to || from) + 1 || array.length);

        return top.concat(rest);

    }
}
