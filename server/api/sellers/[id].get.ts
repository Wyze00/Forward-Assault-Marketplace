import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    const sellerID = Number(getRouterParam(event, 'id'));

    if (!Number.isSafeInteger(sellerID) || sellerID < 0) {
        setResponseStatus(event, 400);
        return { msg: 'Invalid sellerID' };
    }

    try {
        const sellerEntries = await prismaClient.skinHistoryEntry.findMany({
            where: { sellerID },
            orderBy: { skinHistory: { createdAt: 'desc' } },
            include: {
                skinHistory: {
                    select: {
                        createdAt: true,
                        skinUuid: true,
                        skin: {
                            include: {
                                camo: true,
                                weapon: true,
                            },
                        },
                    },
                },
            },
        });

        if (!sellerEntries.length) {
            return {
                msg: 'Success',
                data: {
                    sellerID,
                    names: [],
                    offers: [],
                    activeCount: 0,
                    removedCount: 0,
                },
            };
        }

        const names = [...new Set(
            sellerEntries
                .map((entry) => entry.sellerName.trim())
                .filter(Boolean),
        )];
        const skinUuids = [...new Set(sellerEntries.map((entry) => entry.skinHistory.skinUuid))];
        const latestHistories = await prismaClient.skinHistory.findMany({
            where: { skinUuid: { in: skinUuids } },
            orderBy: { createdAt: 'desc' },
            include: {
                skinHistoryEntries: {
                    where: { sellerID },
                    select: { skinID: true },
                },
            },
        });

        const latestSellerListings = new Map<string, Set<number>>();
        for (const history of latestHistories) {
            if (latestSellerListings.has(history.skinUuid)) continue;
            latestSellerListings.set(
                history.skinUuid,
                new Set(history.skinHistoryEntries.map((entry) => entry.skinID)),
            );
        }

        const latestOffers = new Map<string, typeof sellerEntries[number]>();
        for (const entry of sellerEntries) {
            const key = `${entry.skinHistory.skinUuid}_${entry.skinID}`;
            if (!latestOffers.has(key)) latestOffers.set(key, entry);
        }

        const offers = [...latestOffers.values()].map((entry) => {
            const skin = entry.skinHistory.skin;
            const itemType = skin.camo.itemType;
            const isActive = latestSellerListings
                .get(entry.skinHistory.skinUuid)
                ?.has(entry.skinID) ?? false;

            return {
                offerID: entry.offerID,
                sellerID: entry.sellerID,
                skinID: entry.skinID,
                skinUuid: entry.skinHistory.skinUuid,
                itemType,
                name: itemType === 'weapon'
                    ? `${skin.weapon?.weaponName || ''} - ${skin.camo.camoName}`
                    : skin.camo.camoName,
                condition: entry.condition,
                price: entry.price,
                listingDate: entry.listingDate,
                lastSeenAt: entry.skinHistory.createdAt,
                status: isActive ? 'active' : 'removed',
            };
        }).sort((first, second) => {
            const firstDate = new Date(first.listingDate).getTime();
            const secondDate = new Date(second.listingDate).getTime();
            const safeFirstDate = Number.isNaN(firstDate) ? new Date(first.lastSeenAt).getTime() : firstDate;
            const safeSecondDate = Number.isNaN(secondDate) ? new Date(second.lastSeenAt).getTime() : secondDate;
            return safeSecondDate - safeFirstDate;
        });

        return {
            msg: 'Success',
            data: {
                sellerID,
                names,
                offers,
                activeCount: offers.filter((offer) => offer.status === 'active').length,
                removedCount: offers.filter((offer) => offer.status === 'removed').length,
            },
        };
    } catch (error) {
        console.error('Failed to load seller history:', error);
        setResponseStatus(event, 500);
        return { msg: 'Failed to load seller information' };
    }
});
