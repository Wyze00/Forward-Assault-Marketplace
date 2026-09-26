import { getEnvOrExit } from "./getEnvOrExit";

type DiscordEmbed = {
    title: string;
    description: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
};

type DiscordAlert = {
    title: string;
    description: string;
    fields?: DiscordEmbed['fields'];
};

const webhookUrl = getEnvOrExit('DISCORD_WEBHOOK_URL');
const webhookTimeoutMs = 10_000;

const isTimeoutError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;

    const timeoutError = error as { name?: string; code?: string; message?: string };
    const errorText = `${timeoutError.name ?? ''} ${timeoutError.code ?? ''} ${timeoutError.message ?? ''}`.toLowerCase();

    return errorText.includes('timeout')
        || errorText.includes('etimedout')
        || errorText.includes('abort');
};

const postWebhook = async (alert: DiscordAlert) => {
    return $fetch(webhookUrl, {
        method: 'POST',
        timeout: webhookTimeoutMs,
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

export async function sendDiscordAlert(alert: DiscordAlert): Promise<boolean> {
    try {
        const x = await postWebhook(alert);
    } catch (error) {
        if (!isTimeoutError(error)) throw error;
        const y = await postWebhook(alert);
    }

    return true;
}
