import { Component, ViewEncapsulation, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { b2bShared } from 'src/integration/b2b-shared';
import { b2bCartHeader } from 'src/integration/b2b-cart-header';
import { ResourcesService } from '../../model/resources.service';
import { ConfigService } from '../../model/config.service';
import { FormMode } from '../../model/shared/enums/form-mode.enum';
import { AddressType } from '../../model/shared/enums/address-type.enum';
import { CountryService } from '../../model/shared/country.service';
import { CustomValidators } from '../../helpers/validators/custom-validators';


@Component({
    selector: 'app-address-form',
    templateUrl: './address-form.component.html',
    styleUrls: ['./address-form.component.scss'],
    host: { 'class': 'app-address-form' },
    encapsulation: ViewEncapsulation.None
})
export class AddressFormComponent implements OnInit, OnDestroy {

    form: FormGroup;
    disableSubmitBtn: boolean;

    @Input()
    formMode: FormMode;

    @Input()
    editFormData: b2bCartHeader.ShippingAddressXl;

    @Input()
    isOpen: boolean;

    @Output()
    open: EventEmitter<void>;

    @Output()
    close: EventEmitter<void>;

    @Output()
    save: EventEmitter<b2bCartHeader.AddressFormSubmitData>;

    addressType: AddressType;
    countries: b2bShared.Country[];
    private defaultCountry: b2bShared.Country;
    private countriesSub: Subscription;
    private countryChangedSub: Subscription;

    tempAddressDisabled: boolean;
    permAddressDisabled: boolean;

    constructor(
        public r: ResourcesService,
        private configService: ConfigService,
        private countryService: CountryService) {

        this.open = new EventEmitter<void>();
        this.close = new EventEmitter<void>();
        this.save = new EventEmitter<b2bCartHeader.AddressFormSubmitData>();
        this.disableSubmitBtn = false;
    }

    ngOnInit() {
        this.form = new FormGroup({
            companyName: new FormControl(null, [Validators.required]),
            nameAndLastName: new FormControl(null),
            street: new FormControl(null, [Validators.required]),
            zipCode: new FormControl(null, [Validators.required]),
            city: new FormControl(null, [Validators.required]),
            countryId: new FormControl(null),
            phoneNumber: new FormControl(null),
            email: new FormControl(null, [CustomValidators.email]),
        });

        this.countriesSub = this.countryService.countriesChanged.subscribe((summary: b2bShared.CountriesSummary) => {
            this.countries = summary.countries;
            this.defaultCountry = summary.defaultCountry;
            this.form.patchValue({
                countryId: this.defaultCountry ? this.defaultCountry.id : null
            });
        });

        this.countryChangedSub = this.form.get('countryId').valueChanges.subscribe((countryId) => {
            if (!this.countries) {
                return;
            }
            const selectedCountry = this.countries.find(country => country.id === countryId);
            const currentZipCodeRegex = selectedCountry ? selectedCountry.zipCodeRegex : null;
            if (currentZipCodeRegex) {
                this.form.get('zipCode').setValidators([Validators.required, CustomValidators.zipCode(currentZipCodeRegex)]);
            } else {
                this.form.get('zipCode').setValidators([Validators.required]);
            }
            this.form.get('zipCode').updateValueAndValidity();
        });
    }

    onOpen() {
        this.prepareForm();
        this.open.emit();
    }

    private prepareForm() {
        switch (this.formMode) {
            case FormMode.Edit:
                this.prepareEditForm();
                break;
            default:
                this.prepareAddForm();
                break;
        }
        this.disableSubmitBtn = false;
    }

    private prepareAddForm() {
        this.form.reset({
            countryId: this.defaultCountry ? this.defaultCountry.id : null
        });
        if (this.configService.permissions.hasAccessToAddTempShippingAddress) {
            this.addressType = AddressType.Temp;
        } else {
            this.addressType = AddressType.Perm;
        }

        this.tempAddressDisabled = !this.configService.permissions.hasAccessToAddTempShippingAddress;
        this.permAddressDisabled = !this.configService.permissions.hasAccessToAddPermShippingAddress;
    }

    private prepareEditForm() {
        const model = this.editFormData;
        this.form.reset({
            companyName: model.companyName,
            nameAndLastName: model.nameAndLastName,
            street: model.street,
            zipCode: model.zipCode,
            city: model.city,
            countryId: model.country.id,
            phoneNumber: model.phoneNumber,
            email: model.email
        });
        this.addressType = this.editFormData.addressType;

        switch (this.addressType) {
            case AddressType.Temp:
                if (!this.configService.permissions.hasAccessToAddPermShippingAddress) {
                    this.permAddressDisabled = true;
                }
                break;
            case AddressType.Perm:
                this.tempAddressDisabled = true;
                break;
        }
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.disableSubmitBtn = true;
            return;
        }

        const submitData = this.prepareSubmitData();
        this.save.emit(submitData);
    }

    private prepareSubmitData(): b2bCartHeader.AddressFormSubmitData {
        return {
            shippingAddressModel: this.prepareShippingAddressModel(),
            isAddressTemp: Number(this.addressType) === AddressType.Temp,
            addressId: this.formMode === FormMode.Edit ? this.editFormData.addressId : null,
            formMode: this.formMode,
        };
    }

    private prepareShippingAddressModel(): b2bCartHeader.ShippingAddressRequestModel {
        const values = this.form.value;
        return {
            companyName: values.companyName,
            nameAndLastName: values.nameAndLastName,
            street: values.street,
            zipCode: values.zipCode,
            city: values.city,
            countryId: values.countryId,
            phoneNumber: values.phoneNumber,
            email: values.email,
        };
    }

    onClose() {
        this.close.emit();
    }

    ngOnDestroy(): void {
        if (this.countriesSub) {
            this.countriesSub.unsubscribe();
        }

        if (this.countryChangedSub) {
            this.countryChangedSub.unsubscribe();
        }
    }
}
