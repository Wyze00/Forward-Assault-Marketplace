import { logger } from "nuxt/kit";
import { PostCamoRequest } from "~~/server/types/api/camo";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<PostCamoRequest>(event);
    
        if (!body || !body.camoID || !body.camoName || !body.itemType) {
            throw new Error("Missing Parameter");
        }

        await prismaClient.camo.create({
            data: {
                camoID: body.camoID,
                camoName: body.camoName,
                itemType: body.itemType
            }
        })

        return {
            msg: "Success"
        }
        
    } catch (e: unknown) {
        logger.error(`POST /api/camo : ${e}`);
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});