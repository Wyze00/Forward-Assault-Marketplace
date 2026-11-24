import 'dotenv/config';
import process from 'process';
import { logger } from './logger';

/**
 * Gets an environment variable or exits if it's not set.
 * @param name The name of the environment variable.
 * @returns The value of the environment variable.
 */
export function getEnvOrExit(name: string): string {
    const result: string | undefined = process.env[name];

    if (result === undefined) {
        logger.error(`Environment variable ${name} is not set`);
        process.exit(1);
    }

    logger.verbose(`Environment variable ${name} is set to: ${result}`);
    return result;
}