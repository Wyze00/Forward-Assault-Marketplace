import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;

        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const favorite = await prismaClient.favoriteSkin.findUnique({
            where: { skinUuid }
        });

        return {
            msg: "Success",
            isFavorite: !!favorite
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
