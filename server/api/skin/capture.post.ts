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

        // Ambil response penawaran dari API marketplace
        const queryParams = `itemType=${itemType}&weaponType=${weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
        const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

        const fullApiOffersMap = new Map(offersResponse.offers.map(o => [`${o.skinID}_${o.sellerID}`, o]));

        // 2. Simpan 10 teratas ke history database
        const offersToSave = offersResponse.offers.slice(0, 10);

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
            include: { skinHistoryEntries: true }
        });

        // Ambil 10 data dari history lama dan baru untuk dikomparasi
        const prevEntriesTop10 = prevEntries.slice(0, 10);
        const newEntriesTop10 = newHistory.skinHistoryEntries.slice(0, 10);

        const prevMap = new Map(prevEntriesTop10.map(e => [`${e.skinID}_${e.sellerID}`, e]));
        const newMap = new Map(newEntriesTop10.map(e => [`${e.skinID}_${e.sellerID}`, e]));

        // 3. Cek penambahan (add) dan perubahan harga (change) pada 10 data teratas
        for (const newEntry of newEntriesTop10) {
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

        // 4. Cek item yang hilang (remove) dengan VALIDASI EKSTRA
        for (const prevEntry of prevEntriesTop10) {
            const key = `${prevEntry.skinID}_${prevEntry.sellerID}`;
            
            // Jika item tidak ditemukan di 10 data terbaru...
            if (!newMap.has(key)) {
                // ...cek apakah item tersebut ADA di daftar API yang utuh
                if (fullApiOffersMap.has(key)) {
                    // Jika ADA, berarti item hanya tergeser ke bawah (misal urutan ke-11).
                    // JANGAN catat sebagai "remove" dan lewati saja.
                    continue; 
                }

                // Jika TIDAK ADA di full API, barulah item tersebut benar-benar terjual/ditarik penjual.
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