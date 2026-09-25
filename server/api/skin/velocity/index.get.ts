import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const skinUuid = query.skinUuid as string;

        if (!skinUuid) {
            throw new Error('Harap sertakan skinUuid');
        }

        const histories = await prismaClient.skinHistory.findMany({
            where: {
                skinUuid,
            },
            orderBy: {
                createdAt: 'asc',
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
        const durations: number[] = [];

        for (const history of histories) {
            const currentKeys = new Set(
                history.skinHistoryEntries.map((entry) => `${entry.skinID}_${entry.sellerID}`)
            );

            for (const key of currentKeys) {
                if (!activeListings.has(key)) {
                    activeListings.set(key, history.createdAt);
                }
            }

            for (const [key, firstSeenAt] of [...activeListings.entries()]) {
                if (!currentKeys.has(key)) {
                    const durationMs = new Date(history.createdAt).getTime() - new Date(firstSeenAt).getTime();
                    if (durationMs > 0) {
                        durations.push(durationMs);
                    }
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
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
