import { GetSkinIdealPriceResponse } from "~~/server/types/api/skin";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

/**
 * Body skinUuid & skinIdealPrice
 * Upsert create / update harga
 * Return SkinIdealPrice
 */

export default defineEventHandler(async (event): Promise<GetSkinIdealPriceResponse | undefined> => {
    try {
        const body: {skinUuid: string, idealPrice: number | null, shopPrice: number | null} = await readBody(event);

        if (!body.skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }
        
        const idealPrice = await prismaClient.skinIdealPrice.upsert({
            update: {
                idealPrice: body.idealPrice,
                shopPrice: body.shopPrice
            },
            where: { skinUuid: body.skinUuid },
            create: {
                skinUuid: body.skinUuid,
                idealPrice: body.idealPrice,
                shopPrice: body.shopPrice
            }
        });

        return {
            msg: "Success",
            data: idealPrice
        };

    } catch (e: unknown) {
        logger.error(`POST /api/skin/price : ${e}`);
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
