import express from 'express';
import reportController from '../controllers/reportController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.get('/', authenticateToken, authorize(PERMISSIONS.REPORTS_VIEW), reportController.getReports);

export default router;
