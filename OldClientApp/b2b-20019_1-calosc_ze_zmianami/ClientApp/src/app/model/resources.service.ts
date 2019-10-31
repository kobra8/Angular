import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { b2b } from '../../b2b';
import { UiUtils } from '../helpers/ui-utils';
import { Subject } from 'rxjs';

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

        if (this.languageCode && this.languageId === undefined) {

            //if cookie exists, and languageId not known -> requests must go synchronously
            this.getLanguages().then(() => {
                this.loadTranslations();
            });

        } else if (!this.languageCode) {

            //if cookie does not exist, and languageId is known -> requests can go asynchronously
            this.getLanguages();
            this.loadTranslations();

        } else {

            //if cookie exists, and languageId is known -> no need to call languages list
            document.querySelector<HTMLElement>('html').lang = this.languageCode;
            this.loadTranslations();
        }
    }

    /**
     * Gets translations from server, updates model and returns promise with translations.
     */
    public loadTranslations(langId = this.languageId): Promise<any> {

        const params: any = this.languageId === undefined ? '' : '?languageId=' + langId;



        this.httpClient.get<any>('/resources/getbylanguageid' + params).toPromise().then((res: any) => {

            this.translations = res;
            this.translationsPromiseResolve(res);

            this.languageChanged.next(langId);

        }).catch(err => {
            this.translationsPromiseReject(err);
        });



        return this.translationsPromise;
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


    setCulture(culture: string, id: number): Promise<void> {
        this.languageId = id;
        this.languageCode = culture;
        document.querySelector<HTMLElement>('html').lang = this.languageCode;
        return this.httpClient.post<void>('/account/setculture', { culture: culture }).toPromise();
    }

}
