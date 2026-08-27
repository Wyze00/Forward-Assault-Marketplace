import { Nuxt } from "~~/prisma/generated/client";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {

    const nuxtID = Number(getRouterParam(event, 'id'));
    const body = await readBody(event);

    const updatedNuxt: Nuxt = await prismaClient.nuxt.update({
        where: { 
            id: nuxtID
        },
        data: body
    });

    return {
        message: 'Data updated successfully',
        data: updatedNuxt
    };
});