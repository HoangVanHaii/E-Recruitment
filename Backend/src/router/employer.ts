import { Router } from "express";
import * as employerMiddleware from '../middleware/employer'
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
import * as employerController from '../controller/employer'
const router = Router();

router.put('/:EmployerID/status', authMiddleware, isEmployer, employerMiddleware.updateStatus, validateRequest, employerController.UpdateStatusEmployer);
router.get('/status', authMiddleware, isEmployer, employerController.GetPendingEmployers);
router.get('/dashboard-stats', authMiddleware, isEmployer, employerController.getDashboardStats);


export default router;
