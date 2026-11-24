import { ItemType } from "~~/prisma/generated/client";

export interface FetchResponse {
    status: number;
    msg?: string; 
}

export interface GetSellOffersResponse extends FetchResponse {
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

export interface GetUniqueItemsResponse extends FetchResponse {
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



