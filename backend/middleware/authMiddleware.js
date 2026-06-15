import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'crdms_default_secret_key_123456';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Expecting format: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    
    // Set user metadata on request context
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      email: decoded.email
    };
    next();
  });
};

// Middleware to enforce Role-Based Access Control (RBAC)
export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User is not authenticated' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: ${req.user.role} role does not have permission to perform this action`
      });
    }

    next();
  };
};
