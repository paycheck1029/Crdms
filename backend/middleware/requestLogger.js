import { logApi } from '../services/loggerService.js';
import { parseUserAgent } from '../utils/userAgentParser.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Wait for request to finish to capture status and latency
  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgentString = req.headers['user-agent'] || '';
    const { browser, os } = parseUserAgent(userAgentString);
    const username = req.user ? req.user.username : 'anonymous';

    const logDetails = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip,
      browser,
      os,
      username
    };

    const logMessage = `${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms - IP: ${ip} - User: @${username} (${browser}/${os})`;
    logApi(logMessage, logDetails);
  });

  next();
};

export default requestLogger;
