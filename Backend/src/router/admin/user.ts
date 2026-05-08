import *as userAdminController from '../../controller/admin/user';
import express from 'express';
import { authMiddleware, isAdmin } from '../../middleware/auth';
const router = express.Router();

router.get('/users', authMiddleware, isAdmin, userAdminController.getAllUsers);
router.put('/users/:id/status', authMiddleware, userAdminController.updateStatus);

export default router;