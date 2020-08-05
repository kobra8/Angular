import { AddToCartResponseEnum } from 'src/app/model/enums/add-to-cart-response-enum';
import { b2bCart } from 'src/integration/b2b-cart';
import { AfterAddingToCart } from '../app/model/enums/after-adding-to-cart.enum';

export module b2bCarts {

    //-------requests-------

    interface ImportFromCsvRequest {
        cartId: number;
        createNewCart: boolean;
        csvFile: any;
    }

    interface UpdateCartNameBaseRequest {
        newCartName: string;
        cartId: number;
    }
    interface UpdateCartNameXlRequest extends UpdateCartNameBaseRequest { }
    interface UpdateCartNameAltumRequest extends UpdateCartNameBaseRequest { }


    //-------responses-------

    interface AddToCartResponse extends AddToCartStatus { }
    interface CopyToCartResponse extends AddToCartStatus { }


    //-----other---------
    interface CartPreviewExtraProperties {
        isNameEdited?: boolean;
        newName?: string;
    }

    interface AddToCartBehaviour {
        behaviourType: AfterAddingToCart;
        isBehaviourTypeRemembered: boolean;
    }

    interface AddToCartStatus {
        cartIdentifier: b2bCart.CartIdentifier;
        addToCartResponseEnum: AddToCartResponseEnum;
    }
}
