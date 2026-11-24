import { GetSkinVelocityResponse } from "~~/server/types/api/skin";
import { logger } from "~~/server/util/logger";
import { prismaClient } from "~~/server/util/prismaService";

/**
 * Untuk mendapatkan rata-rata waktu jual skin
 */

/**
 * Data skinUuid
 * Dapatkan semua history capture skin beserta entrynya. Filter secara descending dari yang paling baru
 * Loop historynya, masukan semua active listing ke map bedasarkan key skinId_sellerId
 * Jika sudah ada pada acive listing, masukan key ke Set dan hapus active listing
 */

export default defineEventHandler(async (event): Promise<GetSkinVelocityResponse | undefined> => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;

        if (!skinUuid) {
            throw new Error('Harap sertakan skinUuid');
        }

        /**
         * Get all histories
         */
        const histories = await prismaClient.skinHistory.findMany({
            where: {
                skinUuid,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                skinHistoryEntries: true,
            },
        });

        if (histories.length === 0) {
            return {
                msg: 'Success',
                data: {
                    averageHours: null,
                    averageMinutes: null,
                    count: 0,
                    firstSeenAt: null,
                    lastRemovedAt: null,
                },
            };
        }

        const activeListings = new Map<string, Date>();
        const soldKeys = new Set<string>();
        const durations: number[] = [];

        for (const history of histories) {
            const currentKeys = new Set(
                history.skinHistoryEntries.map((entry) => `${entry.skinID}_${entry.sellerID}`)
            );

            for (const key of currentKeys) {
                if(soldKeys.has(key)) {
                    continue;
                }

                if (!activeListings.has(key)) {
                    activeListings.set(key, history.createdAt);
                }
            }

            for (const [key, lastSeenAt] of [...activeListings.entries()]) {
                if (!currentKeys.has(key)) {
                    const durationMs = new Date(lastSeenAt).getTime() - new Date(history.createdAt).getTime();
                    if (durationMs > 0) {
                        durations.push(durationMs);
                    }

                    soldKeys.add(key);
                    activeListings.delete(key);
                }
            }
        }

        const averageMs = durations.length > 0
            ? durations.reduce((sum, value) => sum + value, 0) / durations.length
            : null;

        return {
            msg: 'Success',
            data: {
                averageHours: averageMs !== null ? Number((averageMs / (1000 * 60 * 60)).toFixed(2)) : null,
                averageMinutes: averageMs !== null ? Number((averageMs / (1000 * 60)).toFixed(2)) : null,
                count: durations.length,
                firstSeenAt: histories[0]?.createdAt ?? null,
                lastRemovedAt: histories[histories.length - 1]?.createdAt ?? null,
            },
        };
    } catch (e: unknown) {
        logger.error(`GET /api/skin/velocity : ${e}`);
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
