import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateLogin } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticateToken, authController.logout);

export default router;
