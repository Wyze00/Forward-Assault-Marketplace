export interface DiscordEmbed {
    title: string;
    description: string;
    color?: number;
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
};


export interface DiscordAlert {
    title: string;
    description: string;
    fields?: DiscordEmbed['fields'];
};