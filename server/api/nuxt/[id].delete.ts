
import { Nuxt } from '@prisma/client';
import { PrismaService } from '~~/server/util/prismaService';

export default defineEventHandler(async (event) => {

    const nuxtID = Number(getRouterParam(event, 'id'));

     await PrismaService.getInstance().nuxt.delete({
        where: { id: nuxtID },
    });

    return {
        message: 'Data deleted successfully',
        data: true,
    };
});