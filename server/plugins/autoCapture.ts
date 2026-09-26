import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";
import { GetUniqueItemsResponse } from "~~/server/types";

const DATA_FILE = path.resolve(process.cwd(), 'lastCapturedData.json');

async function callCaptureForSkin(skinUuid: string) {
    try {
        await $fetch('/api/skin/capture', {
            method: 'POST',
            body: { skinUuid }
        });
    } catch (error) {
        console.error(`Auto-capture failed for skinUuid=${skinUuid}:`, error);
    }
}

export default defineNitroPlugin(() => {
    setInterval(async () => {
        try {
            const marketplaceResponse = await fetchUtil<GetUniqueItemsResponse>(
                'marketplaceV3_get_unique_items.php',
                'page=0&itemPerPage=20&sortBy=newest'
            );

            if (!marketplaceResponse.items?.length) return;

            let lastData: GetUniqueItemsResponse['items'] = [];
            try {
                const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
                lastData = JSON.parse(fileContent) as GetUniqueItemsResponse['items'];
            } catch {
                // No previous capture file; treat this as the initial run.
            }

            const lastDataMap = new Map(lastData.map((item) => [
                `${item.itemType}_${item.weaponType}_${item.camoID}`,
                item.lowestPrice
            ]));

            let hasChanges = false;

            for (const item of marketplaceResponse.items) {
                if (item.itemType as string === 'sticker') continue;

                const key = `${item.itemType}_${item.weaponType}_${item.camoID}`;
                const previousPrice = lastDataMap.get(key);
                if (previousPrice !== undefined && previousPrice === item.lowestPrice) continue;

                hasChanges = true;

                const camo = await prismaClient.camo.findFirst({
                    where: { camoID: item.camoID, itemType: item.itemType }
                });

                if (!camo) {
                    console.log(`Unknown camo ${item.camoID}`);
                    continue;
                }

                const skin = await prismaClient.skin.upsert({
                    where: {
                        camoUuid_weaponType: {
                            camoUuid: camo.uuid,
                            weaponType: item.weaponType
                        }
                    },
                    update: {},
                    create: {
                        camoUuid: camo.uuid,
                        weaponType: item.weaponType
                    }
                });

                await callCaptureForSkin(skin.uuid);
            }

            if (hasChanges || lastData.length === 0) {
                await fs.writeFile(DATA_FILE, JSON.stringify(marketplaceResponse.items, null, 2));
            }

            console.log('Capture Done');
        } catch (error) {
            console.error('Gagal melakukan auto-capture:', error);
        }
    }, 1 * 60 * 1000);
});
