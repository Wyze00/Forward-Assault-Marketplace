import { prismaClient } from "~~/server/util/prismaService";

const getConditionGroup = (condition: number) => {
    if (condition < 0.01) return { key: 'factory-new', name: 'Factory New' };
    if (condition < 0.15) return { key: 'minimal-wear', name: 'Minimal Wear' };
    if (condition < 0.35) return { key: 'field-tested', name: 'Field Tested' };
    if (condition < 0.45) return { key: 'well-worn', name: 'Well Worn' };
    return { key: 'battle-scarred', name: 'Battle Scarred' };
};

const getOfferKey = (entry: { skinID: number; sellerID: number }) =>
    `${entry.skinID}_${entry.sellerID}`;

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

        const conditionGroups = [...new Map(
            histories
                .flatMap((history) => history.skinHistoryEntries)
                .map((entry) => {
                    const group = getConditionGroup(entry.condition);
                    return [group.key, group];
                }),
        ).values()];

        const conditions = conditionGroups.map((conditionGroup) => {
            const trendData = histories.map((history, historyIndex) => {
                const entries = history.skinHistoryEntries
                    .filter((entry) => getConditionGroup(entry.condition).key === conditionGroup.key)
                    .sort((first, second) => first.price - second.price);
                const nextHistory = histories[historyIndex + 1];
                const nextEntries = nextHistory?.skinHistoryEntries
                    .filter((entry) => getConditionGroup(entry.condition).key === conditionGroup.key) ?? [];
                const nextEntryKeys = new Set(nextEntries.map((entry) => getOfferKey(entry)));
                const nextLowestPrice = nextEntries.length
                    ? Math.min(...nextEntries.map((entry) => entry.price))
                    : null;
                const inferredSoldOffers = nextHistory
                    ? entries
                        .filter((entry) => {
                            const disappeared = !nextEntryKeys.has(getOfferKey(entry));
                            const isLowestPriority = nextLowestPrice === null || entry.price <= nextLowestPrice;
                            return disappeared && isLowestPriority;
                        })
                        .map((entry) => ({
                            offerID: entry.offerID,
                            skinID: entry.skinID,
                            sellerID: entry.sellerID,
                            sellerName: entry.sellerName,
                            condition: entry.condition,
                            estimatedPrice: entry.price,
                        }))
                    : [];
                const estimatedSoldAverage = inferredSoldOffers.length
                    ? Math.round(inferredSoldOffers.reduce((sum, offer) => sum + offer.estimatedPrice, 0) / inferredSoldOffers.length)
                    : null;
                const floorPrice = entries[0]?.price ?? null;
                const trimmed = entries.length > 5 ? entries.slice(0, 5) : entries;
                const avgPrice = trimmed.length
                    ? Math.round(trimmed.reduce((sum, entry) => sum + entry.price, 0) / trimmed.length)
                    : null;

                return {
                    capturedAt: history.createdAt,
                    soldDetectedAt: nextHistory?.createdAt ?? null,
                    floorPrice,
                    avgPrice,
                    count: entries.length,
                    inferredSoldOffers,
                    inferredSoldCount: inferredSoldOffers.length,
                    estimatedSoldAverage,
                };
            });

            const allInferredSoldOffers = trendData.flatMap((capture) => capture.inferredSoldOffers);
            const validPoints = trendData.filter((point) => point.floorPrice !== null && point.avgPrice !== null);
            const firstFloor = validPoints[0]?.floorPrice ?? null;
            const lastFloor = validPoints[validPoints.length - 1]?.floorPrice ?? null;
            const absoluteDelta = firstFloor !== null && lastFloor !== null ? lastFloor - firstFloor : 0;
            const changePercent = firstFloor !== null && firstFloor !== 0
                ? Number(((absoluteDelta / firstFloor) * 100).toFixed(2))
                : 0;
            const trendLabel = firstFloor !== null && lastFloor !== null && Math.abs(changePercent) >= 8
                ? absoluteDelta >= 0 ? 'uptrend' : 'downtrend'
                : 'sideways';

            return {
                conditionGroup: conditionGroup.key,
                conditionName: conditionGroup.name,
                data: trendData,
                summary: {
                    label: trendLabel,
                    firstFloorPrice: firstFloor,
                    lastFloorPrice: lastFloor,
                    deltaPrice: absoluteDelta,
                    changePercent,
                    inferredSoldCount: allInferredSoldOffers.length,
                    estimatedSoldAverage: allInferredSoldOffers.length
                        ? Math.round(allInferredSoldOffers.reduce((sum, offer) => sum + offer.estimatedPrice, 0) / allInferredSoldOffers.length)
                        : null,
                },
            };
        });

        const defaultCondition = conditions[0] ?? {
            conditionGroup: null,
            conditionName: null,
            data: [],
            summary: {
                label: 'sideways',
                firstFloorPrice: null,
                lastFloorPrice: null,
                deltaPrice: 0,
                changePercent: 0,
                inferredSoldCount: 0,
                estimatedSoldAverage: null,
            },
        };
        return {
            msg: 'Success',
            data: defaultCondition.data,
            summary: defaultCondition.summary,
            conditions,
        };
    } catch (e: unknown) {
        setResponseStatus(event, 400);
        if (e instanceof Error) {
            return { msg: e.message };
        }
    }
});
