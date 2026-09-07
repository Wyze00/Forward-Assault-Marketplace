import { ItemType } from "~~/prisma/generated/enums";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {

         const formData = await readMultipartFormData(event)
  
        if (!formData) {
            throw new Error('Data Form Tidak Valid');
        }

        const fileField = formData.find(field => field.name === 'file')
        const itemTypeField = formData.find(field => field.name === 'itemType')

        if (!fileField || !itemTypeField) {
            throw createError('File Tidak Ada');
        }

        const csvContent = fileField.data.toString('utf-8').trim();
        const itemType: ItemType = itemTypeField.data.toString('utf-8') as ItemType;

        if (itemType !== ItemType.character && itemType !== ItemType.weapon && itemType !== ItemType.glove) {
            throw new Error('ItemType Tidak sesuai');
        }
        
        if (!csvContent) {
            throw new Error("Konten CSV Kosong")
        }

        const lines = csvContent.split(/\r|\r\n|\n/).filter((v) => v.trim().length > 0);

        await prismaClient.$transaction(
            lines.map((v) => {
                const [camoID, camoName] = v.split(',');

                if (!camoID || !camoName) {
                    throw new Error('Format CSV Ada yang Salah');
                }

                return prismaClient.camo.create({
                    data: {
                        camoID: Number(camoID),
                        itemType,
                        camoName
                    }
                })
            })
        )

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