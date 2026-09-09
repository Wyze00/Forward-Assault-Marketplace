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
        const weaponType = skin.weaponType;
        const camoID = skin.camo.camoID;

        // Ambil histori capture sebelumnya
        const previousHistory = await prismaClient.skinHistory.findFirst({
            where: { skinUuid: skin.uuid },
            orderBy: { createdAt: 'desc' },
            include: { skinHistoryEntries: true }
        });
        const prevEntries = previousHistory ? previousHistory.skinHistoryEntries : [];

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

        // Ambil maksimal 5 data teratas untuk komparasi
        const prevEntriesTop5 = prevEntries.slice(0, 5);
        const newEntriesTop5 = newHistory.skinHistoryEntries.slice(0, 5);

        const prevMap = new Map(prevEntriesTop5.map(e => [`${e.skinID}_${e.sellerID}`, e]));
        const newMap = new Map(newEntriesTop5.map(e => [`${e.skinID}_${e.sellerID}`, e]));

        // Cek penambahan (add) dan perubahan (change)
        for (const newEntry of newEntriesTop5) {
            const key = `${newEntry.skinID}_${newEntry.sellerID}`;
            const matchedPrev = prevMap.get(key);

            if (!matchedPrev) {
                await prismaClient.skinOfferChange.create({
                    data: { skinHistoryEntryUuid: newEntry.uuid, type: "add", seen: false }
                });
            } else if (matchedPrev.price !== newEntry.price || matchedPrev.condition !== newEntry.condition) {
                await prismaClient.skinOfferChange.create({
                    data: { skinHistoryEntryUuid: newEntry.uuid, type: "change", seen: false }
                });
            }
        }

        // Cek item yang hilang (remove) dari top 5
        for (const prevEntry of prevEntriesTop5) {
            const key = `${prevEntry.skinID}_${prevEntry.sellerID}`;
            if (!newMap.has(key)) {
                await prismaClient.skinOfferChange.create({
                    data: { skinHistoryEntryUuid: prevEntry.uuid, type: "remove", seen: false }
                });
            }
        }

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