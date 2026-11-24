import { Camo, ItemType, Skin, SkinOfferChangeType, Weapon } from "~~/prisma/generated/client";
import { ApiResponse } from "..";

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