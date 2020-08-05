import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as FileSaver from 'file-saver';

@Injectable()
export class PrintHandlerService {

    constructor(private httpClient: HttpClient) { }

    private printRequest(pageId: number, documentId: number, documentTypeId: number = null, documentMode: number = null): Promise<any> {
        const documentTypeIdQueryString = documentTypeId != null ? '&documenttypeid=' + documentTypeId : '';
        const documentModeQueryString = documentMode != null ? '&documentmode=' + documentMode : '';

        return this.httpClient.get('/printhandler.ashx?pageid=' + pageId + '&documentid=' + documentId + documentTypeIdQueryString + documentModeQueryString, { responseType: 'arraybuffer', observe: 'response' }).toPromise();
    }

    print(pageId: number, documentId: number, documentTypeId?: number, documentMode?: number): Promise<void> {

        return this.printRequest(pageId, documentId, documentTypeId, documentMode).then((res) => {
            const fileName = decodeURI(res.headers.get('content-disposition').split('filename=')[1]);
            const blob = new Blob([res.body], { type: 'application/octet-stream' });
            FileSaver.saveAs(blob, fileName);
        });
    }
}
