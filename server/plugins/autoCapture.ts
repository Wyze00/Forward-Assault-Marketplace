import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchGameAPI } from "~~/server/util/fetchGameApi";
import { prismaClient } from "~~/server/util/prismaService";
import { GetUniqueItemsResponse } from "~~/server/types";
import { fetchPostSkinCapture } from '../util/fetchApi';
import { GetUniqueItemsGameAPIResponse } from '../types/gameApi';
import { logger } from 'nuxt/kit';

const DATA_FILE = path.resolve(process.cwd(), 'lastCapturedData.json');

/**
 * Get marketplace items from the game API.
 * @throws Error
 */
async function getMarketplaceItems(): Promise<GetUniqueItemsGameAPIResponse['items']> {
    const response =  await fetchGameAPI<GetUniqueItemsGameAPIResponse>(
        'marketplaceV3_get_unique_items.php',
        {
            page:   "0",
            itemPerPage: "20",
            sortBy: "newest"
        }
    );

    if (!response.items?.length) {
        throw new Error('Tidak ada  data item');
    }

    return response.items;
}

/**
 * Get last items from the local JSON file.
 */
async function getLastItems(): Promise<GetUniqueItemsGameAPIResponse['items']> {
    try {
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent) as GetUniqueItemsResponse['items'];
    } catch (error) {
        return [];
    }
}

/**
 * Processes marketplace items and compares them with the last captured items.
 * @returns A boolean indicating whether there are changes in the marketplace items.
 */
async function processItems(marketplaceItems: GetUniqueItemsGameAPIResponse['items'], lastItems: GetUniqueItemsGameAPIResponse['items']): Promise<boolean> {
    let hasChanges = false;

    const lastItemsMap = new Map(lastItems.map((item) => [
        `${item.itemType}_${item.weaponType}_${item.camoID}`,
        item.lowestPrice
    ]));

    for (const item of marketplaceItems) {
        if (item.itemType as string === 'sticker') continue;

        const key = `${item.itemType}_${item.weaponType}_${item.camoID}`;
        const previousPrice = lastItemsMap.get(key);

        if (previousPrice !== undefined && previousPrice === item.lowestPrice) {
            continue;
        }

        hasChanges = true;

        const camo = await prismaClient.camo.findFirst({
            where: { camoID: item.camoID, itemType: item.itemType }
        });

        if (!camo) {
            logger.warn(`Unknown camo ${item.camoID}`);
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

        await fetchPostSkinCapture(skin.uuid);
    }
        
    return hasChanges;
}

export default defineNitroPlugin(() => {
    setInterval(async () => {
        try {
            const marketplaceItems = await getMarketplaceItems();
            let lastsItems = await getLastItems();
            const hasChanges = await processItems(marketplaceItems, lastsItems);

            // Update the last captured data if there are changes or if the last items are empty
            if (hasChanges || lastsItems.length === 0) {
                await fs.writeFile(DATA_FILE, JSON.stringify(marketplaceItems, null, 2));
            }

        } catch (error) {
            logger.error('Gagal melakukan auto-capture:', error);
        }
    }, 12345 * 60 * 1000);
});
