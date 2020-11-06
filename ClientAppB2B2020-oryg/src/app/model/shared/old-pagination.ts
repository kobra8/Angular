import { b2b } from 'src/b2b';

export class OldPagination {

    /**
     * starts from 0
     */
    currentPage: number;
    pageSize: number;
    hasMore: boolean;

    constructor(config?: b2b.OldPaginationConfig) {

        this.changeParams(config);
    }

    /**
     * Calculates params for requests
     */
    getRequestParams(): b2b.OldPaginationRequestParams {
        return {
            skip: this.pageSize * this.currentPage + 1,
            top: this.pageSize
        };
    }

    /**
     * Changing page and scrolls to top of page. Pages starts from 0.
     */
    changePage(currentPage: number, dontScroll = false, hasMore?: boolean): void {

        this.currentPage = currentPage;

        if (typeof hasMore === 'boolean') {
            this.hasMore = hasMore;
        }

        if (!dontScroll) {
            window.scrollTo(0, 0);
        }
    }

    changeParams(config = <b2b.OldPaginationConfig>{}) {
        this.currentPage = config.currentPage || this.currentPage || 0;
        this.pageSize = config.pageSize || this.pageSize || 50;

        if (typeof config.hasMore === 'boolean') {
            this.hasMore = config.hasMore;
        }
    }

    goToStart(dontScroll = false, hasMore?: boolean) {
        this.changePage(0, dontScroll, hasMore);
    }
}
