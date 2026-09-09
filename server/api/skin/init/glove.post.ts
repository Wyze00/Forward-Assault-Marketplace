import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        // Fetch all character camoID from marketplace
        const camoIDs: number[] = []
        let page = 0;

        while (true) {
            const response = await fetchUtil<GetUniqueItemsResponse>('marketplaceV3_get_unique_items.php', `page=${page}&itemPerPage=20&sortBy=price_asc&itemType=glove`);
            response.items.forEach((skin) => {
                camoIDs.push(skin.camoID);
            })

            if (!response.hasMore) {
                break;
            }

            page++;
        }

        // Cleaning CamoId
        const dbCamo = await prismaClient.camo.findMany({
            where: {
                itemType: ItemType.glove
            },
        })

        const dbCamoMap = new Map<number, Camo>(dbCamo.map((v) => [v.camoID, v]));
        const camoSet = new Set<number>();


        const cleanedCamoIDs = camoIDs.filter((id) => {
            if (dbCamoMap.has(Number(id))) {

                if (camoSet.has(Number(id))) {
                    return false;
                } else {
                    camoSet.add(Number(id));
                }

                return true;
            } else {
                console.log(`Unknown Glove CamoID : ${id}`);
                return false;
            }
        })

        for (const camoID of cleanedCamoIDs) {
            const camo = dbCamoMap.get(camoID)!;

            const skin = await prismaClient.skin.upsert({
                where: {
                    camoUuid_weaponType: {
                        camoUuid: camo.uuid,
                        weaponType: 0,
                    }
                },
                update: {},
                create: {
                    camoUuid: camo.uuid,
                    weaponType: 0,
                }
            });

            const queryParams = `itemType=${camo.itemType}&weaponType=0&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
            const offerResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

            if (offerResponse.offers && offerResponse.offers.length > 0) {
                const offersToSave = offerResponse.offers.slice(0, 10);

                await prismaClient.skinHistory.create({
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
                    }
                });
            }
        }

        return {
            msg: "Success",
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});