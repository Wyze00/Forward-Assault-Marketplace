import { Camo, ItemType, Skin, SkinOfferChangeType, Weapon } from "~~/prisma/generated/client";

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

export interface PostCamoRequest {
    itemType: ItemType;
    camoID: number;
    camoName: string;
}

export interface PostWeaponRequest {
    weaponType: number;
    weaponName: string;
}

interface ApiResponse<T> {
    msg: string;
    data?: T
}

export interface GetWeaponResponse extends ApiResponse<Weapon[]> {};
export interface GetCamoResponse extends ApiResponse<Camo[]> {};

export type SkinWithWeaponAndCamo = {
    weapon: Weapon,
    camo: Camo,
} & Skin;

export interface GetSkinResponse extends ApiResponse<SkinWithWeaponAndCamo[]> {};

export interface GetSkinOfferChangeResponse extends ApiResponse<{
    uuid: string,
    type: SkinOfferChangeType,
    seen: boolean,
    skinUuid: string,
    itemType: ItemType,
    weaponName: string,
    camoName: string,
    name: string,
    sellerName: string,
    price: number,
    condition: number,
    createdAt: Date,
}[]> {};

export interface GetSkinInfoResponse extends ApiResponse<{
    id: string,
    itemType: ItemType,
    camoName: string,
    weaponName: string,
    name: string,
    lastCaptureDate: Date | string,
    lowestPrice: number,
    isFavorite: boolean,
    idealPrice: number | undefined | null,
    shopPrice: number | undefined | null,
}[]> {};
