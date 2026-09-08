import { ItemType } from "~~/prisma/generated/enums";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const itemType = query.itemType as string;
        const weaponType = query.weaponType ? Number(query.weaponType) : undefined;

        if (!itemType) {
            throw new Error("Harap sertakan itemType");
        }

        const validItemTypes = ['weapon', 'glove', 'character'];
        if (!validItemTypes.includes(itemType)) {
            throw new Error("Invalid itemType");
        }

        const favorites = await prismaClient.favoriteSkin.findMany({
            include: {
                skin: {
                    include: {
                        camo: true,
                        weapon: true,
                        skinHistories: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: {
                                skinHistoryEntries: {
                                    orderBy: { price: 'asc' },
                                    take: 1,
                                }
                            }
                        }
                    }
                }
            },
            where: {
                skin: {
                    camo: { itemType: itemType as ItemType },
                    ...(weaponType !== undefined && { weaponType })
                }
            }
        });

        const result = favorites.map(({ skin }) => {
            const history = skin.skinHistories[0];
            const lowestPriceEntry = history?.skinHistoryEntries[0];

            return {
                id: skin.uuid,
                camoName: skin.camo.camoName,
                weaponName: skin.weapon?.weaponName || '',
                name: itemType === 'glove' || itemType === 'character'
                    ? skin.camo.camoName
                    : `${skin.weapon?.weaponName || ''} - ${skin.camo.camoName}`,
                lastCaptureDate: history ? history.createdAt : '-',
                lowestPrice: lowestPriceEntry ? lowestPriceEntry.price : 0,
                isFavorite: true,
            };
        });

        return {
            msg: "Success",
            data: result,
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
