import { GetSellOffersResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        /**
         * Validation
         */
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

        /**
         * Logic
         */
        const itemType = skin.camo.itemType;
        const weaponType = skin.weaponType;
        const camoID = skin.camo.camoID;

        // Ambil histori capture sebelumnya dan masukan ke dalam map
        const lastHistory = await prismaClient.skinHistory.findFirst({
            where: { skinUuid: skin.uuid },
            orderBy: { createdAt: 'desc' },
            include: { skinHistoryEntries: true }
        });

        const lastHistoryEntries = lastHistory ? lastHistory.skinHistoryEntries : [];
        const lastHistoryEntriesMap = new Map(lastHistoryEntries.map(e => [`${e.skinID}_${e.sellerID}`, e]));

        // Fetch offer terbaru dari API dan buat history baru
        const queryParams = `itemType=${itemType}&weaponType=${weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
        const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);
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

        return {
            msg: "Success",
            data: currentHistory
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
