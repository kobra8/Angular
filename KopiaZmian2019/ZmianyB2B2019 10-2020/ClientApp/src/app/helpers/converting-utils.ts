import { b2b } from '../../b2b';

export class ConvertingUtils {

    static stringToNum(value: string): number {

        if (value === undefined || value === null) {
            return 0;
        } else {
            value = value + '';
        }

        if (value.includes('.') && value.includes(',')) {
            value = value.replace(/[.]/g, '');
        }

        return Number(value.replace(',', '.').replace(/\s|%/g, ''));
    }

    static numToString(value: number, separator = ','): string {

        if (value === undefined || value === null) {
            return '';
        }

        return (value + '').replace('.', separator);
    }

    /**
     * Combines unit convertion info from denominator, numerator and unit strings.
     */
    static unitConverterString(denominator: number, auxiliaryUnit: string, numerator: number, basicUnit: string, quantity = 1, decimalPlaces = 2): string {

        const roundedDenominator = +(denominator * quantity).toFixed(decimalPlaces);
        const roundedNumerator = +(numerator * quantity).toFixed(decimalPlaces);

        return `${roundedDenominator} ${auxiliaryUnit} = ${roundedNumerator} ${basicUnit}`;
    }

    /**
     * Separates unit converter params from formatted string.
     */
    static splitConverterString(converterString: string): b2b.UnitConverter {

        const converterArray = converterString.replace(/[(|)|]/g, '').split(/[=|\s]/g).filter(el => el !== '');

        return {
            denominator: Number(converterArray[0]),
            auxiliaryUnit: converterArray[1],
            numerator: Number(converterArray[2]),
            basicUnit: converterArray[3],
        };

    }

    /**
     * Calculate basic price from convertedPrice, denominator and numerator.
     */
    static calculateBasicUnitPrice(convertedPrice: number, denominator: number, numerator: number): number {

        return convertedPrice * denominator / numerator;
    }

    /**
     * Converts array of object parameters to plain json object.
     * Suppored structures: [key, value] or [[key1, value1], [key2, value2], ...]
     */
    static paramsArrayToObject<T>(paramsArray: string[] | [string, string][]): T {

        if (paramsArray[0] instanceof Array) {

            return (<[string, string][]>paramsArray).map(el => {

                const paramEl: any = {};
                paramEl[el[0]] = el[1];
                return paramEl;

            }).reduce((el1, el2) => {

                return Object.assign(el1, el2);
            }) as T;
        }

        const paramEl: any = {};
        paramEl[(<string[]>paramsArray)[0]] = paramsArray[1];
        return <T>paramEl;

    }


    static lowercaseFirstLetter(string: string): string {
        return string.slice(0, 1).toLowerCase() + string.slice(1);
    }

    /**
     * Converts queryString to javascript object
     */
    //static queryStringToObject<T>(qs: string): T {

    //    return <T>qs.slice(1).split('&')
    //        .map(el => {

    //            const paramsArray = el.split('=');
    //            const obj = {};
    //            obj[paramsArray[0]] = paramsArray[1];
    //            return obj;

    //        }).reduce((el1, el2) => {

    //            return Object.assign(el1, el2);
    //        });
    //}
}
