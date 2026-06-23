import { sendError } from '../utils/responseHelper.js';
import { ROLES } from '../config/roles.js';

export const validateUserCreate = (req, res, next) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return sendError(res, 'Username, email, password, and role are required', {}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format', {}, 400);
  }

  if (password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters long', {}, 400);
  }

  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) {
    return sendError(res, `Invalid user role. Must be one of: ${validRoles.join(', ')}`, {}, 400);
  }

  next();
};

export const validateUserUpdate = (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !role) {
    return sendError(res, 'Email and role are required', {}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format', {}, 400);
  }

  if (password && password.length < 8) {
    return sendError(res, 'Password must be at least 8 characters long', {}, 400);
  }

  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) {
    return sendError(res, `Invalid user role. Must be one of: ${validRoles.join(', ')}`, {}, 400);
  }

  next();
};

export default {
  validateUserCreate,
  validateUserUpdate
};
