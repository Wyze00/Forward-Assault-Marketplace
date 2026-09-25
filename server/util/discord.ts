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

export async function sendDiscordAlert(alert: DiscordAlert): Promise<boolean> {

    if (!webhookUrl) {
        return false;
    }

    await $fetch(webhookUrl, {
        method: 'POST',
        body: {
            username: 'FA Market Alert',
            embeds: [{
                title: alert.title,
                description: alert.description,
                color: 0xFFD23F,
                fields: alert.fields,
            } satisfies DiscordEmbed],
        },
    });

    return true;
}
