import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { b2b } from 'src/b2b';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config.service';


/**
 * Base object for new documents lists (after swagger and refactoring api)
 * T - Details intrface
 * */
export abstract class NewDocumentDetails<T> implements Resolve<ThisType<any>> {

    id: number;
    details: T & b2b.NewCustomerListDetails;
    abstract headerResource: string;

    constructor(protected httpClient: HttpClient, protected configService: ConfigService) {

    }


    protected abstract requestDetails(id: number): Promise<T & b2b.NewCustomerListDetails>;

    loadDetails(id: number) {
        return this.requestDetails(id).then((res) => {
            this.id = id;
            this.details = res;
            return res;
        });
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this;
    }

}
