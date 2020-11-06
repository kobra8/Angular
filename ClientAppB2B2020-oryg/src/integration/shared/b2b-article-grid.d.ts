import { b2bShared } from 'src/integration/b2b-shared';
import { QuantityDisplayType } from 'src/app/model/shared/enums/quantity-display-type.enum';

export module b2bArticleGrid {

    interface GridArticle {
        article: b2bShared.ArticleBase;
        unit?: b2bShared.ArticleUnits;
        quantity?: number;
        itemId: number;
        selected?: boolean;
    }

    interface GridArticleSummary {
        count?: number;
    }

    interface GridArticleConfig {
        showImages?: boolean;
        showCode?: boolean;
        showItemsSelection?: boolean;
        showRemoveButtons?: boolean;
        quantityDisplayType?: QuantityDisplayType;
        allItemsSelected?: boolean;
        allItemsSelectedByUser?: boolean;
    }

    interface ChangeItemQuantity {
        itemId: number;
        quantity: number;
    }

    interface GridArticleSelection {
        itemId: number;
        isSelected: boolean;
    }
}
