import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError, from, Subscription, of } from 'rxjs';
import { catchError, switchMap, first } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AccountService } from './account.service';
import { MenuService } from './menu.service';

export class GlobalHttpInterceptor implements HttpInterceptor {


    private logOutSub: Subscription;
    private token$: Observable<string>;


    constructor(
        private router: Router,
        private accountService: AccountService,
        private menuService: MenuService
    ) {
        this.logOutSub = this.accountService.logInSubj.subscribe(() => {
            this.token$ = null;
        });
    }

 
    globalHttpInterceptor(req: HttpRequest<any>, next: HttpHandler, token?: string) {

        let modified = req;

        if (token) {

            let headers = new HttpHeaders();
            headers = headers.append('__RequestVerificationToken', token);
            modified = req.clone({ headers: headers });
        }

        return next.handle(modified).pipe(
            switchMap(res => {

                if (res instanceof HttpResponse && res.status !== 200) {
                    return throwError(res);
                }

                return of(res);
            }),
            catchError(err => this.catchErrors(err, req, next))
        );
    }


    // full return: Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any>>
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {

        if (req.method.toLowerCase() !== 'get' && this.accountService.authenticated && req.url !== this.accountService.tokenReqUrl) {

            if (!this.token$) {
                this.token$ = from(this.accountService.getToken()).pipe(first());
            }


            return this.token$.pipe(
                switchMap(token => this.globalHttpInterceptor(req, next, token))
            );
        }

        return this.globalHttpInterceptor(req, next);

    }


    catchErrors(err, req: HttpRequest<any>, next: HttpHandler) {

        if (err instanceof HttpErrorResponse && err.status === 401) {

            this.accountService.authenticated = false;
            this.accountService.logOutSubj.next();
            if (this.router.routerState.snapshot.url !== this.menuService.routePaths.login) {
                this.router.navigate([this.menuService.routePaths.login]);
            }
        }

        if (err instanceof HttpErrorResponse && err.status === 400) {
            this.accountService.getToken();
            this.router.navigate([this.menuService.routePaths.home]);
        }

        //if (err instanceof HttpErrorResponse && err.status === 0 && this.configService.isOnline) {
        //    // [ chrome only ]
        //    // It looks like requests try to access the cache data right after browser clears it.
        //    // It throws exceptions from service worker, rejects promises, and blocks javascript chaining flow.
        //    // It happends when storage usage exceeds 500kb.
        //    // Fix: send request again
        //    return this.intercept(req, next);

        //}

        return throwError(err);
    }
}
