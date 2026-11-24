import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { fetchPostSkinCapture } from "~~/server/util/fetchApi";
import { fetchGameAPIGetUniqueItems, fetchUtil } from "~~/server/util/fetchGameApi";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

/**
 * Body ada itemType dan weaponType
 * Fetch game API uniqueItem bedasarkan itemType dan weaponType buat dapaetin camoId
 * Filter camoId dari response gameAPI sama camoId yang ada di database
 * Upsert skin buat dapetin uuid nya
 * Panggil fetchPostSkinCapture
 */

/**
 * @throws Error
 */
async function getCamoIDsFromGameAPI(itemType: ItemType, weaponType: number): Promise<number[]> {
    let extraQuery = {};

    if (itemType === 'weapon') {

        const weapon = await prismaClient.weapon.findUnique({
            where: {
                weaponType: weaponType,
            }
        })

        if (!weapon) {
            throw new Error('Weapon Type Tidak Ada');
        }

        extraQuery = {
            weaponType,
        };
    } else if (itemType === 'glove' || itemType === 'character') {
        weaponType = 0;
    } else {
        throw new Error('Item Type Tidak Valid');
    }

    const camoIDs: number[] = []
    let page = 0;
    
    while (true) {
        const response = await fetchGameAPIGetUniqueItems({
            page,
            itemPerPage: 20,
            sortBy: "price_asc",
            itemType,
            ...extraQuery
        });
        
        response.items.forEach((skin) => {
            camoIDs.push(skin.camoID);
        })

        if (!response.hasMore) {
            break;
        }

        page++;
    }

    return camoIDs;
}

/**
 * @throws Error
 */
async function getCamosFromDB(itemType: ItemType): Promise<Camo[]> {
    const response = await prismaClient.camo.findMany({
        where: {
            itemType
        },
    })

    return response;
}

function cleanCamos(gameCamoIDs: number[], dbCamos: Camo[]): Camo[] {
    const dbCamoMap = new Map(dbCamos.map((camo) => [camo.camoID, camo]));
    const cleanedCamos: Camo[] = [];

    for (const camoID of gameCamoIDs) {
        const dbCamo = dbCamoMap.get(camoID);

        if (dbCamo) {
            cleanedCamos.push(dbCamo);
        } else {
            logger.warn(`Unknown camoID : ${camoID}`);
        }
    }

    return cleanedCamos;
}

async function upsertSkins(weaponType: number, cleanedCamos: Camo[]): Promise<string[]> {
    const skinUuids: string[] = [];

    for (const camo of cleanedCamos) {
        try {
            const skin = await prismaClient.skin.upsert({
                where: {
                    camoUuid_weaponType: {
                        camoUuid: camo.uuid,
                        weaponType
                    }
                },
                update: {},
                create: {
                    camoUuid: camo.uuid,
                    weaponType
                },
                include: {
                    skinHistories: {
                        orderBy: {
                            createdAt: 'desc'
                        },
                        include: {
                            skinHistoryEntries: true,
                        },
                        take: 1,
                    }
                }
            });

            skinUuids.push(skin.uuid);
        } catch (error) {
            continue;
        }
    }

    return skinUuids;
}

async function captureSkins(skinUuids: string[]) {
    for (const skinUuid of skinUuids) {
        await fetchPostSkinCapture(skinUuid);
    }
}

export default defineEventHandler(async (event) => {
    try {
        /**
         * Validation
         */
        const body: { itemType: ItemType, weaponType: number } = await readBody(event);

        if (!body || !body.itemType || (!body.weaponType && body.weaponType !== 0)) {
            throw new Error('Harap isi itemType');
        }

        /**
         * Get & clean camoIDs
         */
        const gameCamoIDs = await getCamoIDsFromGameAPI(body.itemType, body.weaponType);
        const dbCamo = await getCamosFromDB(body.itemType);
        const cleanedCamos = cleanCamos(gameCamoIDs, dbCamo);

        /**
         * Upsert all camos
         */
        const skinUuids = await upsertSkins(body.weaponType, cleanedCamos);

        /**
         * Capture all skins
         */
        await captureSkins(skinUuids);

        return {
            msg: "Success",
        };
    } catch (e: unknown) {
        logger.error(`POST /api/skin/init : ${e}`);
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});
