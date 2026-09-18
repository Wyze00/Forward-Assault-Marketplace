import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";

// Path menuju file JSON untuk menyimpan hasil fetch terakhir
const DATA_FILE = path.resolve(process.cwd(), 'lastCapturedData.json');

export default defineNitroPlugin((nitroApp) => {
    // Interval di-set setiap 3 menit (3 * 60 * 1000 ms)
    setInterval(async () => {
        try {
            // Selalu fetch page 0[cite: 1]
            const marketplaceResponse = await fetchUtil<GetUniqueItemsResponse>(
                'marketplaceV3_get_unique_items.php', 
                `page=0&itemPerPage=20&sortBy=newest`
            ); //[cite: 1]

            if (!marketplaceResponse.items || marketplaceResponse.items.length === 0) return; //[cite: 1]

            // Baca data dari fetch sebelumnya
            let lastData = [];
            try {
                const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
                lastData = JSON.parse(fileContent);
            } catch (e) {
                // Jika file belum ada, gunakan array kosong
            }

            // Buat map dari data lama untuk mendeteksi perubahan lowestPrice secara efisien
            const lastDataMap = new Map(lastData.map((item: any) => 
                [`${item.itemType}_${item.weaponType}_${item.camoID}`, item.lowestPrice]
            ));

            let hasChanges = false;

            // Evaluasi setiap item dari fetch terbaru
            for (const item of marketplaceResponse.items) {

                if (item.itemType as string === 'sticker') {
                    continue;
                }

                const key = `${item.itemType}_${item.weaponType}_${item.camoID}`;
                const previousPrice = lastDataMap.get(key);

                // Cek jika item tersebut baru (tidak ada di JSON) atau ada perubahan harga terendah
                if (previousPrice === undefined || previousPrice !== item.lowestPrice) {
                    hasChanges = true;

                    // Ambil referensi camo dari database[cite: 1]
                    const camo = await prismaClient.camo.findFirst({
                        where: { camoID: item.camoID, itemType: item.itemType }
                    }); //[cite: 1]

                    if (!camo) {
                        console.log(`Unknown camo ${item.camoID}`);
                        continue;

                    }

                    // Ambil referensi skin dan history sebelumnya[cite: 1]
                    const skin = await prismaClient.skin.upsert({
                where: {
                    camoUuid_weaponType: {
                        camoUuid: camo.uuid,
                        weaponType: item.weaponType
                    }
                },
                update: {},
                create: {
                    camoUuid: camo.uuid,
                    weaponType: item.weaponType
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

                    if (!skin) continue; //[cite: 1]

                    // Ambil response penawaran dari API marketplace
                    const queryParams = `itemType=${item.itemType}&weaponType=${item.weaponType}&camoID=${item.camoID}&minCondition=0&maxCondition=1&page=0&limit=20`;
                    const offersResponse = await fetchUtil<GetSellOffersResponse>("marketplaceV3_get_sell_offers.php", queryParams);

                    if (!offersResponse.offers || offersResponse.offers.length === 0) continue;

                    const fullApiOffersMap = new Map(offersResponse.offers.map(o => [`${o.skinID}_${o.sellerID}`, o]));

                    const previousHistory = skin.skinHistories[0] || null;
                    const prevEntriesAll = previousHistory ? previousHistory.skinHistoryEntries : [];
                    const prevMapAll = new Map(prevEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));

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
            }

            // Update file JSON selalu jika ada data baru, atau jika baru pertama kali dibuat
            if (hasChanges || lastData.length === 0) {
                await fs.writeFile(DATA_FILE, JSON.stringify(marketplaceResponse.items, null, 2));
            }

            console.log('Capture Done');
        } catch (error) {
            console.error("Gagal melakukan auto-capture:", error);
        }
    }, 1 * 60 * 1000); 
});
