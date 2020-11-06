export const enum CsvParserResponseEnum {
    FileEmpty = 1,                       
    FileTooMuchLines = 2,           
    LessThan3Headers = 3,           
    CodeShouldBeFirst = 4,           
    QuantityShouldBeSecond = 5,     
    UnitShouldBeThird = 6,          
    HeadersOkNoProductsToImport = 7, 
    Ok = 8                           
}
