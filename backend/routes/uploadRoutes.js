import express from 'express';
import multer from 'multer';
import uploadController from '../controllers/uploadController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticateToken);

router.post('/', authorize(PERMISSIONS.CANDIDATE_EDIT), upload.single('resume'), uploadController.uploadCandidateDocument);
router.get('/download/:id', authorize(PERMISSIONS.CANDIDATE_VIEW), uploadController.downloadDocument);
router.delete('/:id', authorize(PERMISSIONS.CANDIDATE_EDIT), uploadController.deleteDocument);

export default router;
