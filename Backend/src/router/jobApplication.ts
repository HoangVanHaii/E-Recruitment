import { Router } from "express";
import { validateRequest } from "../middleware/validateRequest";
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
import * as jobApplycationMiddleware from '../middleware/jobApplication'
import * as jobApplycationController from '../controller/jobApplication'
const router = Router();

router.post('/', authMiddleware, jobApplycationMiddleware.applyJobValidator, validateRequest, jobApplycationController.ApplyJob);
router.put('/:ApplicationID/status', authMiddleware, jobApplycationMiddleware.updateStatusValidator, validateRequest, jobApplycationController.UpdateApplicationStatus);
router.get('/ofme', authMiddleware, jobApplycationController.getSubmittedApplications);
router.get('/job/:JobID', authMiddleware, isEmployer, jobApplycationMiddleware.JobIDValidator, validateRequest, jobApplycationController.getListApplicationByJobId);
router.get('/stats', authMiddleware, isEmployer, jobApplycationController.getChartStatsController);
router.get('/:ApplicationID', authMiddleware, jobApplycationMiddleware.ApplicationIDValidator, jobApplycationController.getApplicationDetail);


export default router;