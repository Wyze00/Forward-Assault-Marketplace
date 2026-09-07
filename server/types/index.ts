import { ItemType } from "~~/prisma/generated/client";

export interface FetchResponse {
    status: number;
    msg?: string; 
}

export interface GetSellOffersResponse extends FetchResponse {
    offers: [{
        offerID: string,
        sellerID: string,
        sellerName: string,
        skinID: string,
        itemType: ItemType,
        weaponType: number,
        camoID: number,
        price: number,
        listingDate: string
    }]
}

export interface GetUniqueItemsResponse extends FetchResponse {
    items: [{
        kind: 'skin';
        itemType: ItemType;
        weaponType: number;
        camoID: number;
    }],
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    hasMore: boolean;
}

export interface PostCamoRequest {
    itemType: ItemType;
    camoID: number;
    camoName: string;
}

export interface PostWeaponRequest {
    weaponType: number;
    weaponName: string;
}