import { Nuxt } from "~~/prisma/generated/client";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {

  const data: Nuxt[] = await prismaClient.nuxt.findMany();

  return {
    message: 'Data fetched securely',
    data: data
  };
});