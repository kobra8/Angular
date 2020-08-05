import { b2bShared } from 'src/integration/b2b-shared';

export module b2bProducts {

    interface GetSuggestionsBaseRequest {
        filter: string;
        groupId: number;
    }

    interface GetSuggestionsXlRequest extends GetSuggestionsBaseRequest { }
    interface GetSuggestionsAltumRequest extends GetSuggestionsBaseRequest { }


    interface GetSuggestionsBaseResponse {
        suggestions: SuggestionBase[];
    }
    interface GetSuggestionsXlResponse {
        suggestions: SuggestionXl[];
    }
    interface GetSuggestionsAltumResponse {
        suggestions: SuggestionAltum[];
    }

    interface SuggestionBase {
        article: b2bShared.ArticleBase;
    }
    interface SuggestionXl extends SuggestionBase {
        article: b2bShared.ArticleXl;
    }
    interface SuggestionAltum extends SuggestionBase {
        article: b2bShared.ArticleAltum;
    }

    interface SearchArticlesData {
        searchValue?: string;
        suggestions?: SuggestionBase[];
    }
}
