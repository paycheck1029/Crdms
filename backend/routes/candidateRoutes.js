import express from 'express';
import multer from 'multer';
import candidateController from '../controllers/candidateController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { validateCandidate } from '../validators/candidateValidator.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticateToken);

router.get('/', authorize(PERMISSIONS.CANDIDATE_VIEW), candidateController.getCandidates);
router.get('/recycle-bin', authorize(PERMISSIONS.CANDIDATE_DELETE), candidateController.getRecycleBin);
router.get('/:id', authorize(PERMISSIONS.CANDIDATE_VIEW), candidateController.getCandidate);

router.post('/', authorize(PERMISSIONS.CANDIDATE_CREATE), validateCandidate, candidateController.createCandidate);
router.put('/:id', authorize(PERMISSIONS.CANDIDATE_EDIT), validateCandidate, candidateController.updateCandidate);
router.delete('/:id', authorize(PERMISSIONS.CANDIDATE_DELETE), candidateController.softDeleteCandidate);

router.post('/restore/:id', authorize(PERMISSIONS.CANDIDATE_DELETE), candidateController.restoreCandidate);
router.delete('/hard-delete/:id', authorize(PERMISSIONS.CANDIDATE_DELETE), candidateController.hardDeleteCandidate);

router.post('/import', authorize(PERMISSIONS.CANDIDATE_CREATE), excelUpload.single('file'), candidateController.importCandidates);

export default router;
