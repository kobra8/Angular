import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Translations
 */
@Injectable()
export class ResourcesService {

    public translations: any;
    public translationsPromise: Promise<void>;

    constructor(private http: HttpClient) {

        this.loadTranslations();
    }

    /**
     * Gets translations from server, updates model and returns promise with translations.
     */
    private loadTranslations(): Promise<any> {

        this.translationsPromise = this.http.get<any>('api/common/resources').toPromise().then((res: any) => {
            this.translations = res;
        });

        return this.translationsPromise;
    }


}
