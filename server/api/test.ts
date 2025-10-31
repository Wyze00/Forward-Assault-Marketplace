import { Nuxt } from '@prisma/client';
import { PrismaService } from '~~/server/util/prismaService';

export default defineEventHandler(async (event) => {

    const data: Nuxt[] = await PrismaService.getInstance().nuxt.findMany();

  return {
    message: 'Data fetched securely',
    data: data
  };
});