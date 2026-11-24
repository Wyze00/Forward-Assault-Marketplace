import { ItemType } from "~~/prisma/generated/enums";
import { ApiResponse } from "..";

export interface GetSellersResponse extends  ApiResponse<{
    sellerID: number,
    names: string[],
    offers: {
        offerID: number,
        sellerID: number,
        skinID: number,
        skinUuid: string,
        itemType: ItemType,
        name: string,
        condition: number,
        price: number,
        listingDate: string,
        lastSeenAt: Date,
        status: string,
    }[],
    activeCount: number,
    removedCount: number,
}> {};