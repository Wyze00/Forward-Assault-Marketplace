import { ItemType } from "~~/prisma/generated/client";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const page = Number(query.page || 0);
        const capture = query.capture === 'true' || query.capture === true;

        const marketplaceResponse = await fetchUtil<GetUniqueItemsResponse>(
            'marketplaceV3_get_unique_items.php', 
            `page=${page}&itemPerPage=20&sortBy=newest`
        );

        if (!marketplaceResponse.items || marketplaceResponse.items.length === 0) {
            return {
                msg: "Success",
                data: [],
                hasMore: marketplaceResponse.hasMore,
                currentPage: marketplaceResponse.currentPage
            };
        }

        if (!capture) {
            // Flow mode READ (capture=false)
            const resultData = await Promise.all(
                marketplaceResponse.items.filter((item) => item.itemType as string !== 'sticker').map(async (item) => {
                    const camo = await prismaClient.camo.findFirst({
                        where: { camoID: item.camoID, itemType: item.itemType }
                    });

                    if (!camo) return null;

                    const skin = await prismaClient.skin.findFirst({
                        where: { camoUuid: camo.uuid, weaponType: item.weaponType },
                        include: {
                            camo: true,
                            weapon: true,
                            favoriteSkin: true,
                            skinHistories: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                include: {
                                    skinHistoryEntries: {
                                        orderBy: { price: 'asc' },
                                        take: 1
                                    }
                                }
                            }
                        }
                    });

                    if (!skin) return null;

                    const lastHistory = skin.skinHistories[0] || null;
                    const lowestPriceEntry = lastHistory?.skinHistoryEntries[0] || null;

                    const itemName = (skin.camo.itemType === 'glove' || skin.camo.itemType === 'character')
                        ? skin.camo.camoName
                        : `${skin.weapon?.weaponName || ''} - ${skin.camo.camoName}`;

                    return {
                        id: skin.uuid,
                        camoName: skin.camo.camoName,
                        weaponName: skin.weapon?.weaponName || '',
                        name: itemName,
                        itemType: skin.camo.itemType,
                        lastCaptureDate: lastHistory ? lastHistory.createdAt : '-',
                        lowestPrice: lowestPriceEntry ? lowestPriceEntry.price : 0,
                        latestFetchLowestPrice: item.lowestPrice,
                        isFavorite: !!skin.favoriteSkin,
                    };
                })
            );

            return {
                msg: "Success",
                data: resultData.filter(item => item !== null),
                hasMore: marketplaceResponse.hasMore,
                currentPage: marketplaceResponse.currentPage
            };
        } else {
            // Flow mode CAPTURE (capture=true)
            for (const item of marketplaceResponse.items) {
                const camo = await prismaClient.camo.findFirst({
                    where: { camoID: item.camoID, itemType: item.itemType }
                });

                if (!camo) continue;

                const skin = await prismaClient.skin.findFirst({
                    where: { camoUuid: camo.uuid, weaponType: item.weaponType },
                    include: {
                        skinHistories: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: { skinHistoryEntries: true }
                        }
                    }
                });

                if (!skin) continue;

                // Ambil response penawaran dari API marketplace
                const queryParams = `itemType=${item.itemType}&weaponType=${item.weaponType}&camoID=${item.camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
                const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

                if (!offersResponse.offers || offersResponse.offers.length === 0) continue;

                // 1. BUAT MAP DARI SELURUH DATA API (Misal 20 data) SEBELUM DI-SLICE
                // Ini akan menjadi acuan kebenaran apakah item benar-benar terhapus
                const fullApiOffersMap = new Map(offersResponse.offers.map(o => [`${o.skinID}_${o.sellerID}`, o]));

                // 2. Simpan 10 teratas ke history database
                const offersToSave = offersResponse.offers.slice(0, 10);
                const previousHistory = skin.skinHistories[0] || null;
                const prevEntries = previousHistory ? previousHistory.skinHistoryEntries : [];

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
            }

            return {
                msg: "Capture completed successfully",
            };
        }

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        console.log(e);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});