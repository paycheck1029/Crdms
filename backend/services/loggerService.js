import winston from 'winston';
import 'winston-daily-rotate-file';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logDir = join(__dirname, '..', 'logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Create Winston loggers for different scopes
const createDailyLogger = (filename, level = 'info') => {
  return winston.createLogger({
    level,
    format: logFormat,
    transports: [
      new winston.transports.DailyRotateFile({
        filename: join(logDir, `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d'
      }),
      new winston.transports.Console({
        format: consoleFormat
      })
    ]
  });
};

const apiLogger = createDailyLogger('api');
const authLogger = createDailyLogger('auth');
const dbLogger = createDailyLogger('db');
const errorLogger = createDailyLogger('error', 'error');
const appLogger = createDailyLogger('application');

// Wrapper functions for logging
export const logApi = (message, meta = {}) => {
  apiLogger.info(message, meta);
};

export const logAuth = (message, meta = {}) => {
  authLogger.info(message, meta);
};

export const logDb = (message, meta = {}) => {
  dbLogger.info(message, meta);
};

export const logError = (error, meta = {}) => {
  const errorMessage = error instanceof Error ? error.stack : error;
  errorLogger.error(errorMessage, meta);
};

export const logApp = (message, meta = {}) => {
  appLogger.info(message, meta);
};

export default {
  logApi,
  logAuth,
  logDb,
  logError,
  logApp
};
