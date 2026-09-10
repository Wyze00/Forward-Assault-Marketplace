import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;
        
        const itemType = query.itemType as string;
        const weaponType = query.weaponType ? Number(query.weaponType) : undefined;

        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const histories = await prismaClient.skinHistory.findMany({
            where: {
                skinUuid: skinUuid
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 6,
            include: {
                skinHistoryEntries: true,
                skin: {
                    include: {
                        camo: true,
                        weapon: true
                    }
                }
            }
        });

        if (histories.length === 0) {
            return {
                msg: "Success",
                data: [],
                skinInfo: null
            };
        }

        const skinInfo = {
            name: histories[0].skin.camo.itemType === 'glove' || histories[0].skin.camo.itemType === 'character' 
                  ? histories[0].skin.camo.camoName 
                  : `${histories[0].skin.weapon?.weaponName || ''} - ${histories[0].skin.camo.camoName}`,
            camoName: histories[0].skin.camo.camoName,
            itemType: histories[0].skin.camo.itemType
        };

        histories.reverse();

        const resultCaptures = [];

        for (let i = 0; i < histories.length; i++) {
            const currentHistory = histories[i];
            
            // 1. Urutkan seluruh entri berdasarkan harga terendah
            const currentEntriesAll = [...currentHistory.skinHistoryEntries].sort((a, b) => a.price - b.price);
            
            const prevHistory = i > 0 ? histories[i - 1] : null;
            const prevEntriesAll = prevHistory 
                ? [...prevHistory.skinHistoryEntries].sort((a, b) => a.price - b.price) 
                : [];

            // 2. Map seluruh data (s/d 20 item) sebagai buffer pembanding
            const prevMapAll = new Map(prevEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));
            const currMapAll = new Map(currentEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));

            // 3. Ambil 10 data teratas untuk dievaluasi
            const currentTop10 = currentEntriesAll.slice(0, 10);
            const prevTop10 = prevEntriesAll.slice(0, 10);

            const processedEntries = [];

            if (prevHistory) {
                // Cek item baru / berubah harga pada 10 data teratas baru
                for (const curr of currentTop10) {
                    const key = `${curr.skinID}_${curr.sellerID}`;
                    const prev = prevMapAll.get(key); // Cek ke seluruh 20 data lama
                    
                    let status = 'unchanged';
                    if (!prev) {
                        // Jika tidak ada di seluruh 20 data lama, berarti item baru
                        status = 'new';
                    } else if (prev.price !== curr.price || prev.condition !== curr.condition) {
                        status = 'changed';
                    }
                    
                    processedEntries.push({
                        ...curr,
                        status,
                        prevPrice: prev ? prev.price : null
                    });
                }

                // Cek item hilang (removed) dari 10 data teratas lama
                for (const prev of prevTop10) {
                    const key = `${prev.skinID}_${prev.sellerID}`;
                    
                    // Cek apakah item dari top 10 lama ada di SELURUH 20 data baru
                    if (!currMapAll.has(key)) {
                        // Jika tidak ada di seluruh data baru, berarti benar-benar hilang/terjual
                        processedEntries.push({
                            ...prev,
                            status: 'removed',
                            prevPrice: null
                        });
                    }
                }
            } else {
                // Untuk capture terawal, jadikan top 10 sebagai 'unchanged'
                currentTop10.forEach(e => {
                    processedEntries.push({
                        ...e,
                        status: 'unchanged',
                        prevPrice: null
                    });
                });
            }

            processedEntries.sort((a, b) => a.price - b.price);

            resultCaptures.push({
                uuid: currentHistory.uuid,
                createdAt: currentHistory.createdAt,
                entries: processedEntries
            });
        }

        const latest5 = resultCaptures.slice(-5);
        latest5.reverse();

        return {
            msg: "Success",
            data: latest5,
            skinInfo
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