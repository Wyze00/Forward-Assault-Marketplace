import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        /**
         * Validation
         */
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;
        
        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        /**
         * Logic
         */
        const histories = await prismaClient.skinHistory.findMany({
            where: {
                skinUuid: skinUuid
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                skinHistoryEntries: true,
                skin: {
                    include: {
                        camo: true,
                        weapon: true,
                        favoriteSkin: true,
                        skinIdealPrice: true,
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
            itemType: histories[0].skin.camo.itemType,
            isFavorite: !!histories[0].skin.favoriteSkin,
            idealPrice: histories[0].skin.skinIdealPrice?.idealPrice,
            shopPrice: histories[0].skin.skinIdealPrice?.shopPrice,
        };

        histories.reverse();

        const resultCaptures = [];

        for (let i = 0; i < histories.length; i++) {
            let entryChanges = 0;

            const currentHistory = histories[i];
            
            const currentEntriesAll = [...currentHistory.skinHistoryEntries].sort((a, b) => a.price - b.price);
            
            const prevHistory = i > 0 ? histories[i - 1] : null;
            const prevEntriesAll = prevHistory 
                ? [...prevHistory.skinHistoryEntries].sort((a, b) => a.price - b.price) 
                : [];

            const prevMapAll = new Map(prevEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));
            const currMapAll = new Map(currentEntriesAll.map(e => [`${e.skinID}_${e.sellerID}`, e]));

            const currentTop10 = currentEntriesAll.slice(0, 10);
            const prevTop10 = prevEntriesAll.slice(0, 10);

            const processedEntries = [];

            if (prevHistory) {
                for (const curr of currentTop10) {
                    const key = `${curr.skinID}_${curr.sellerID}`;
                    const prev = prevMapAll.get(key); 
                    
                    let status = 'unchanged';
                    if (!prev) {
                        status = 'new';
                        entryChanges++;
                    } else if (prev.price !== curr.price || prev.condition !== curr.condition) {
                        status = 'changed';
                        entryChanges++;
                    }
                    
                    processedEntries.push({
                        ...curr,
                        status,
                        prevPrice: prev ? prev.price : null
                    });
                }

                for (const prev of prevTop10) {
                    const key = `${prev.skinID}_${prev.sellerID}`;
                    
                    if (!currMapAll.has(key)) {
                        processedEntries.push({
                            ...prev,
                            status: 'removed',
                            prevPrice: null
                        });
                        entryChanges++;
                    }
                }
            } else {
                currentTop10.forEach(e => {
                    processedEntries.push({
                        ...e,
                        status: 'unchanged',
                        prevPrice: null
                    });
                });
                entryChanges;
            }

            if (entryChanges === 0 && i != histories.length-1){
                continue;
            }

            processedEntries.sort((a, b) => a.price - b.price);

            resultCaptures.push({
                uuid: currentHistory.uuid,
                createdAt: currentHistory.createdAt,
                entries: processedEntries
            });
        }

        return {
            msg: "Success",
            data: resultCaptures.reverse(),
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