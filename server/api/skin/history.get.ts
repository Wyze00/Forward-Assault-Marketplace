import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;
        
        // Also support itemType and weaponType if provided, though skinUuid is mainly used
        const itemType = query.itemType as string;
        const weaponType = query.weaponType ? Number(query.weaponType) : undefined;

        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        // Fetch up to 6 captures to be able to compare the 5 latest properly
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
            }
        }

        const skinInfo = {
            name: histories[0].skin.camo.itemType === 'glove' || histories[0].skin.camo.itemType === 'character' 
                  ? histories[0].skin.camo.camoName 
                  : `${histories[0].skin.weapon?.weaponName || ''} - ${histories[0].skin.camo.camoName}`,
            camoName: histories[0].skin.camo.camoName,
            itemType: histories[0].skin.camo.itemType
        };

        // Reverse to chronological order (oldest first)
        histories.reverse();

        const resultCaptures = [];

        for (let i = 0; i < histories.length; i++) {
            const currentHistory = histories[i];
            const currentEntries = currentHistory.skinHistoryEntries;
            
            const prevHistory = i > 0 ? histories[i - 1] : null;
            const prevEntries = prevHistory ? prevHistory.skinHistoryEntries : [];
            
            const prevMap = new Map(prevEntries.map(e => [`${e.skinID}_${e.sellerID}`, e]));
            const currMap = new Map(currentEntries.map(e => [`${e.skinID}_${e.sellerID}`, e]));
            
            const processedEntries = [];

            // Find new, changed, unchanged
            for (const curr of currentEntries) {
                const key = `${curr.skinID}_${curr.sellerID}`;
                const prev = prevMap.get(key);
                
                let status = 'unchanged';
                if (!prev) {
                    status = 'new';
                } else if (prev.price !== curr.price) {
                    status = 'changed';
                }
                
                processedEntries.push({
                    ...curr,
                    status,
                    prevPrice: prev ? prev.price : null
                });
            }

            // Find removed
            if (prevHistory) {
                for (const prev of prevEntries) {
                    const key = `${prev.skinID}_${prev.sellerID}`;
                    if (!currMap.has(key)) {
                        processedEntries.push({
                            ...prev,
                            status: 'removed',
                            prevPrice: null
                        });
                    }
                }
            } else {
                 processedEntries.forEach(e => e.status = 'unchanged');
            }

            processedEntries.sort((a, b) => a.price - b.price);

            resultCaptures.push({
                uuid: currentHistory.uuid,
                createdAt: currentHistory.createdAt,
                entries: processedEntries
            });
        }

        // Return only the last 5 captures (the newest 5)
        const latest5 = resultCaptures.slice(-5);
        latest5.reverse(); // Display newest first

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
