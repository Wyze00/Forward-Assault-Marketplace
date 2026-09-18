import { prismaClient } from "~~/server/util/prismaService";

// Toggle favorite: if already favorited, remove it. If not, add it.
export default defineEventHandler(async (event) => {
    try {
        const body: { skinUuid: string } = await readBody(event);

        if (!body.skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const existing = await prismaClient.favoriteSkin.findUnique({
            where: { skinUuid: body.skinUuid }
        });

        if (existing) {
            await prismaClient.favoriteSkin.delete({
                where: { skinUuid: body.skinUuid }
            });
            return { msg: "Success", isFavorite: false };
        } else {
            await prismaClient.favoriteSkin.create({
                data: { skinUuid: body.skinUuid }
            });
            return { msg: "Success", isFavorite: true };
        }

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
