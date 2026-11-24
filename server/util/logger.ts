import winston, { Logger } from 'winston';
import pc from 'picocolors';

/**
 * Logger instance for the application.
 */
const LOG_LEVEL = process.argv[2] || 'info';

if (!['error', 'warn', 'info', 'debug', 'verbose'].includes(LOG_LEVEL)) {
    console.log(`${pc.red('ERROR')} Invalid log level: ${LOG_LEVEL}`);
    process.exit(1);
}

export const logger: Logger = winston.createLogger({
    level: LOG_LEVEL,
    transports: [
        new winston.transports.Console(),
    ],
    format: winston.format.printf((log: winston.Logform.TransformableInfo) => {
        return `[${getLevelColor(log.level)}] ${log.message}`;
    })
});

/**
 * Gets the color for a given log level.
 * @param level The log level.
 * @returns The colored log level.
 */
function getLevelColor(level: string) {
    level = level.toUpperCase();

    if (level === 'ERROR') {
        return pc.red(level);
    } else if (level === 'WARN') {
        return pc.yellow(level);
    } else if (level === 'INFO') {
        return pc.green(level);
    } else if (level === 'DEBUG') {
        return pc.cyan(level);
    } else {
        return pc.magenta(level);
    }
}