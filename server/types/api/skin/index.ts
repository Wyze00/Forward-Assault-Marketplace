import { Camo, ItemType, Skin, SkinIdealPrice, SkinOfferChangeType, Weapon } from "~~/prisma/generated/client";
import { ApiResponse } from "..";

export type SkinWithWeaponAndCamo = {
    weapon: Weapon,
    camo: Camo,
} & Skin;

interface SkinInfo {
    id: string,
    itemType: ItemType,
    camoName: string,
    weaponName: string,
    name: string,
    lastCaptureDate: Date | string,
    lowestPrice: number,
    isFavorite: boolean,
}

/**
 * Informasi seklias
 */
export interface GetSkinResponse extends ApiResponse<SkinWithWeaponAndCamo[]> {};

/**
 * Informasi detail
 */
export interface GetSkinInfoResponse extends ApiResponse<SkinInfo[]> {};
export interface GetOneSkinInfoResponse extends ApiResponse<SkinInfo> {};

/**
 * Informasi skin per uuid
 */

// History
export interface GetSkinHistoryResponse extends ApiResponse<{
    uuid: string;
    createdAt: Date;
    entries: {
        status: string;
        prevPrice: number | null;
        uuid: string;
        skinHistoryUuid: string;
        offerID: number;
        sellerID: number;
        sellerName: string;
        price: number;
        condition: number;
        skinID: number;
        listingDate: string;
    }[];
}[]> {}

// Ideal price
export interface GetSkinIdealPriceResponse extends ApiResponse<SkinIdealPrice> {}

type a = {
    name: string;
    camoName: string;
    itemType: ItemType;
    isFavorite: boolean;
    idealPrice: number | undefined | null;
    shopPrice: number | undefined | null;
} | null;

// Velocity

export interface GetSkinVelocityResponse extends ApiResponse<{
    averageHours: number | null;
    averageMinutes: number | null;
    count: number;
    firstSeenAt: Date | null;
    lastRemovedAt: Date | null;
}> {}

export interface SkinTrendSoldOffer {
    offerID: number;
    skinID: number;
    sellerID: number;
    sellerName: string;
    condition: number;
    estimatedPrice: number;
}

export interface SkinTrendPoint {
    capturedAt: Date | string;
    soldDetectedAt: Date | string | null;
    floorPrice: number | null;
    avgPrice: number | null;
    count: number;
    inferredSoldOffers: SkinTrendSoldOffer[];
    inferredSoldCount: number;
    estimatedSoldAverage: number | null;
}

export interface SkinTrendSummary {
    label: 'uptrend' | 'downtrend' | 'sideways';
    firstFloorPrice?: number | null;
    lastFloorPrice?: number | null;
    deltaPrice: number;
    changePercent: number;
    inferredSoldCount?: number;
    estimatedSoldAverage?: number | null;
}

export interface SkinTrendCondition {
    conditionGroup: string;
    conditionName: string;
    data: SkinTrendPoint[];
    summary: SkinTrendSummary;
}

export interface GetSkinTrendResponse extends ApiResponse<SkinTrendPoint[]> {
    summary?: SkinTrendSummary;
    conditions?: SkinTrendCondition[];
}

/**
 * Skin offer change
 */
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
