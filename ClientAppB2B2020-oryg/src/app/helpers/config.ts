export class Config {

    static readonly createNewCartId: number = -1;
    static readonly createNewStoreId: number = -1;
    static readonly maxCartNameLength: number = 20;
    static readonly autoCloseAddToCartModalTimeout: number = 1500;

    static readonly pageNumberToGetAfterRemoveAllUnavailableCartItems: number = 1;
    static readonly maxDescriptionLength: number = 2000;
    static readonly collapsedDescriptionLength: number = 100;

    static readonly autoHideStatusTimeout: number = 4000;
    static readonly emailRegexString: RegExp = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w{2,}$/;


    static getImageHandlerSrc(imageId: number, width?: boolean, height?: boolean): string {
        return `/imagehandler.ashx?id=${imageId}&fromBinary=${false}&width=${width ? width : 50}&height=${height ? height : 50}`;
    }
}
