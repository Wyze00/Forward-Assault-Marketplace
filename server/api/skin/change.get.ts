import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const changes = await prismaClient.skinOfferChange.findMany({
            include: {
                skinHistoryEntry: {
                    include: {
                        skinHistory: {
                            include: {
                                skin: {
                                    include: {
                                        camo: true,
                                        weapon: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 100, 
        });

        const data = changes.map((change) => {
            const entry = change.skinHistoryEntry;
            const history = entry.skinHistory;
            const skin = history.skin;
            const itemType = skin.camo.itemType;
            const camoName = skin.camo.camoName;
            const weaponName = skin.weapon?.weaponName || '';

            const name = (itemType === 'glove' || itemType === 'character')
                ? camoName
                : `${weaponName} - ${camoName}`;

            return {
                uuid: change.uuid,
                type: change.type,
                seen: change.seen,
                skinUuid: skin.uuid,
                itemType,
                weaponName,
                camoName,
                name,
                sellerName: entry.sellerName || String(entry.sellerID),
                price: entry.price,
                condition: entry.condition,
                createdAt: history.createdAt,
            };
        });

        return {
            msg: "Success",
            data
        };
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});