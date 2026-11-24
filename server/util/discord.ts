import { getEnvOrExit } from "./getEnvOrExit";
import { DiscordAlert, DiscordEmbed } from "../types/discordWebhook";
import { logger } from "./logger";

/**
 * Get the Discord webhook URL from environment variables and define a timeout for webhook requests.
 */
const WEBHOOK_URL = getEnvOrExit('DISCORD_WEBHOOK_URL');
const WEBHOOK_TIMEOUT_MS = 10_000;

const isTimeoutError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;

    const timeoutError = error as { name?: string; code?: string; message?: string };
    const errorText = `${timeoutError.name ?? ''} ${timeoutError.code ?? ''} ${timeoutError.message ?? ''}`.toLowerCase();

    return errorText.includes('timeout')
        || errorText.includes('etimedout')
        || errorText.includes('abort');
};

/**
 * Posts a Discord alert to the configured webhook URL.
 */
const postWebhook = async (alert: DiscordAlert) => {
    return $fetch(WEBHOOK_URL, {
        method: 'POST',
        timeout: WEBHOOK_TIMEOUT_MS,
        body: {
            embeds: [{
                title: alert.title,
                description: alert.description,
                color: Math.floor(Math.random() * 0x1000000),
                fields: alert.fields,
            } satisfies DiscordEmbed],
        },
    });
};

/**
 * Sends a Discord alert to the configured webhook URL. If the request times out, it retries once.
 */
export async function sendDiscordAlert(alert: DiscordAlert): Promise<void> {
    try {
        await postWebhook(alert);
    } catch (error) {
        if (!isTimeoutError(error)) throw error;
        await postWebhook(alert);
    }

    logger.verbose(`Discord alert sent succesfully`);
}
