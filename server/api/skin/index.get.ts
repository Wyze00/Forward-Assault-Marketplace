import { ItemType } from "~~/prisma/generated/enums";
import { GetSkinResponse } from "~~/server/types";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event): Promise<GetSkinResponse | undefined> => {
    try {
        const query = getQuery(event);
        const itemType = query.itemType as ItemType;
        let weaponType = Number(query.weaponType);

        if (!itemType) {
            throw new Error("Missing itemType parameter");
        }

        if (itemType === ItemType.glove || itemType === ItemType.character) {
            weaponType = 0;
        } else if (itemType === ItemType.weapon && isNaN(weaponType)) {
            throw new Error("Missing weaponType parameter for weapon itemType");
        }

        const data = await prismaClient.skin.findMany({
            where: {
                weaponType: weaponType,
                camo: {
                    itemType: itemType
                }
            },
            include: {
                camo: true,
                weapon: true
            }
        });

        return {
            msg: "Success",
            data,
        }
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message }
        }
    }
});
