import { ItemType } from "~~/prisma/generated/enums";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const itemType = body.itemType as ItemType;
        let weaponType = Number(body.weaponType);
        const camoID = Number(body.camoID);

        if (!itemType || isNaN(camoID)) {
            throw new Error("Missing itemType or camoID parameter");
        }

        if (itemType === ItemType.glove || itemType === ItemType.character) {
            weaponType = 0;
        } else if (itemType === ItemType.weapon && isNaN(weaponType)) {
            throw new Error("Missing weaponType parameter for weapon itemType");
        }

        const camo = await prismaClient.camo.findUnique({
            where: {
                itemType_camoID: {
                    itemType,
                    camoID
                }
            }
        });

        if (!camo) {
            throw new Error("Camo not found");
        }

        const data = await prismaClient.skin.create({
            data: {
                camoUuid: camo.uuid,
                weaponType: weaponType
            }
        });

        return {
            msg: "Success",
            data
        }
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message }
        }
    }
});
