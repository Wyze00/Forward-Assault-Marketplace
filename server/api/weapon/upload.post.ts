import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
         const formData = await readMultipartFormData(event)
  
        if (!formData) {
            throw new Error('Data Form Tidak Valid');
        }

        const fileField = formData.find(field => field.name === 'file')

        if (!fileField) {
            throw createError('File Tidak Ada');
        }

        const csvContent = fileField.data.toString('utf-8').trim();

        if (!csvContent) {
            throw new Error("Konten CSV Kosong")
        }

        const lines = csvContent.split(/\r|\r\n|\n/).filter((v) => v.trim().length > 0);
        
        await prismaClient.$transaction(
            lines.map((v) => {
                const [weaponType, weaponName] = v.split(',');

                if (!weaponType || !weaponName) {
                    throw new Error('Format CSV Ada yang Salah');
                }

                return prismaClient.weapon.create({
                    data: {
                        weaponType: Number(weaponType),
                        weaponName
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