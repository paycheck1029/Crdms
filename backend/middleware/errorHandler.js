import { logError } from '../services/loggerService.js';
import dotenv from 'dotenv';
dotenv.config();

const env = process.env.APP_ENV || 'development';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log detailed stack trace to Winston error logger
  logError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    username: req.user ? req.user.username : 'anonymous'
  });

  // Standarised error response
  res.status(statusCode).json({
    success: false,
    message,
    error: env === 'development' || env === 'testing' ? {
      name: err.name,
      message: err.message,
      stack: err.stack
    } : {}
  });
};

export default errorHandler;
