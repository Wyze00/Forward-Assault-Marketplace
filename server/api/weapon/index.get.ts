import { GetWeaponResponse } from "~~/server/types/api/weapon";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event): Promise<GetWeaponResponse  | undefined> => {
    try {
        const data = await prismaClient.weapon.findMany();
        
        return {
            msg: "Success",
            data,
        }
        
    } catch (e: unknown) {
        logger.error(`GET /api/weapon : ${e}`);
        setResponseStatus(event, 400);

        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});