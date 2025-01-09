import { Logger, pino } from 'pino';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const retrieveEnvVariable = (variableName: string, logger: Logger) => {
    const variable = process.env[variableName] || '';
    if (!variable) {
        logger.error(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};

const settingsPath = path.join(__dirname, '../settings.json');

export const retrieveSetting = (settingName: string, logger: Logger) => {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        if (settings[settingName] === undefined) {
            logger.error(`${settingName} is not set`);
            return null;
        }
        return settings[settingName];
    } catch (error: any) {
        logger.error(`Error reading settings: ${error.message}`);
        process.exit(1);
    }
};

export const updateSetting = (settingName: string, value: any) => {
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        settings[settingName] = value;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (error: any) {
        logger.error(`Error updating settings: ${error.message}`);
        process.exit(1);
    }
};

// Define log file path
const logFilePath = path.join(__dirname, '../logs/output.log');

// Ensure the logs directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Set up pino with pino-pretty for terminal output
export const logger: Logger = pino({
    level: 'info',  // Set your log level
    base: null, // Remove pid and hostname globally
    timestamp: pino.stdTimeFunctions.isoTime, // Use ISO format for time
    transport: {
        targets: [
            {
                target: 'pino-pretty', // Pretty output for terminal
                level: 'info',
                options: {
                    colorize: true, // Enable colors in the terminal
                    translateTime: 'SYS:standard', // Show timestamp in system time zone
                    ignore: 'pid,hostname', // Ignore unnecessary fields like pid and hostname
                    messageFormat: '{level} - {msg}', // Use {level} instead of {levelLabel}
                },
            },
            {
                target: 'pino/file', // Raw JSON output for file
                level: 'info',
                options: { 
                    destination: logFilePath,
                    ignore: 'pid,hostname', // Ignore unnecessary fields like pid and hostname
                }, 
            }
        ]
    }
});