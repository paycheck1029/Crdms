import { query, queryGet, queryRun } from '../database/connection.js';

export const findById = async (id) => {
  return queryGet('SELECT * FROM Users WHERE id = ?', [id]);
};

export const findByUsername = async (username) => {
  return queryGet('SELECT * FROM Users WHERE username = ?', [username]);
};

export const findByEmail = async (email) => {
  return queryGet('SELECT * FROM Users WHERE email = ?', [email]);
};

export const create = async ({ username, email, passwordHash, role }) => {
  return queryRun(
    'INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, role]
  );
};

export const update = async (id, { email, role, passwordHash }) => {
  if (passwordHash) {
    return queryRun(
      'UPDATE Users SET email = ?, role = ?, password_hash = ? WHERE id = ?',
      [email, role, passwordHash, id]
    );
  }
  return queryRun(
    'UPDATE Users SET email = ?, role = ? WHERE id = ?',
    [email, role, id]
  );
};

export const deleteUser = async (id) => {
  return queryRun('DELETE FROM Users WHERE id = ?', [id]);
};

export const listAll = async () => {
  return query('SELECT id, username, email, role, email_verified, created_at FROM Users ORDER BY created_at DESC');
};

export const incrementLoginAttempts = async (id) => {
  return queryRun('UPDATE Users SET login_attempts = login_attempts + 1 WHERE id = ?', [id]);
};

export const resetLoginAttempts = async (id) => {
  return queryRun('UPDATE Users SET login_attempts = 0, locked_until = NULL WHERE id = ?', [id]);
};

export const lockAccount = async (id, durationMinutes) => {
  const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  return queryRun('UPDATE Users SET locked_until = ? WHERE id = ?', [lockedUntil, id]);
};

export const updateRefreshToken = async (id, token) => {
  return queryRun('UPDATE Users SET refresh_token = ? WHERE id = ?', [token, id]);
};

export const findByRefreshToken = async (token) => {
  return queryGet('SELECT * FROM Users WHERE refresh_token = ?', [token]);
};

export default {
  findById,
  findByUsername,
  findByEmail,
  create,
  update,
  deleteUser,
  listAll,
  incrementLoginAttempts,
  resetLoginAttempts,
  lockAccount,
  updateRefreshToken,
  findByRefreshToken
};
