import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: { uuid: string; seen?: boolean } = await readBody(event);

        if (!body.uuid) {
            throw new Error("UUID wajib disertakan");
        }

        const updated = await prismaClient.skinOfferChange.update({
            where: { uuid: body.uuid },
            data: {
                seen: typeof body.seen === 'boolean' ? body.seen : true
            }
        });

        return {
            msg: "Success",
            data: updated
        };
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
