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

                    if (!camo) continue; //[cite: 1]

                    // Ambil referensi skin dan history sebelumnya[cite: 1]
                    const skin = await prismaClient.skin.findFirst({
                        where: { camoUuid: camo.uuid, weaponType: item.weaponType },
                        include: {
                            skinHistories: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                include: { skinHistoryEntries: true }
                            }
                        }
                    }); //[cite: 1]

                    if (!skin) continue; //[cite: 1]

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
            }

            // Update file JSON selalu jika ada data baru, atau jika baru pertama kali dibuat
            if (hasChanges || lastData.length === 0) {
                await fs.writeFile(DATA_FILE, JSON.stringify(marketplaceResponse.items, null, 2));
            }

            console.log('Capture Done');
        } catch (error) {
            console.error("Gagal melakukan auto-capture:", error);
        }
    }, 3 * 60 * 1000); 
});