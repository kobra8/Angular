import { Component, ViewEncapsulation, Input, EventEmitter, Output } from '@angular/core';
import { CsvParserResponseEnum } from '../../model/enums/csv-parser-response-enum.enum';
import { ResourcesService } from '../../model/resources.service';
import { CsvLineErrorEnum } from '../../model/enums/csv-line-error-enum.enum';
import { CsvLineWarningEnum } from '../../model/enums/csv-line-warning-enum.enum';
import { CsvProductFinalEnum } from '../../model/enums/csv-product-final-enum.enum';
import { ConfigService } from '../../model/config.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MenuService } from '../../model/menu.service';

@Component({
    selector: 'app-import-cart-results',
    templateUrl: './import-cart-results.component.html',
    styleUrls: ['./import-cart-results.component.scss'],
    host: {class: 'app-import-cart-results'},
    encapsulation: ViewEncapsulation.None
})
export class ImportCartResultsComponent {
    

    @Input()
    cartId: number;

    @Output()
    closeMiddleware: EventEmitter<void>;

    isRouteSub: Subscription;

    @Input()
    asView: boolean;

    constructor(
        public r: ResourcesService,
        public configService: ConfigService,
        public router: Router,
        public menuService: MenuService
    ) {
        this.closeMiddleware = new EventEmitter<void>();
    }

    getParserResponseTranslation(parserResponseEnum: CsvParserResponseEnum): string {

        switch (parserResponseEnum) {
            case CsvParserResponseEnum.FileEmpty:
                return 'csvFileEmpty';
            case CsvParserResponseEnum.FileTooMuchLines:
                return 'csvFileTooMuchLines';
            case CsvParserResponseEnum.LessThan3Headers:
                return 'csvLessThan3Headers';
            case CsvParserResponseEnum.CodeShouldBeFirst:
                return 'csvCodeShouldBeFirst';
            case CsvParserResponseEnum.QuantityShouldBeSecond:
                return 'csvQuantityShouldBeSecond';
            case CsvParserResponseEnum.UnitShouldBeThird:
                return 'csvUnitShouldBeThird';
            case CsvParserResponseEnum.HeadersOkNoProductsToImport:
                return 'csvHeadersOkNoProductsToImport';
            default:
                return null;
        }
    }

    getLineErrorTranslation(lineErrorEnum: CsvLineErrorEnum): string {

        switch (lineErrorEnum) {
            case CsvLineErrorEnum.CodeEmpty:
                return 'csvCodeEmpty';
            case CsvLineErrorEnum.CouldNotParseQuantity:
                return 'csvCouldNotParseQuantity';
            case CsvLineErrorEnum.Empty:
                return 'csvEmpty';
            case CsvLineErrorEnum.LineEmpty:
                return 'csvLineEmpty';
            case CsvLineErrorEnum.ProductNotFound:
                return 'csvProductNotFound';
            default:
                return null;
        }
    }

    getLineWarningTranslation(lineWarningEnum: CsvLineWarningEnum): string {

        switch (lineWarningEnum) {
            case CsvLineWarningEnum.MoreThanOneProductFound:
                return 'csvMoreThanOneProductFound';
            case CsvLineWarningEnum.QuantityWarning:
                return 'csvQuantityWarning';
            case CsvLineWarningEnum.UnitWarning:
                return 'csvUnitWarning';
            default:
                return null;

        }
    }

    getProductFinalTranslation(productFinalEnum: CsvProductFinalEnum): string {

        switch (productFinalEnum) {
            case CsvProductFinalEnum.ImportDone:
                return 'csvImportDone';
            case CsvProductFinalEnum.ImportError:
                return 'csvImportError';
            case CsvProductFinalEnum.UnableToImportProduct:
                return 'csvUnableToImportProduct';
            case CsvProductFinalEnum.UnitNotFound:
                return 'csvUnitNotFound';
            default:
                return null;
        }
    }


    
}
