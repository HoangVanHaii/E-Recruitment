import express from "express";
import * as jobController from "../controller/job";
import * as searchAiController from "../controller/searchAi";
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import *as jobMiddleware from "../middleware/job";
import { optionalAuth } from "../middleware/optionalAuth";
const router = express.Router();

router.get('/', optionalAuth, jobController.getAllJobs);
router.get('/job-of-me', authMiddleware, isEmployer, jobController.getJobOfMe);
router.get('/recommended', authMiddleware, jobController.getRecommendedJobs);
router.get('/search-ai', searchAiController.searchJobsAI);  
router.get('/job-categories', jobController.getAllCategories);
router.get('/search-by-category/:categoryId', jobController.searchJobByCategory);
router.get('/:id', jobController.getJobDetail)
router.post("/create-job", authMiddleware, isEmployer, jobMiddleware.createJobValidation, validateRequest, jobController.createJob);

router.delete('/soft-delete-job/:id', authMiddleware, isEmployer, jobController.closeJob);
router.put('/update-job/:id', authMiddleware, isEmployer, jobMiddleware.updateJobValidation, validateRequest, jobController.updateJob);

router.put('/admin/change-status-job/:id', authMiddleware, isAdmin, jobMiddleware.changeStatusJobValidation, validateRequest, jobController.changeStatusJob);
router.get('/admin/7-day-stats',authMiddleware, isAdmin, jobController.get7DayStatsForAdmin);
router.get('/admin/monthly-new-candidates', authMiddleware, isAdmin, jobController.getStatsMonthlyForAdmin);
router.get('/admin/top-jobs', authMiddleware, isAdmin, jobController.getJobForAdmin);
router.get('/admin/jobs-by-status', authMiddleware, isAdmin, jobController.getJobForAdminByStatus);
export default router;