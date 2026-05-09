import { Router } from "express";
import * as resumeController from "../controller/resume";
import { authMiddleware, isCandidate, isEmployer } from "../middleware/auth";
import * as resumeMiddleware from '../middleware/resume';
import { validateRequest } from '../middleware/validateRequest';
import { upload } from "../utils/upload";
import { upsertProfileValidation } from "../middleware/candidate";

const router = Router();

router.post("/generate-summary", authMiddleware, resumeMiddleware.generateSummaryValidation, validateRequest, resumeController.generateSummaryWithAI);
router.post("/build", authMiddleware, isCandidate, upload.single("AvatarUrl"), upsertProfileValidation, resumeMiddleware.buildResumeValidation, validateRequest, resumeController.createManualResume);
router.get('/of-me', authMiddleware, resumeController.getListResumes);
router.get("/", authMiddleware, resumeController.getMyResumes);

router.get("/detail/:resumeId", authMiddleware, resumeMiddleware.ResumeIdValidation, validateRequest, resumeController.getResumeDetail);
router.put("/:resumeId", authMiddleware, resumeMiddleware.ResumeIdValidation, resumeMiddleware.buildResumeValidation, validateRequest, resumeController.updateManualResume);
router.delete("/:resumeId", authMiddleware, resumeMiddleware.ResumeIdValidation, validateRequest, resumeController.deleteResume);

router.get("/employer/:resumeId", authMiddleware, isEmployer, resumeMiddleware.ResumeIdValidation, validateRequest, resumeController.getResumeDetailByEmployer);

export default router;