import { query, queryGet, queryRun } from '../database/connection.js';

export const create = async ({ userId, username, action, details, ipAddress, browser, os, oldValue, newValue }) => {
  return queryRun(
    `INSERT INTO ActivityLogs 
     (user_id, username, action, details, ip_address, browser, os, old_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId || null,
      username || null,
      action,
      details || null,
      ipAddress || null,
      browser || null,
      os || null,
      oldValue || null,
      newValue || null
    ]
  );
};

export const listAll = async (limit = 100, offset = 0) => {
  return query(
    `SELECT * FROM ActivityLogs 
     ORDER BY timestamp DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
};

export const countAll = async () => {
  const result = await queryGet('SELECT COUNT(*) as count FROM ActivityLogs');
  return result ? result.count : 0;
};

export default {
  create,
  listAll,
  countAll
};
