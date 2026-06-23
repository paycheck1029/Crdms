import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import securityConfig from '../config/security.js';
import { logAuth, logError } from './loggerService.js';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, email: user.email },
    securityConfig.jwtSecret,
    { expiresIn: securityConfig.accessTokenExpiry }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    securityConfig.jwtRefreshSecret,
    { expiresIn: securityConfig.refreshTokenExpiry }
  );
};

export const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    logAuth('Failed login attempt: Email not found', { email });
    throw new Error('Invalid email or password');
  }

  // Check lockout status
  if (user.locked_until && new Date() < new Date(user.locked_until)) {
    const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / (60 * 1000));
    logAuth('Locked account login attempt', { username: user.username, email });
    throw new Error(`Account is temporarily locked. Try again in ${minutesLeft} minutes.`);
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    // Increment attempts
    await userRepository.incrementLoginAttempts(user.id);
    const updatedUser = await userRepository.findById(user.id);
    
    if (updatedUser.login_attempts >= securityConfig.maxLoginAttempts) {
      await userRepository.lockAccount(user.id, securityConfig.accountLockDurationMinutes);
      logAuth('Account locked due to excessive login failures', { username: user.username, email });
      throw new Error(`Account locked for ${securityConfig.accountLockDurationMinutes} minutes due to excessive login failures.`);
    }

    logAuth('Failed login attempt: Invalid password', { username: user.username, email });
    throw new Error('Invalid email or password');
  }

  // Successful login, reset lock attempts
  await userRepository.resetLoginAttempts(user.id);

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to db
  await userRepository.updateRefreshToken(user.id, refreshToken);

  logAuth('Successful login', { username: user.username, email, role: user.role });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
};

export const refresh = async (token) => {
  if (!token) {
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(token, securityConfig.jwtRefreshSecret);
    const user = await userRepository.findByRefreshToken(token);

    if (!user || user.id !== decoded.id) {
      logAuth('Invalid refresh token reuse detected', { tokenId: decoded.id });
      throw new Error('Invalid refresh token');
    }

    // Lockout check
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      throw new Error('Account is locked');
    }

    // Refresh Token Rotation (RTR): Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Save new refresh token in DB
    await userRepository.updateRefreshToken(user.id, newRefreshToken);

    logAuth('Token refreshed successfully', { username: user.username });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    logError(new Error(`Token refresh failed: ${error.message}`));
    throw new Error('Invalid or expired refresh token');
  }
};

export const logout = async (userId) => {
  const user = await userRepository.findById(userId);
  if (user) {
    await userRepository.updateRefreshToken(userId, null);
    logAuth('User logged out', { username: user.username });
  }
  return { success: true };
};

export default {
  login,
  refresh,
  logout,
  generateAccessToken,
  generateRefreshToken
};
