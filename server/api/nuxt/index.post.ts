
import { Nuxt } from '@prisma/client';
import { PrismaService } from '~~/server/util/prismaService';

export default defineEventHandler(async (event) => {

    const body = await readBody(event);
    const newNuxt: Nuxt = await PrismaService.getInstance().nuxt.create({
        data: body
    });

    return {
        message: 'Data created successfully',
        data: newNuxt
    };
});