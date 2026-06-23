import dotenv from 'dotenv';
dotenv.config();

const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'crdms_default_secret_key_123456',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'crdms_refresh_secret_key_7891011',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m', // Short-lived access token
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d', // Long-lived refresh token
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  accountLockDurationMinutes: parseInt(process.env.ACCOUNT_LOCK_DURATION_MINUTES || '15', 10),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10)
};

export default securityConfig;
