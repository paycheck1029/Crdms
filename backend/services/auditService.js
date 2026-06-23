import auditRepository from '../repositories/auditRepository.js';
import { parseUserAgent } from '../utils/userAgentParser.js';
import { logError } from './loggerService.js';

export const logActivity = async (req, action, details, oldValue = null, newValue = null) => {
  try {
    const userId = req && req.user ? req.user.id : null;
    const username = req && req.user ? req.user.username : 'system';
    
    // Fallbacks if req is mock or CLI-based
    const ipAddress = req ? (req.ip || req.connection?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const userAgentString = req ? req.headers['user-agent'] : '';
    const { browser, os } = parseUserAgent(userAgentString);

    await auditRepository.create({
      userId,
      username,
      action,
      details,
      ipAddress,
      browser,
      os,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null
    });
  } catch (error) {
    logError(new Error(`Failed to save audit log: ${error.message}`));
  }
};

export const listLogs = async (params = {}) => {
  const page = parseInt(params.page || '1', 10);
  const limit = parseInt(params.limit || '100', 10);
  const offset = (page - 1) * limit;

  const logs = await auditRepository.listAll(limit, offset);
  const total = await auditRepository.countAll();

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export default {
  logActivity,
  listLogs
};
