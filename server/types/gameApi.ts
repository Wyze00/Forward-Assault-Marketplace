/**
 * Declaration type for the response from the game API.
 */
import { ItemType } from "~~/prisma/generated/enums";

export interface GameAPIResponse {
    status: number;
    msg?: string; 
}

/**
 * marketplaceV3_get_sell_offers.php
 * itemType=${itemType}&weaponType=${weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20
 */
export interface GetSellOffersGameAPIResponse extends GameAPIResponse {
    offers: {
        offerID: number,
        sellerID: number,
        sellerName: string,
        skinID: number,
        itemType: ItemType,
        weaponType: number,
        camoID: number,
        condition: number,
        price: number,
        listingDate: string
    }[]
}

/**
 * marketplaceV3_get_unique_items.php
 * page=${page}&itemPerPage=${itemPerPage}&sortBy=newest
 */
export interface GetUniqueItemsGameAPIResponse extends GameAPIResponse {
    items: {
        kind: 'skin';
        itemType: ItemType;
        weaponType: number;
        camoID: number;
        lowestPrice: number;
    }[],
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    hasMore: boolean;
}