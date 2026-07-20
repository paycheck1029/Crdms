import express from 'express';
import jobController from '../controllers/jobController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

// Public access endpoint for PHP portal (no authentication required)
router.get('/public', jobController.getPublicJobs);

// Private dashboard endpoints (JWT required)
router.use(authenticateToken);

router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.post('/', jobController.createJob);
router.delete('/:id', jobController.deleteJob);

// Super Admin approval endpoints
router.put('/:id/approve', authorize(PERMISSIONS.USERS_CREATE), jobController.approveJob);
router.put('/:id/reject', authorize(PERMISSIONS.USERS_CREATE), jobController.rejectJob);

export default router;
