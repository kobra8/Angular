import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Config } from '../config';

export class CustomValidators {
    static zipCode(zipRegexString: string): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } => {

            if (!zipRegexString) {
                return null;
            }
            if (!new RegExp(zipRegexString).test(control.value)) {
                return { incorrectZipCode: true };
            }
            return null;
        };
    }

    static email(control: AbstractControl): { [key: string]: any } {

        if (!control.value) {
            return null;
        }

        if (!Config.emailRegexString.test(control.value)) {
            return { incorrectEmail: true };
        }
        return null;
    }
}
