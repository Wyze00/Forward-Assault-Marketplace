import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: {skinUuid: string, idealPrice: number | null, shopPrice: number | null} = await readBody(event);

        if (!body.skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }
        
        const idealPrice = await prismaClient.skinIdealPrice.update({
            where: { 
                skinUuid: body.skinUuid,
             },
             data: {
                idealPrice: body.idealPrice,
                shopPrice: body.shopPrice,
             }
        });

        return {
            msg: "Success",
            data: idealPrice
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
