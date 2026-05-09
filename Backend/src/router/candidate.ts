import express from 'express';
import * as candidateController from '../controller/candidate';
import { authMiddleware, isEmployer, isAdmin } from "../middleware/auth";
import { upload } from "../utils/upload";
import * as candidateMiddleware from '../middleware/candidate';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

// SQL Profile
router.get('/profile', authMiddleware, candidateController.getProfile); 
router.get('/info', authMiddleware, candidateController.getCandidateInfo); 

router.post('/profile', authMiddleware, upload.single('AvatarUrl'), candidateMiddleware.upsertProfileValidation, validateRequest, candidateController.upsertProfile);

// Mongo Master Profile 
router.put('/profile-detail', authMiddleware, candidateMiddleware.updateMasterProfileValidation, validateRequest, candidateController.updateMasterProfileDetail);

// Skills AI
router.get('/skills', authMiddleware, candidateController.getSkills);
router.post('/skills/analyze-text', authMiddleware, candidateMiddleware.analyzeSkillsTextValidation, validateRequest, candidateController.analyzeSkillsText);
router.post('/skills', authMiddleware, candidateMiddleware.saveAnalyzedSkillsValidation, validateRequest, candidateController.saveAnalyzedSkills);

// Employer
router.get('/employer/list', authMiddleware, isEmployer, candidateMiddleware.getCandidatesListValidation, validateRequest, candidateController.getCandidatesForEmployer);
router.get('/employer/detail/:id', authMiddleware, isEmployer, candidateMiddleware.getCandidateDetailValidation, validateRequest, candidateController.getCandidateDetailForEmployer);

router.get('/admin/all-candidates', authMiddleware, isAdmin, candidateController.getAllCandidates);
export default router;
