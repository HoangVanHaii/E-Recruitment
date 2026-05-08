import express from 'express';
import * as candidateController from '../controller/candidate';
const router = express.Router();
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
import { upload } from "../utils/upload";
import * as candidateMiddleware from '../middleware/candidate';
import { validateRequest } from '../middleware/validateRequest';

router.get('/profile', authMiddleware, candidateController.getProfile); 
router.post('/profile', authMiddleware, upload.single('AvatarUrl'),candidateMiddleware.upsertProfileValidation,validateRequest, candidateController.upsertProfile);
router.get('/skills', authMiddleware, candidateController.getSkills);
router.post('/skills/analyze-text', authMiddleware,candidateMiddleware.analyzeSkillsTextValidation,validateRequest, candidateController.analyzeSkillsText);
router.post('/skills', authMiddleware,candidateMiddleware.saveAnalyzedSkillsValidation,validateRequest, candidateController.saveAnalyzedSkills);
router.get('/employer/list', authMiddleware, isEmployer, candidateMiddleware.getCandidatesListValidation, validateRequest, candidateController.getCandidatesForEmployer);
router.get('/employer/detail/:id', authMiddleware, isEmployer, candidateMiddleware.getCandidateDetailValidation, validateRequest, candidateController.getCandidateDetailForEmployer);

router.get('/admin/all-candidates', authMiddleware, isAdmin, candidateController.getAllCandidates);
export default router;