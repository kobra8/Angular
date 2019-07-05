import * as moment from 'moment-mini';

/**
 * Helper for date calculations.
 * All operations supports native Date object or Moment object from moment.js
 */
export class DateHelper {


    private constructor() { }

    /**
     * Converts given string to Date object (if native param is true) or Moment object (if native is false).
     * Native param is optional, default true.
     */
    static stringToDate(date: string): Date | moment.Moment {

        return <any>date instanceof Date ? moment(date).toDate() : moment(date);
    }

    /**
     * Converts given Date or Moment object to string format: YYYY-MM-DDD.
     * Native value has to match with given type of date.
     * Native value is optional, default true.
     */
    static dateToString(date: Date | moment.Moment): string {

        return <any>date instanceof Date ? moment(<Date>date).format('YYYY-MM-DD') : (<moment.Moment>date).format('YYYY-MM-DD');

    }

    /**
     * Adds months to given date (or subtracts if months value is negative).
     * Returns Date object if native param is true or Moment object if native is false.
     * Native param is optional, default true.
     */
    static calculateMonths(date: Date, months: number): Date | moment.Moment {

        return <any>date instanceof Date ? moment(date).add(months, 'M').toDate() : moment(date).subtract(months, 'M');
    }

    /**
     * Adds days to given date (or subtracts if days value is negative).
     * Returns Date object if native param is true or Moment object if native is false.
     * Native param is optional, default true.
     */
    static calculateDays(date: Date, days: number): Date | moment.Moment {

        return <any>date instanceof Date ? moment(date).add(days, 'd').toDate() : moment(date).add(days, 'd');
    }

    /**
     * Returns difference between two dates. 
     * If unit of time given, returns number of units.
     * If no unit given, returns timestamp.
     */
    static difference(date1: Date | moment.Moment | string, date2: Date | moment.Moment | string, unitOfTime?: moment.unitOfTime.Diff): number {

        return moment(date1).diff(moment(date2), unitOfTime || 'milliseconds');
    }

    /**
     * Returns given day with hour 23:59:59
     */
    static endOfDay(date: Date | moment.Moment): Date | moment.Moment {

        return date instanceof Date ? moment(date).endOf('day').toDate() : moment(date).endOf('day');
    }


    /**
     * Returns given day with hour 00:00:00
     */
    static startOfDay(date: Date | moment.Moment): Date | moment.Moment {

        return date instanceof Date ? moment(date).startOf('day').toDate() : moment(date).endOf('day');
    }


    static isValid(date: string | Date | moment.Moment, min?: Date | moment.Moment, max?: Date | moment.Moment): boolean {

        let convertedDate;

        try {
            convertedDate = moment(date);

            if (!convertedDate.isValid()) {
                return false;
            }

        } catch (err) {
            return false;
        }

        if (convertedDate.diff(moment(0)) < 0) {
            return false;
        }


        if (min && convertedDate.diff(moment(min).startOf('day')) < 0) {
            return false;
        }

        if (max && convertedDate.diff(moment(max).endOf('day')) > 0) {
            return false;
        }

        

        return true;

    }
}
