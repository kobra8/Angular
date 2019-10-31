import { b2b } from '../../../b2b';

/**
* Object for managing pagination
*/
export class PaginationRepo {

    /**
    * Pagination config object
    */
    pagination: b2b.PaginationConfig;

    constructor(config?: b2b.PaginationConfig) {

        const defaultConfig: b2b.PaginationConfig = {
            pageSize: 48,
            currentPage: 0,
            isPrevPage: false,
            isNextPage: false
        };

        this.pagination = Object.assign(defaultConfig, config || {});

    }

    /**
     * Calculates params for requests
     */
    getRequestParams(): b2b.PaginationRequestParams {

        return {
            skip: this.pagination.pageSize * this.pagination.currentPage + 1 + '',
            top: this.pagination.pageSize + ''
        };

    }

    /**
     * Changing page and scrolls to top of page. Pages starts from 0.
     */
    changePage(currentPage: number, isNextPage?: boolean): void {

        this.pagination.currentPage = currentPage;
        this.pagination.isPrevPage = currentPage > 0;

        if (isNextPage !== undefined || isNextPage !== null) {
            this.pagination.isNextPage = isNextPage;
        }

        window.scrollTo(0, 0);
    }

}
