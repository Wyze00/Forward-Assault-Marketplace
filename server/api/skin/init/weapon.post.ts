import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body: {weaponType: string} = await readBody(event);

        if (!body.weaponType) {
            throw new Error('Harap isi WeaponType');
        }

        const weapon = await prismaClient.weapon.findUnique({
            where: {
                weaponType: Number(body.weaponType),
            }
        })

        if (!weapon) {
            throw new Error('Weapon Type Tidak Ada');
        }

        // Fetch all weapon camoID from marketplace
        const camoIDs: number[] = []
        let page = 0;

        while (true) {
            const response = await fetchUtil<GetUniqueItemsResponse>('marketplaceV3_get_unique_items.php', `page=${page}&itemPerPage=20&sortBy=price_asc&itemType=weapon&weaponType=${weapon.weaponType}`);

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
                itemType: ItemType.weapon
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
                console.log(`Unknown Glove CamoID : ${id}`);
                return false;
            }
        })
        
        await prismaClient.$transaction(
            cleanedCamoIDs.map((id) => {
                return prismaClient.skin.create({
                    data: {
                        camoUuid: dbCamoMap.get(id)!.uuid,
                        weaponType: weapon.weaponType,
                    }
                })
            })
        )

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