import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {

    regExPat = /^(ngsw).*api.*/;


    constructor() {
    }


    clearCache(requestName?: string): Promise<boolean[][]> {

        if (!window.caches) {
            return Promise.resolve([[true]]);
        }

        if ('serviceWorker' in navigator) {
            return this.clearCaches(requestName);
        }

        return Promise.resolve([[true]]);
    }

    private clearCaches(requestName?: string): Promise<boolean[][]> {

        return caches.keys().then((keys) => {

            const openedCaches: Promise<boolean[]>[] = [];

            keys.forEach((eachCacheName) => {

                if (this.regExPat.test(eachCacheName)) {

                    const openedCache = caches.open(eachCacheName).then((eachCache) => {

                        return eachCache.keys().then((requests) => {

                            let filteredRequests: ReadonlyArray<Request> = [];
                            const deletePromises: Promise<boolean>[] = [];

                            if (requestName) {
                                filteredRequests = requests.filter(req => req.url.includes(requestName));
                            } else {
                                filteredRequests = requests;
                            }

                            filteredRequests.forEach((eachRequest) => {
                                deletePromises.push(eachCache.delete(eachRequest));
                            });

                            return Promise.all(deletePromises);
                        });
                    });

                    openedCaches.push(openedCache);
                }

            });

            return Promise.all(openedCaches);
        });
    }
}
