import { GetSkinIdealPriceResponse } from "~~/server/types/api/skin";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

/**
 * Data query param skinUuid
 * Upsert skinUuid
 * Return skinIdealPrice
 */

export default defineEventHandler(async (event): Promise<GetSkinIdealPriceResponse | undefined> => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;

        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const idealPrice = await prismaClient.skinIdealPrice.upsert({
            update: {},
            where: { skinUuid },
            create: {
                skinUuid,
            }
        });

        return {
            msg: "Success",
            data: idealPrice
        };

    } catch (e: unknown) {
        logger.error(`GET /api/skin/price : ${e}`);
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
