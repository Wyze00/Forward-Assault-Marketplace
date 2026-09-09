import { ItemType } from "~~/prisma/generated/enums";
import { GetCamoResponse } from "~~/server/types";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event): Promise<GetCamoResponse | undefined> => {
    try {
        const data = await prismaClient.camo.findMany()
        
        return {
            msg: "Success",
            data,
        }
        
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});