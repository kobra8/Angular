import { b2b } from '../../../b2b';

/**
* Object for managing pagination
*/
export class Pagination {

    /**
     * starts from 1
     */
    currentPage: number;
    buildPager: boolean;
    totalPages: number;

    constructor(config?: b2b.PaginationConfig) {

        this.changeParams(config);
    }

    /**
     * Calculates params for requests
     */
    getRequestParams(): b2b.PaginationRequestParams {
        return {
            pageNumber: this.currentPage
        };
    }

    /**
     * Changing page and scrolls to top of page. Pages starts from 0.
     */
    changePage(currentPage: number, dontScroll = false, buildPager?: boolean): void {


        this.currentPage = currentPage;

        if (typeof buildPager === 'boolean') {
            this.buildPager = buildPager;
        } else {
            this.buildPager = this.currentPage > 1 || this.currentPage < this.totalPages;
        }


        if (!dontScroll) {
            window.scrollTo(0, 0);
        }
    }

    changeParams(config = <b2b.PaginationConfig>{}) {
        this.currentPage = config.currentPage || this.currentPage || 1;
        this.totalPages = config.totalPages || this.totalPages || 0;

        if (typeof config.buildPager === 'boolean') {
            this.buildPager = config.buildPager;
        } 
    }

    goToStart(dontScroll = false, hasMore?: boolean) {
        this.changePage(1, dontScroll, hasMore);
    }
}
