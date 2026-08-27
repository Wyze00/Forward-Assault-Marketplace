import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {

    const nuxtID = Number(getRouterParam(event, 'id'));

     await prismaClient.nuxt.delete({
        where: { id: nuxtID },
    });

    return {
        message: 'Data deleted successfully',
        data: true,
    };
});