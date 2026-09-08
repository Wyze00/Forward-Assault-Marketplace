import { GetSellOffersResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: { skinUuid: string } = await readBody(event);
        
        if (!body.skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const skin = await prismaClient.skin.findUnique({
            where: { uuid: body.skinUuid },
            include: { camo: true, weapon: true }
        });

        if (!skin) {
            throw new Error("Skin tidak ditemukan");
        }

        const itemType = skin.camo.itemType;
        const weaponType = skin.weaponType; // 0 for glove/character
        const camoID = skin.camo.camoID;

        const queryParams = `itemType=${itemType}&weaponType=${weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
        const response = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

        if (!response.offers || response.offers.length === 0) {
            throw new Error("Tidak ada penawaran (offer) yang ditemukan dari marketplace");
        }

        const offersToSave = response.offers.slice(0, 10);

        const newHistory = await prismaClient.skinHistory.create({
            data: {
                skinUuid: skin.uuid,
                skinHistoryEntries: {
                    create: offersToSave.map(offer => ({
                        offerID: offer.offerID,
                        sellerID: offer.sellerID,
                        sellerName: offer.sellerName,
                        price: offer.price,
                        condition: offer.condition,
                        skinID: offer.skinID,
                        listingDate: offer.listingDate,
                    }))
                }
            },
            include: {
                skinHistoryEntries: true
            }
        });

        return {
            msg: "Success",
            data: newHistory
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return {
                msg: e.message
            };
        }
    }
});
