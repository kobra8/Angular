import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { b2bShared } from 'src/integration/b2b-shared';
import { ConfigService } from '../config.service';

@Injectable({
    providedIn: 'root'
})
export class CountryService {

    private _countriesSummary: b2bShared.CountriesSummary;
    countriesChanged: BehaviorSubject<b2bShared.CountriesSummary>;

    constructor(private httpClient: HttpClient, private configService: ConfigService) {
        this._countriesSummary = {
            countries: [],
            defaultCountry: null
        };
        this.countriesChanged = new BehaviorSubject<b2bShared.CountriesSummary>(this._countriesSummary);
    }

    refreshCountriesIfRequired() {
        if (this.configService.applicationId !== 0) {
            return;
        }
        if (!this._countriesSummary || !this._countriesSummary.defaultCountry || this._countriesSummary.countries.length === 0) {
            this.refreshCountries();
        }
    }

    private refreshCountries() {
        this.getCountriesRequest().subscribe((res) => {
            const summary = {
                countries: res.countries,
                defaultCountry: res.defaultCountry,
            };
            this._countriesSummary = summary;
            this.countriesChanged.next(summary);
        });
    }

    private getCountriesRequest() {
        return this.httpClient.get<b2bShared.GetCountriesXlResponse>('/api/Carts/countryListXl');
    }
}
