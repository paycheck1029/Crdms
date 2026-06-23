import authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const getCookie = (req, name) => {
  if (!req.headers.cookie) return null;
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);

    // Set refresh token in secure HttpOnly cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth', // Scope to auth routes
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token
    });

    return sendSuccess(res, {
      accessToken: data.accessToken,
      user: data.user
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    // Attempt to read from HttpOnly cookies first, fallback to body
    const token = getCookie(req, 'refreshToken') || req.body.refreshToken;
    
    if (!token) {
      return sendError(res, 'Refresh token is missing', {}, 401);
    }

    const data = await authService.refresh(token);

    // Rotate refresh token in cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, {
      accessToken: data.accessToken
    }, 'Token refreshed successfully');
  } catch (error) {
    return sendError(res, error.message, {}, 401);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await authService.logout(userId);

    // Clear secure cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth'
    });

    return sendSuccess(res, {}, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  refresh,
  logout
};
