import { GetSkinInfoResponse } from "~~/server/types";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event): Promise<GetSkinInfoResponse | undefined> => {
    try {
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
                        },
                        skinIdealPrice: true,
                    }
                }
            }
        });

        const result = favorites.map(({ skin }) => {
            const history = skin.skinHistories[0];
            const lowestPriceEntry = history?.skinHistoryEntries[0];
            const itemType = skin.camo.itemType;

            return {
                id: skin.uuid,
                itemType,
                camoName: skin.camo.camoName,
                weaponName: skin.weapon?.weaponName || '',
                name: itemType === 'glove' || itemType === 'character'
                    ? skin.camo.camoName
                    : `${skin.weapon?.weaponName || ''} - ${skin.camo.camoName}`,
                lastCaptureDate: history ? history.createdAt : '-',
                lowestPrice: lowestPriceEntry ? lowestPriceEntry.price : 0,
                isFavorite: true,
                idealPrice: skin.skinIdealPrice?.idealPrice,
                shopPrice: skin.skinIdealPrice?.shopPrice,
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
