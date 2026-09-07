import type { FetchResponse } from "../types/index";
import { getEnvOrExit } from "./getEnvOrExit.js";

const username = getEnvOrExit('FA_USERNAME');
const password = getEnvOrExit('FA_PASSWORD');

export async function fetchUtil<T extends FetchResponse>(url: string, data: string): Promise<T> {
    const response = await fetch(`https://fa.blayzegames.com/OnlineAccountSystem_NewFPS/${url}`, {
        method: 'POST',
        headers: {
            'User-Agent': 'UnityPlayer/2022.3.62f3 (UnityWebRequest/1.0, libcurl/8.10.1-DEV)',
            'X-Unity-Version': '2022.3.62f3',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `username=${username}&password=${password}&${data}`,
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