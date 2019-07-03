
export class FormattingUtils {

    static stringToNum(value: string): number {

        if (value === undefined || value === null) {
            return 0;
        } else {
            value = value.toString();
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

        return value.toString().replace('.', separator);
    }

    /**
      * Places given variables in place of indexed bracket substgings.
      * Eg. {{page {0} of {1}' | format: page, pagesAmount}} => 'page 1 of 5'.
      * If no variables are given: removes bracket strings, like: {{page {0} of {1}' | format}} => 'page of';
      */
    static format(value: string, args?: any): string {

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

    static unitConverterString(denominator: number, auxiliaryUnit: string, numerator: number, basicUnit: string): string {

        return `${denominator} ${auxiliaryUnit} = ${numerator} ${basicUnit}`;
    }

}
