import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { UiUtils } from '../helpers/ui-utils';
import { Subject } from 'rxjs';
import { b2bUser } from 'src/integration/b2b-user';

/**
 * Translations
 */
@Injectable()
export class ResourcesService {

    languageId: number;
    languageCode: string;

    languages: b2b.Language[];
    languagesPromise: Promise<b2b.Language[]>;
    private languagesPromiseResolve: Function;
    private languagesPromiseReject: Function;

    translations: any;
    translationsPromise: Promise<void>;
    private translationsPromiseResolve: Function;
    private translationsPromiseReject: Function;


    languageChanged: Subject<number>;

    constructor(private httpClient: HttpClient) {

        this.translationsPromise = new Promise((resolve, reject) => {
            this.translationsPromiseResolve = resolve;
            this.translationsPromiseReject = reject;
        });

        this.languagesPromise = new Promise((resolve, reject) => {
            this.languagesPromiseResolve = resolve;
            this.languagesPromiseReject = reject;
        });

        this.languageChanged = new Subject<number>();

        this.languageCode = UiUtils.getCookie('_culture');

        //if cookie exists, and languageId not known -> requests must go synchronously
        if (this.languageCode && this.languageId === undefined) {
            this.getLanguages().then(() => {
                this.loadTranslations();
            });
            return;
        }

        //if cookie exists, and languageId is known -> no need to call languages list
        if (this.languageCode && this.languageId) {
            document.querySelector<HTMLElement>('html').lang = this.languageCode;
            this.loadTranslations();
            return;
        }

        //if cookie does not exist
        if (!this.languageCode) {
            this.setDefaultCulture().then(() => {
                this.loadTranslations();
            });
        }
    }

    /**
     * Gets translations from server, updates model and returns promise with translations.
     */
    public loadTranslations(langId = this.languageId): Promise<any> {

        const params: any = this.languageId === undefined ? '' : '?languageId=' + langId;



        return this.httpClient.get<any>('/resources/getbylanguageid' + params).toPromise().then((res: any) => {

            this.translations = res;
            this.translationsPromiseResolve(res);

            this.languageChanged.next(langId);
            return this.translationsPromise;

        }).catch(err => {
            if (err.status === 404) {
                return this.setDefaultAppCulture().then(() => {
                    return this.loadTranslations();
                });
            }

            this.translationsPromiseReject(err);
            return this.translationsPromise;
        });
    }


    getLanguages(): Promise<b2b.Language[]> {

        this.httpClient.get<b2b.Language[]>('/languages/getactive').toPromise().then(res => {

            this.languages = res;

            if (this.languageCode) {
                this.languageId = this.languages.find(lang => lang.LanguageCode === this.languageCode).Id;

            } else {
                const defaultLang = this.languages.find(lang => lang.IsDefault);
                this.languageId = defaultLang.Id;
                this.languageCode = defaultLang.LanguageCode;
            }

            document.querySelector<HTMLElement>('html').lang = this.languageCode;

            this.languagesPromiseResolve(res);
        }).catch(err => {

            this.languagesPromiseReject(err);
        });

        return this.languagesPromise;
    }

    private getDefaultLanguages(): Promise<b2b.Language> {
        return this.httpClient.get<b2b.Language[]>('/languages/getactive').toPromise().then(res => {
            return res.find(lang => lang.IsDefault);
        });
    }

    private setDefaultAppCulture(): Promise<void> {
        return this.getDefaultLanguages().then(res => {
            return this.setCulture(res.LanguageCode, res.Id);
        });
    }


    setCulture(culture: string, id: number): Promise<void> {
        this.languageId = id;
        this.languageCode = culture;
        document.querySelector<HTMLElement>('html').lang = this.languageCode;
        return this.httpClient.post<void>('/account/setculture', { culture: culture }).toPromise();
    }

    setDefaultCulture(): Promise<void> {
        return this.httpClient.post<b2bUser.SetDefaultCultureResponse>('/account/SetDefaultCulture', null).toPromise().then((res) => {
            this.languageId = res.Id;
            this.languageCode = res.LanguageCode;
            document.querySelector<HTMLElement>('html').lang = this.languageCode;
        });
    }

}
