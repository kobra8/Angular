import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { NewDocumentDetails } from './shared/new-document-details';
import { b2b } from 'src/b2b';
import { ConfigService } from './config.service';
import { HttpClient } from '@angular/common/http';
import { ConvertingUtils } from '../helpers/converting-utils';
import { DocumentType } from './enums/document-type.enum';

@Injectable()
export class ServiceJobDetailsService extends NewDocumentDetails<b2b.ServiceJobDetails> {

    headerResource: string;
    payments: b2b.ServiceJobPayment[];

    constructor(httpClient: HttpClient, configService: ConfigService) {
        super(httpClient, configService);

        this.headerResource = 'serviceJobDetails';
    }

    protected requestDetails(id: number): Promise<b2b.ServiceJobDetailsResponse> {
        return this.httpClient.get<b2b.ServiceJobDetailsResponse>('/api/serviceJob/get/' + id).toPromise();
    }


    protected requestDeviceActions(deviceId: number, serviceJobId = this.id) {
        return this.httpClient.get<b2b.ServiceJobDeviceActionResponse[]>(`/api/serviceJob/deviceActions/${serviceJobId}/${deviceId}`).toPromise();
    }


    protected requestDeviceActionDetails(actionId: number, deviceId: number, serviceJobId = this.id) {
        return this.httpClient.get<b2b.ServiceJobDeviceActionDetails>(`/api/serviceJob/deviceActions/${serviceJobId}/${deviceId}/${actionId}`).toPromise();
    }

    protected requestPayments(serviceJobId = this.id) {
        return this.httpClient.get<b2b.ServiceJobPayment[]>(`/api/serviceJob/payments/` + serviceJobId).toPromise();
    }

    loadDetails(deviceId: number) {

        this.payments = null;

        return super.loadDetails(deviceId).then(res => {

            res.devices = res.devices.map(device => {
                if (device.type) {
                    device.type = ConvertingUtils.lowercaseFirstLetter(device.type);
                }
                return device;
            });

            this.details.devices = res.devices;
            this.details.printHref = '/printhandler.ashx?pageid=' + DocumentType.serviceJob + '&documentid=' + this.id;

            return res;
        });
    }

    loadDeviceActions(deviceId: number, serviceJobId = this.id) {

        const device = this.details.devices.find(device => deviceId === device.id);

        if ('actions' in device) {
            return Promise.resolve(Object.assign({}, device.actions));
        }

        return this.requestDeviceActions(deviceId, serviceJobId).then(res => {

            this.details.devices.find(device => deviceId === device.id).actions = res;
            return res;
        });
    }


    loadDeviceActionDetails(actionId: number, deviceId: number, serviceJobId = this.id) {

        const device = this.details.devices.find(device => deviceId === device.id);
        const action = device.actions.find(action => actionId === action.id);


        if ('details' in action) {
            return Promise.resolve(Object.assign({}, action.details));
        }

        return this.requestDeviceActionDetails(actionId, deviceId, serviceJobId).then(res => {

            action.details = res;
            return res;
        });
    }


    loadPayments(serviceJobId = this.id) {

        if (this.payments) {
            return Promise.resolve(this.payments);
        }

        return this.requestPayments(serviceJobId).then(res => {
            this.payments = res;
            return res;            
        });

    }
}
