import { ItemType } from "~~/prisma/generated/client";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const page = Number(query.page || 0);
        const capture = query.capture === 'true' || query.capture === true;

        // Fetch dari marketplace API
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
                marketplaceResponse.items.map(async (item) => {
                    const camo = await prismaClient.camo.findFirst({
                        where: {
                            camoID: item.camoID,
                            itemType: item.itemType
                        }
                    });

                    if (!camo) {
                        console.log(`Camo ID ${item.camoID} dengan itemType ${item.itemType} belum terdaftar di database`);
                        return null;
                    }

                    const skin = await prismaClient.skin.findFirst({
                        where: {
                            camoUuid: camo.uuid,
                            weaponType: item.weaponType
                        },
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

                    if (!skin) {
                        console.log(`Skin untuk camoID ${item.camoID} dan weaponType ${item.weaponType} tidak ditemukan`);
                        return null;
                    }

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

                if (!camo) {
                    console.log(`[Capture] Camo ID ${item.camoID} belum terdaftar`);
                    continue;
                }

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

                if (!skin) {
                    console.log(`[Capture] Skin tidak ditemukan`);
                    continue;
                }

                // Fetch new offers
                const queryParams = `itemType=${item.itemType}&weaponType=${item.weaponType}&camoID=${item.camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
                const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

                if (!offersResponse.offers || offersResponse.offers.length === 0) continue;

                const newOffers = offersResponse.offers.slice(0, 10);
                const previousHistory = skin.skinHistories[0] || null;
                const prevEntries = previousHistory ? previousHistory.skinHistoryEntries : [];

                // Buat SkinHistory baru beserta entries
                const newHistory = await prismaClient.skinHistory.create({
                    data: {
                        skinUuid: skin.uuid,
                        skinHistoryEntries: {
                            create: newOffers.map(offer => ({
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

                // Bandingkan & simpan perubahan ke SkinOfferChange
                const prevMap = new Map(prevEntries.map(e => [e.offerID, e]));

                for (const newEntry of newHistory.skinHistoryEntries) {
                    const matchedPrev = prevMap.get(newEntry.offerID);

                    if (!matchedPrev) {
                        // Tawaran baru ditambahkan
                        await prismaClient.skinOfferChange.create({
                            data: {
                                skinHistoryEntryUuid: newEntry.uuid,
                                type: "add",
                                seen: false
                            }
                        });
                    } else if (matchedPrev.price !== newEntry.price || matchedPrev.condition !== newEntry.condition) {
                        // Perubahan harga atau kondisi
                        await prismaClient.skinOfferChange.create({
                            data: {
                                skinHistoryEntryUuid: newEntry.uuid,
                                type: "change",
                                seen: false
                            }
                        });
                    }
                }

                // Cek offer yang hilang (removed) dari capture sebelumnya
                const newOfferIDs = new Set(newOffers.map(o => o.offerID));
                for (const prevEntry of prevEntries) {
                    if (!newOfferIDs.has(String(prevEntry.offerID))) {
                        await prismaClient.skinOfferChange.create({
                            data: {
                                skinHistoryEntryUuid: prevEntry.uuid,
                                type: "remove",
                                seen: false
                            }
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
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});