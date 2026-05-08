import { Router } from "express";
import * as employerMiddleware from '../middleware/employer'
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
import * as employerController from '../controller/employer'
const router = Router();

router.put('/:EmployerID/status', authMiddleware, isEmployer, employerMiddleware.updateStatus, validateRequest, employerController.UpdateStatusEmployer);
router.get('/pending', authMiddleware, isEmployer, employerController.GetPendingEmployers);
router.get('/logo-top-employers', employerController.getLogoTopEmployers);
router.get('/top-employers', authMiddleware, isAdmin, employerController.getTopEmployers);
router.get('/all-employers', authMiddleware, isAdmin, employerController.getAllEmployers);

export default router;
