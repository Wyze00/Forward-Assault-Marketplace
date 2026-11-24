import { GameAPIResponse, GetSellOffersGameAPIResponse, GetUniqueItemsGameAPIResponse } from "../types/gameApi";
import { getEnvOrExit } from "./getEnvOrExit.js";
import { logger } from "./logger";

/**
 * Get the bot username and password from environment variables.
 */
const BOT_USERNAME = getEnvOrExit('BOT_USERNAME');
const BOT_PASSWORD = getEnvOrExit('BOT_PASSWORD');

/**
 * Formats an object into a URL-encoded string suitable for use as the body of a POST request with 'application/x-www-form-urlencoded' content type.
 * @param body - An object containing key-value pairs to be formatted.
 * @returns A URL-encoded string representation of the input object.
 * @example 
 * ```typescript
 * const body = { username: 'john_doe', password: 'secret' };
 * const encodedBody = formatRequestBody(body); // "username=john_doe&password=secret"
 * ```
 */
function formatRequestBody(body: Record<string, any>): string {
    return Object.entries(body)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

/**
 * Fetches data from the game API with custom credentials.
 * @throws Error
 * @param url - The API endpoint URL.
 * @param body - The request body containing key-value pairs.
 * @returns A promise resolving to the fetched data.
 */
export async function fetchGameAPICustomCredential<T extends GameAPIResponse>(url: string, body: Record<string, any>): Promise<T> {
    const response = await fetch(`https://fa.blayzegames.com/OnlineAccountSystem_NewFPS/${url}`, {
        method: 'POST',
        headers: {
            'User-Agent': 'UnityPlayer/2022.3.62f3 (UnityWebRequest/1.0, libcurl/8.10.1-DEV)',
            'X-Unity-Version': '2022.3.62f3',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formatRequestBody(body),
    });

    if (response.status !== 200) {
        throw new Error(`Fetch ${url} Gagal Status Tidak 200`);
    }

    const responseBody: T = await response.json();
    
    if (responseBody.status === 0) {
        throw new Error(`Fetch ${url} Gagal Status body 0 : ${responseBody?.msg}`);
    }

    logger.verbose(`Fetch ${url} Berhasil`);
    return responseBody;
}

/**
 * Fetches data from the game API with default credentials.
 * @throws Error
 * @param url - The API endpoint URL.
 * @param data - The request body containing key-value pairs.
 * @returns A promise resolving to the fetched data.
 */
export async function fetchGameAPI<T extends GameAPIResponse>(url: string, data: Record<string, any>): Promise<T> {
    const body = {
        ...data,
        username: BOT_USERNAME,
        password: BOT_PASSWORD
    };

    return fetchGameAPICustomCredential<T>(url, body);
}

export async function fetchGameAPIGetUniqueItems(data: Record<string, any>): Promise<GetUniqueItemsGameAPIResponse> {
    return await fetchGameAPI<GetUniqueItemsGameAPIResponse>("marketplaceV3_get_unique_items.php", data);
}

export async function fetchGameAPIGetSellOffers(data: Record<string, any>): Promise<GetSellOffersGameAPIResponse> {
    return await fetchGameAPI<GetSellOffersGameAPIResponse>("marketplaceV3_get_sell_offers.php", data);
}

/**
 * @deprecated Use `fetchGameAPICustomCredential` instead for better flexibility and type safety.
 */
export async function fetchUtil<T extends GameAPIResponse>(url: string, data: string): Promise<T> {
    const response = await fetch(`https://fa.blayzegames.com/OnlineAccountSystem_NewFPS/${url}`, {
        method: 'POST',
        headers: {
            'User-Agent': 'UnityPlayer/2022.3.62f3 (UnityWebRequest/1.0, libcurl/8.10.1-DEV)',
            'X-Unity-Version': '2022.3.62f3',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${BOT_USERNAME}&password=${BOT_PASSWORD}&${data}`,
    });

    if (response.status !== 200) {
        console.log('Fetch Gagal Status Tidak 200');
        process.exit(1);
    }

    const responseBody: T = await response.json();
    
    if (responseBody.status === 0) {
        console.log(`Fetch Gagal Status 0 : ${responseBody?.msg}`);
        process.exit(1);
    }

    return responseBody;
}