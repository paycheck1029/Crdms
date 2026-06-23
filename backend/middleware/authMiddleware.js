import jwt from 'jsonwebtoken';
import securityConfig from '../config/security.js';
import { hasPermission } from '../config/roles.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is missing'
    });
  }

  jwt.verify(token, securityConfig.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired access token'
      });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };
    next();
  });
};

export const authorize = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!hasPermission(req.user.role, requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.user.role}' does not have permission '${requiredPermission}'`
      });
    }

    next();
  };
};

export default {
  authenticateToken,
  authorize
};
