import { b2b } from 'src/b2b';

export module b2bUser {

    interface LoginResponse {
        IsNeededReloadCacheAndTranslations: boolean;
    }

    interface SetDefaultCultureResponse extends b2b.Language { }
}

