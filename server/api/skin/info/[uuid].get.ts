import { GetOneSkinInfoResponse } from "~~/server/types/api/skin";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

/**
 * Request skinUuid
 * Return skins information
 */

export default defineEventHandler(async (event): Promise<GetOneSkinInfoResponse | undefined> => {
    try {
        const uuid = event.context.params?.uuid as string;

        if (!uuid) {
            throw new Error('Harap isi uuid');
        }

        const skin = await prismaClient.skin.findUnique({
            where: {
                uuid: uuid
            },
            include: {
                camo: true,
                weapon: true,
                favoriteSkin: true,
                skinHistories: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                    include: {
                        skinHistoryEntries: {
                            orderBy: {
                                price: 'asc',
                            },
                            take: 1,
                        }
                    }
                },
            }
        });

        if (!skin) {
            throw new Error('Skin tidak ditemukan');
        }

        const history = skin.skinHistories[0];
        const lowestPriceEntry = history?.skinHistoryEntries[0];
        const itemType = skin.camo.itemType;

        const result = {
            id: skin.uuid,
            itemType: itemType,
            camoName: skin.camo.camoName,
            weaponName: skin.weapon?.weaponName || '',
            name: itemType === 'glove' || itemType === 'character' ? skin.camo.camoName : `${skin.weapon?.weaponName || ''} - ${skin.camo.camoName}`,
            lastCaptureDate: history ? history.createdAt : '-',
            lowestPrice: lowestPriceEntry ? lowestPriceEntry.price : 0,
            isFavorite: !!skin.favoriteSkin,
        }

        return {
            msg: "Success",
            data: result,
        };

    } catch (e: unknown) {
        logger.error(`GET /api/skin/info/[uuid] : ${e}`);
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});
