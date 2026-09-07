import { PostWeaponRequest } from "~~/server/types";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody<PostWeaponRequest>(event);
    
        if (!body || !body.weaponType || !body.weaponName) {
            throw new Error("Missing Parameter");
        }

        await prismaClient.weapon.create({
            data: {
                weaponType: Number(body.weaponType),
                weaponName: body.weaponName
            }
        })

        return {
            msg: "Success"
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