import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: { itemType: string, weaponType?: string | number } = await readBody(event);

        if (!body.itemType) {
            throw new Error('Harap isi itemType');
        }

        let weaponType = 0;
        let extraQuery = '';

        if (body.itemType === 'weapon') {
            if (!body.weaponType) {
                throw new Error('Harap isi WeaponType');
            }
            weaponType = Number(body.weaponType);

            const weapon = await prismaClient.weapon.findUnique({
                where: {
                    weaponType: weaponType,
                }
            })

            if (!weapon) {
                throw new Error('Weapon Type Tidak Ada');
            }

            extraQuery = `&weaponType=${weapon.weaponType}`;
        } else if (body.itemType === 'glove' || body.itemType === 'character') {
            weaponType = 0;
        } else {
            throw new Error('Item Type Tidak Valid');
        }

        const camoIDs: number[] = []
        let page = 0;

        while (true) {
            const response = await fetchUtil<GetUniqueItemsResponse>('marketplaceV3_get_unique_items.php', `page=${page}&itemPerPage=20&sortBy=price_asc&itemType=${body.itemType}${extraQuery}`);
            
            response.items.forEach((skin) => {
                camoIDs.push(skin.camoID);
            })

            if (!response.hasMore) {
                break;
            }

            page++;
        }

        // Cleaning CamoId
        const dbCamo = await prismaClient.camo.findMany({
            where: {
                itemType: body.itemType as ItemType
            },
        })

        const dbCamoMap = new Map<number, Camo>(dbCamo.map((v) => [v.camoID, v]));
        const camoSet = new Set<number>();

        const cleanedCamoIDs = camoIDs.filter((id) => {
            if (dbCamoMap.has(Number(id))) {
                if (camoSet.has(Number(id))) {
                    return false;
                } else {
                    camoSet.add(Number(id));
                }

                return true;
            } else {
                console.log(`Unknown ${body.itemType} CamoID : ${id}`);
                return false;
            }
        })
        
        await prismaClient.skin.createMany({
            data: cleanedCamoIDs.map((id) => {
                return {
                    camoUuid: dbCamoMap.get(id)!.uuid,
                    weaponType: weaponType,
                }
            })
        })

        return {
            msg: "Success",
        }

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});
