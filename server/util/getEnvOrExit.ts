import 'dotenv/config';
import process from 'process';

export function getEnvOrExit(name: string): string {
    const result: string | undefined = process.env[name];

    if (result === undefined) {
        process.exit(1);
    }

    return result;
}