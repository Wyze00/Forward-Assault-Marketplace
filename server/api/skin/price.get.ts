import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;

        if (!skinUuid) {
            throw new Error("Harap sertakan skinUuid");
        }

        const idealPrice = await prismaClient.skinIdealPrice.upsert({
            update: {},
            where: { skinUuid },
            create: {
                skinUuid,
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
