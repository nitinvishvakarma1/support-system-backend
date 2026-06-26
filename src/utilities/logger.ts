import { createLogger, format, transports } from "winston";
import "winston-mongodb"
import { CONNECTION_STRING } from "../config";
const { combine, timestamp, json, printf, errors, colorize, metadata } = format;

const consoleLogFormat = printf(({ level, message, timestamp }) => {
    return `${level}: ${JSON.stringify(message)}`;
});

const logger = createLogger({
    level: "info",
    format: combine(
        timestamp({ format: "DD-MM-YYYY hh:mm:ss A" }),
        errors({ stack: true }),
        json(),
        colorize(),
    ),
    transports: [
        new transports.Console({
            format: combine(
                consoleLogFormat
            ),
        }),
        new transports.File({
            filename: "app.log",
        }),
        new transports.File({
            level: "error",
            filename: "error.log",
        }),
        new transports.MongoDB({
            level: "error",
            db: CONNECTION_STRING,
            collection: "support-system-logs",
        }),
    ],
    exitOnError: false,
});

export default logger;