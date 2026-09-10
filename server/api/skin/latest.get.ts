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

                // 1. BUAT MAP DARI SELURUH DATA API BARU (max 20)
                // Ini menjadi acuan kebenaran (Source of Truth) apakah item benar-benar terhapus
                const fullApiOffersMap = new Map(offersResponse.offers.map(o => [`${o.skinID}_${o.sellerID}`, o]));

                const previousHistory = skin.skinHistories[0] || null;
                // Ambil SELURUH entri sebelumnya (bisa sampai 20 data) untuk dijadikan buffer
                const prevEntriesAll = previousHistory ? previousHistory.skinHistoryEntries : [];
                const prevMapAll = new Map(prevEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));

                // 2. Simpan SEMUA data penawaran dari API ke history database (jangan di-slice 10 dulu)
                // Tujuannya agar kita punya riwayat posisi 11-20 untuk komparasi di masa depan
                const newHistory = await prismaClient.skinHistory.create({
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

                // 3. Batasi hanya 10 data teratas dari history BARU untuk evaluasi
                const newEntriesTop10 = newHistory.skinHistoryEntries.slice(0, 10);
                const newMapTop10 = new Map(newEntriesTop10.map(e => [`${e.skinID}_${e.sellerID}`, e]));

                // Cek penambahan (add) dan perubahan harga (change) HANYA pada 10 data teratas
                for (const newEntry of newEntriesTop10) {
                    const key = `${newEntry.skinID}_${newEntry.sellerID}`;
                    
                    // BANDINGKAN DENGAN prevMapAll (yang berisi 20 data lama)
                    const matchedPrev = prevMapAll.get(key);

                    if (!matchedPrev) {
                        // Jika item tidak ada di 20 data lama sama sekali, barulah ini penawaran valid yang BARU
                        await prismaClient.skinOfferChange.create({
                            data: { skinHistoryEntryUuid: newEntry.uuid, type: "add", seen: false }
                        });
                    } else if (matchedPrev.price !== newEntry.price || matchedPrev.condition !== newEntry.condition) {
                        await prismaClient.skinOfferChange.create({
                            data: { skinHistoryEntryUuid: newEntry.uuid, type: "change", seen: false }
                        });
                    }
                }

                // 4. Batasi hanya 10 data teratas dari history LAMA untuk evaluasi item hilang (remove)
                const prevEntriesTop10 = prevEntriesAll.slice(0, 10);

                for (const prevEntry of prevEntriesTop10) {
                    const key = `${prevEntry.skinID}_${prevEntry.sellerID}`;
                    
                    // Jika item (yang tadinya di top 10) tidak ditemukan lagi di top 10 terbaru...
                    if (!newMapTop10.has(key)) {
                        // ...pastikan item benar-benar hilang dari seluruh daftar 20 data API
                        if (fullApiOffersMap.has(key)) {
                            // Jika ADA di daftar utuh, berarti item cuma turun peringkat ke posisi 11+. Abaikan.
                            continue; 
                        }

                        // Jika TIDAK ADA di seluruh data API, barulah item dicatat terhapus (terjual/ditarik)
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