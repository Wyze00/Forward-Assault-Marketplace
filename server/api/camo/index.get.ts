import { GetCamoResponse } from "~~/server/types/api/camo";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event): Promise<GetCamoResponse | undefined> => {
    try {
        const data = await prismaClient.camo.findMany()
        
        return {
            msg: "Success",
            data,
        }
        
    } catch (e: unknown) {
        logger.error(`GET /api/camo : ${e}`);
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});