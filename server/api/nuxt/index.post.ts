import { Nuxt } from "~~/prisma/generated/client";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {

    const body = await readBody(event);
    const newNuxt: Nuxt = await prismaClient.nuxt.create({
        data: body
    });

    return {
        message: 'Data created successfully',
        data: newNuxt
    };
});