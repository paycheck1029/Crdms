import express from 'express';
import auditController from '../controllers/auditController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get('/', authenticateToken, authorize(PERMISSIONS.SETTINGS_READ), auditController.getActivityLogs);

export default router;
