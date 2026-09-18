import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        /**
         * Validation
         */
        const body: { itemType: ItemType, weaponType: number } = await readBody(event);

        if (!body || !body.itemType || (!body.weaponType && body.weaponType !== 0)) {
            throw new Error('Harap isi itemType');
        }

        /**
         * Get All Camo from API
         */
        let weaponType = body.weaponType || 0;
        let extraQuery = '';

        if (body.itemType === 'weapon') {

            const weapon = await prismaClient.weapon.findUnique({
                where: {
                    weaponType: weaponType,
                }
            })

            if (!weapon) {
                throw new Error('Weapon Type Tidak Ada');
            }

            extraQuery = `&weaponType=${weapon.weaponType}`;
        } else if (body.itemType === 'glove' || body.itemType === 'character') {
            weaponType = 0;
        } else {
            throw new Error('Item Type Tidak Valid');
        }

        const camoIDs: number[] = []
        let page = 0;
        
        while (true) {
            const response = await fetchUtil<GetUniqueItemsResponse>('marketplaceV3_get_unique_items.php', `page=${page}&itemPerPage=20&sortBy=price_asc&itemType=${body.itemType}${extraQuery}`);
            
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
                itemType: body.itemType as ItemType
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
                console.log(`Unknown ${body.itemType} CamoID : ${id}`);
                return false;
            }
        })
        
        /**
         * Treat all camo
         */
        for (const camoID of cleanedCamoIDs) {
            const camo = dbCamoMap.get(camoID)!;

            const skin = await prismaClient.skin.upsert({
                where: {
                    camoUuid_weaponType: {
                        camoUuid: camo.uuid,
                        weaponType
                    }
                },
                update: {},
                create: {
                    camoUuid: camo.uuid,
                    weaponType
                },
                include: {
                    skinHistories: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        include: {
                            skinHistoryEntries: true,
                        },
                        take: 1,
                    }
                }
            });

            const lastHistory = skin.skinHistories[0];
            const lastHistoryEntries = lastHistory ? lastHistory.skinHistoryEntries : [];
            const lastHistoryEntriesMap = new Map(lastHistoryEntries.map(e => [`${e.skinID}_${e.sellerID}`, e]));

            const queryParams = `itemType=${body.itemType}&weaponType=${skin.weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
            const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

            if (!offersResponse.offers || offersResponse.offers.length === 0) continue;

            const currentHistoryEntriesMap = new Map(offersResponse.offers.map(o => [`${o.skinID}_${o.sellerID}`, o]));

            const currentHistory = await prismaClient.skinHistory.create({
                data: {
                    skinUuid: skin.uuid,
                    skinHistoryEntries: {
                        create: offersResponse.offers.map(offer => ({
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
                include: { skinHistoryEntries: true }
            });

            /**
             * Cek untuk mengetahui skin Add / Change
             */

            // Dapetin Top 10 data saat ini
            const currentHistoryEntriesTop10 = currentHistory.skinHistoryEntries.slice(0, 10);
            const currentHistoryEntriesTop10Map = new Map(currentHistoryEntriesTop10.map(e => [`${e.skinID}_${e.sellerID}`, e]));

            for (const currentEntry of currentHistoryEntriesTop10) {
                const key = `${currentEntry.skinID}_${currentEntry.sellerID}`;
                
                // Bandingkan dengan entry sebelumnya
                const matchedPrev = lastHistoryEntriesMap.get(key);

                if (!matchedPrev) {
                    // Jika belum ada maka skin tersebut baru ditmbahkan
                    await prismaClient.skinOfferChange.create({
                        data: { skinHistoryEntryUuid: currentEntry.uuid, type: "add", seen: false }
                    });
                    
                } else if (matchedPrev.price !== currentEntry.price) {
                    // Kalo harga berubah
                    await prismaClient.skinOfferChange.create({
                        data: { skinHistoryEntryUuid: currentEntry.uuid, type: "change", seen: false }
                    });
                }
            }

            /**
             * Cek untuk skin remove
             */

            // Dapetin data last top 10
            const lastHistoryEntriesTop10Map = lastHistoryEntries.slice(0, 10);

            for (const lastEntry of lastHistoryEntriesTop10Map) {
                const key = `${lastEntry.skinID}_${lastEntry.sellerID}`;
                
                // Jika entry yang sebelumnya ada di top 10 tapi sudah tidak ada lagi sekarang
                if (!currentHistoryEntriesTop10Map.has(key)) {

                    // Pastikan kalau top 10 benar-benar hilang jadi tidak ke top 11
                    if (currentHistoryEntriesMap.has(key)) {
                        continue; 
                    }

                    await prismaClient.skinOfferChange.create({
                        data: { skinHistoryEntryUuid: lastEntry.uuid, type: "remove", seen: false }
                    });
                }
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
