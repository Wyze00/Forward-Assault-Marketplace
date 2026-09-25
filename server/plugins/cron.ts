import { ItemType } from "~~/prisma/generated/enums";
import { prismaClient } from "~~/server/util/prismaService";

const FULL_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const PRIORITY_WEAPON_TYPES = new Set<number>([
    1,  // AK-47
    14, // Knife
    21, // Karambit
    22, // Butterfly Knife
    28, // Fal
    29, // Hachet
    33, // Huntsman
    34, // Beretta
    35, // Brass Knuckles
    37, // Tecmic Knife
    38, // Kukri
]);

const FULL_SWEEP_WEAPON_TYPES = new Set<number>([
    1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
]);

const CHARACTER_OR_GLOVE_ITEM_TYPES = ['glove', 'character'] as ItemType[];

async function callCaptureForSkin(skinUuid: string) {
    try {
        await $fetch('/api/skin/capture', {
            method: 'POST',
            body: { skinUuid }
        });
    } catch (error) {
        console.error(`Cron capture failed for skinUuid=${skinUuid}:`, error);
    }
}

async function capturePriorityGroup() {
    const skins = await prismaClient.skin.findMany({
        where: {
            OR: [
                { weaponType: { in: [...PRIORITY_WEAPON_TYPES] } },
                { camo: { itemType: { in: CHARACTER_OR_GLOVE_ITEM_TYPES } } },
            ],
        },
        include: {
            camo: true,
            favoriteSkin: true,
        },
    });

    for (const skin of skins) {
        if (skin.favoriteSkin && PRIORITY_WEAPON_TYPES.has(skin.weaponType)) {
            continue;
        }

        await callCaptureForSkin(skin.uuid);
    }
}

async function captureFavoriteGroup() {
    const favorites = await prismaClient.favoriteSkin.findMany({
        include: {
            skin: {
                include: {
                    camo: true,
                },
            },
        },
    });

    for (const favorite of favorites) {
        const skin = favorite.skin;

        if (PRIORITY_WEAPON_TYPES.has(skin.weaponType)) {
            continue;
        }

        if (!FULL_SWEEP_WEAPON_TYPES.has(skin.weaponType)) {
            await callCaptureForSkin(skin.uuid);
        }
    }
}

async function runFullSweep() {
    await capturePriorityGroup();
    await captureFavoriteGroup();
}

export default defineNitroPlugin(() => {
    let isRunning = false;

    const schedule = async () => {
        if (isRunning) {
            return;
        }

        isRunning = true;

        try {
            await runFullSweep();
        } catch (error) {
            console.error('Full sweep failed:', error);
        } finally {
            isRunning = false;
        }
    };

    // void schedule();
    setInterval(() => {
        void schedule();
    }, FULL_SWEEP_INTERVAL_MS);
});
