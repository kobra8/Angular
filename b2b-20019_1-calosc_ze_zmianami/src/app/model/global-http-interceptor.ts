import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AccountService } from './account.service';
import { ConfigService } from './config.service';

export class GlobalHttpInterceptor implements HttpInterceptor {


    constructor(
        private router: Router,
        private accountService: AccountService,
        private configService: ConfigService
    ) { }

    // full return: Observable<HttpSentEvent | HttpHeaderResponse | HttpProgressEvent | HttpResponse<any> | HttpUserEvent<any>>
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {


        let modified = req;

        if (req.method.toLowerCase() !== 'get' && this.accountService.authenticated && this.accountService.token) {

            let headers = new HttpHeaders();
            headers = headers.append('__RequestVerificationToken', this.accountService.token);
            modified = req.clone({ headers: headers });

        }

        return next.handle(modified).pipe(catchError((err) => {

            if (err instanceof HttpErrorResponse && err.status === 401) {

                this.accountService.authenticated = false;
                this.accountService.logOutSubj.next();
                if (this.router.routerState.snapshot.url !== this.configService.routePaths.login) {
                    this.router.navigate([this.configService.routePaths.login]);
                }
            }

            if (err instanceof HttpErrorResponse && err.status === 400) {
                this.accountService.getToken();
                this.router.navigate([this.configService.routePaths.home]);
            }

            if (err instanceof HttpErrorResponse && err.status === 0 && this.configService.isOnline) {
                // [ chrome only ]
                // It looks like requests try to access the cache data right after browser clears it.
                // It throws exceptions from service worker, rejects promises, and blocks javascript chaining flow.
                // It happends when storage usage exceeds 500kb.
                // Fix: send request again
                return this.intercept(req, next);

            }

            return throwError(err);

        }));

    }
}
