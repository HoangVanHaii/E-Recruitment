import { Router } from "express";
import * as companyController from '../controller/company'
import * as companyMiddleware from '../middleware/company'
import { validateRequest } from "../middleware/validateRequest";
import { upload } from "../utils/upload";
import { authMiddleware, isAdmin, isEmployer } from "../middleware/auth";
const router = Router();

router.post('/', authMiddleware, isEmployer, upload.any(), companyMiddleware.CreateCompanyValidation, validateRequest, companyController.CreateCompany)
router.post('/:CompanyID/request', authMiddleware, companyMiddleware.RequestCompanyValidation, validateRequest, companyController.RequestCompany);
router.put('/:CompanyID', authMiddleware, isEmployer, upload.any(), companyMiddleware.UpdateCompanyValidation, validateRequest, companyController.UpdateCompany);
router.get('/Detail/ofme', authMiddleware, companyController.GetCompanyDetailOfMe);
router.get('/me', authMiddleware, isEmployer, companyController.getCompanyOfMe);
router.get('/:CompanyID', authMiddleware, companyMiddleware.CompanyIdValidation, validateRequest, companyController.GetCompanyDetail);
router.get('/', authMiddleware, companyController.GetAllCompany);

router.get('/admin/all', authMiddleware, isAdmin, companyController.getAllCompanyForAdmin);
router.get('/admin/:CompanyID', authMiddleware, isAdmin, companyMiddleware.CompanyIdValidation, validateRequest, companyController.getCompanyByIdForAdmin);
router.put('/admin/:CompanyID/status', authMiddleware, isAdmin, companyMiddleware.UpdateCompanyStatusValidation, validateRequest, companyController.updateCompanyStatus);

export default router;