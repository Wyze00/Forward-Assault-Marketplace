import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: { itemType: ItemType, weaponType: number } = await readBody(event);

        if (!body || !body.itemType || (!body.weaponType && body.weaponType !== 0)) {
            throw new Error('Harap isi itemType');
        }

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
                        }
                    }
                }
            });

            const queryParams = `itemType=${body.itemType}&weaponType=${skin.weaponType}&camoID=${camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
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
