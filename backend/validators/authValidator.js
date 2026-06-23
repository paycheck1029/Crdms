import { sendError } from '../utils/responseHelper.js';

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', {}, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format', {}, 400);
  }

  next();
};

export default {
  validateLogin
};
