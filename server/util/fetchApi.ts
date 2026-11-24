import { logger } from "./logger";

/**
 * Fetch POST /api/skin/capture
 */
export async function fetchPostSkinCapture(skinUuid: string) {
    try {
        await $fetch('/api/skin/capture', {
            method: 'POST',
            body: { skinUuid }
        });
    } catch (error) {
        logger.error(`Failed capture skin, uuid ${skinUuid}`);
    }
}