import express from 'express';
import userController from '../controllers/userController.js';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import { validateUserCreate, validateUserUpdate } from '../validators/userValidator.js';
import { PERMISSIONS } from '../config/roles.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize(PERMISSIONS.USERS_CREATE)); // Enforce Admin users permissions for all User endpoints

router.get('/', userController.getUsers);
router.post('/', validateUserCreate, userController.createUser);
router.put('/:id', validateUserUpdate, userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
