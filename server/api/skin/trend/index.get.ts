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

        const trendData = histories.map((history) => {
            const entries = [...history.skinHistoryEntries].sort((a, b) => a.price - b.price);

            if (!entries.length) {
                return {
                    capturedAt: history.createdAt,
                    floorPrice: null,
                    avgPrice: null,
                    count: 0,
                };
            }

            const floorPrice = entries[0].price;

            const trimmed = entries.length > 5
                ? entries.slice(0,5)
                : entries;

            const avgPrice = trimmed.length
                ? Math.round(trimmed.reduce((sum, entry) => sum + entry.price, 0) / trimmed.length)
                : floorPrice;

            return {
                capturedAt: history.createdAt,
                floorPrice,
                avgPrice,
                count: entries.length,
            };
        });

        const validPoints = trendData.filter((point) => point.floorPrice !== null && point.avgPrice !== null);
        const firstFloor = validPoints[0]?.floorPrice ?? null;
        const lastFloor = validPoints[validPoints.length - 1]?.floorPrice ?? null;
        const absoluteDelta = firstFloor !== null && lastFloor !== null ? lastFloor - firstFloor : 0;
        const percentDelta = firstFloor !== null && firstFloor !== 0 ? Math.abs(absoluteDelta / firstFloor) * 100 : 0;

        let trendLabel = 'sideways';
        if (firstFloor !== null && lastFloor !== null && percentDelta >= 8) {
            trendLabel = absoluteDelta >= 0 ? 'uptrend' : 'downtrend';
        }

        const summary = {
            label: trendLabel,
            firstFloorPrice: firstFloor,
            lastFloorPrice: lastFloor,
            deltaPrice: firstFloor !== null && lastFloor !== null ? lastFloor - firstFloor : 0,
            changePercent: firstFloor !== null && firstFloor !== 0 ? Number(((lastFloor - firstFloor) / firstFloor * 100).toFixed(2)) : 0,
        };

        return {
            msg: 'Success',
            data: trendData,
            summary,
        };
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
