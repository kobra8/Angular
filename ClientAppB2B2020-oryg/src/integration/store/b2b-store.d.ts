import { b2bShared } from 'src/integration/b2b-shared';
import { b2bCarts } from 'src/integration/b2b-carts';
import { AddToStoreResponseEnum } from '../../app/model/store/enums/add-to-store-response.enum';
import { AfterAddingToCart } from '../../app/model/enums/after-adding-to-cart.enum';

export module b2bStore {

    //-------requests-------

    interface GetStoreContentRequest {
        storeId: number;
        pageNumber: number;
    }

    interface UpdateItemQuantityRequest {
        storeItemId: number;
        quantity: number;
    }

    interface RemoveStoreItemRequest {
        storeId: number;
        itemId: number;
        pageNumber: number;
    }

    interface CopyAllArticlesToCartRequest {
        storeId: number;
        cartId: number;
        createNewCart: boolean;
    }

    interface RemoveStoreRequest {
        storeId: number;
    }

    interface UpdateStoreNameRequest {
        storeId: number;
        newStoreName: string;
    }

    interface AddItemToStore {
        articleId: number;
        quantity: number;
        unitId: number;
    }

    interface AddToStoreRequest {
        storeId: number;
        items: AddItemToStore[];
    }

    interface CreateStoreRequest {
        items: AddItemToStore[];
    }


    //-------responses-------

    interface GetStoresResponse {
        stores: StoreIdentifier[];
    }

    interface GetStoreContentResponse {
        items: StoreArticleListItem[];
        storeIdentifier: StoreIdentifier;
        summary: StoreSummary;
        pagingResponse: b2bShared.PaginationResponse;
    }

    interface RemoveStoreItemResponse {
        storeStillExists: boolean;
        pageNumberToGet: number;
    }

    interface CopyAllArticlesToCartResponse extends b2bCarts.AddToCartResponse { }

    interface AddToStoreStatus {
        storeIdentifier: StoreIdentifier;
        addToStoreResponseEnum: AddToStoreResponseEnum;
    }

    interface AddToStoreResponse extends AddToStoreStatus { }
    interface CreateStoreResponse extends AddToStoreStatus { }

    //-------other-------

    interface StoreIdentifier {
        id: number;
        name: string;
    }

    interface StoreSummary {
        count: number;
    }

    interface StoreArticleListItem extends Partial<StoreArticleListItemExtraProperties> {
        article: b2bShared.ArticleBase;
        unit: b2bShared.ArticleUnits;
        quantity: number;
        itemId: number;
    }

    interface StoreArticleListItemExtraProperties {
        selected?: boolean;
        quantityChanged?: boolean;
    }

    interface StoreArticlesSummary {
        storeExists: boolean;
        articles?: StoreArticleListItem[];
        summary?: StoreSummary;
    }

    interface RemoveStoreData {
        isModalOpen: boolean;
        store: StoreIdentifier;
    }

    interface AddToStoreModalData {
        opened: boolean;
        storeIdentifier?: StoreIdentifier;
        addToStoreStatus?: AddToStoreResponseEnum;
        saveBehaviour?: boolean;
        autoCloseTimeout: number;
    }

    interface AddToStoreBehaviour {
        behaviourType: AfterAddingToCart;
        isBehaviourTypeRemembered: boolean;
    }
}

