import { Camo } from "~~/prisma/generated/client";
import { ItemType } from "~~/prisma/generated/enums";
import { GetSellOffersResponse, GetUniqueItemsResponse } from "~~/server/types";
import { fetchUtil } from "~~/server/util/fetchUtil";
import { prismaClient } from "~~/server/util/prismaService";

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);

        const page = query.page;
        const capture = query.capture;

        const response = await fetchUtil<GetUniqueItemsResponse>('marketplaceV3_get_unique_items.php', `page=${page}&itemPerPage=20&sortBy=newest`);
        
        
        

        return {
            msg: "Success",
        };

    } catch (e: unknown) {
        setResponseStatus(event, 400);
        
        if (e instanceof Error) {
            return {
                msg: e.message
            }
        }
    }
});