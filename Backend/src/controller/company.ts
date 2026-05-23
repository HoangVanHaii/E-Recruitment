import { Response, Request, NextFunction } from 'express'
import * as CompanyService from '../service/company'
import { ICreateCompany, IUpdateCompany } from '../interface/company';
import { createEmployer } from '../service/employer';
import { IEmployer } from '../interface/employer';
import pool from "../config/database";
import { AppError } from '../utils/appError';
import redisClient from '../config/redisClient';

export const CreateCompany = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    const uploadedAssets: string[] = [];

    try {
        await connection.beginTransaction();
        const { CompanyName, CompanyDescription, TaxCode, Industry, Website, ContactEmail, City, Position } = req.body;

        const companyData: ICreateCompany = { CompanyName, CompanyDescription, TaxCode, Industry, Website, ContactEmail, City, CreatedBy: Number(req.user?.id), BusinessLicenseUrl: '' as any };

        if (req.files) {
            const uploaded = await CompanyService.handleCompanyUploads(req.files as any);
            uploadedAssets.push(...uploaded.publicIds);
            Object.assign(companyData, uploaded.data);
        }

        companyData.CreatedBy = req.user!.id;
        const CompanyID = await CompanyService.CreateCompany(connection, companyData);
        const EmployerID = await createEmployer(connection, { EmployerID: req.user!.id, CompanyID: CompanyID, Position: Position, ApprovalStatus: "Approved" } as IEmployer);

        await connection.commit();
        const cacheKeyAll = `company:role:${req.user?.role || "Candidate"}:all`;
        await redisClient.unlink(cacheKeyAll);

        return res.status(201).json({
            success: true,
            message: "Tạo Công ty thành công",
            data: {
                CompanyID,
                EmployerID
            }
        });

    } catch (error) {
        await connection.rollback();
        await CompanyService.cleanupCloudinary(uploadedAssets);
        next(error);
    }
    finally {
        connection.release();
    }
}
export const getCompanyOfMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // await CompanyService.checkEmployer(req.user!.id);
        const data = await CompanyService.getCompanyOfMe(req.user!.id);
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin công ty của bạn thành công",
            data: data
        });

    } catch (error) {
        next(error);
    }
}
export const UpdateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyData: IUpdateCompany = req.body;
        const CompanyId: number = Number(req.params.CompanyID);
        await CompanyService.checkEmployer(req.user!.id);
        if (req.files) {
            const uploaded = await CompanyService.handleCompanyUploads(req.files as Express.Multer.File[]);
            Object.assign(companyData, uploaded.data)
        }
        await CompanyService.UpdateCompany(CompanyId, companyData);

        const cacheKey = `company:role:${req.user?.role || "Candidate"}:${CompanyId}`;
        await redisClient.unlink(cacheKey);

        const cacheKeyAll = `company:role:${req.user?.role || "Candidate"}:all`;
        await redisClient.unlink(cacheKeyAll);

        const cacheKeyOfMe = `company-ofme:role:${req.user?.role || "Candidate"}:${CompanyId}`;
        await redisClient.unlink(cacheKeyOfMe);
        return res.status(200).json({
            success: true,
            message: "Cập nhật thông tin công ty thành công",
        });

    } catch (error) {
        next(error);
    }
}

export const UpdateCompanyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const CompanyId: number = Number(req.params.CompanyID);
        const { status } = req.body;
        await CompanyService.checkEmployer(req.user!.id);

        await CompanyService.UpdateCompanyStatus(CompanyId, status.toString());

        const cacheKey = `company:role:${req.user?.role || "Candidate"}:${CompanyId}`;
        await redisClient.unlink(cacheKey);

        const cacheKeyAll = `company:role:${req.user?.role || "Candidate"}:all`;
        await redisClient.unlink(cacheKeyAll);

        const cacheKeyOfMe = `company-ofme:role:${req.user?.role || "Candidate"}:${CompanyId}`;
        await redisClient.unlink(cacheKeyOfMe);

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái công ty thành công",
        });

    } catch (error) {
        next(error);
    }
}
export const RequestCompany = async (req: Request, res: Response, next: NextFunction) => {
    const connection = await pool.getConnection();
    try {
        const CompanyID: number = Number(req.params.CompanyID);
        const Position: string = req.body.Position;
        const employer: IEmployer = { EmployerID: req.user!.id, CompanyID, Position, ApprovalStatus: "Pending" };
        const companyExist = await CompanyService.CheckCompanyId(employer.CompanyID);
        if (!companyExist) {
            throw new AppError("Công ty không tồn tại", 404);
        }
        const EmployerID = await createEmployer(connection, employer)
        return res.status(201).json({
            success: true,
            message: "Gửi yêu cầu vào công ty thành công",
            data: EmployerID
        })
    } catch (error) {
        next(error);
    }
    finally {
        connection.release();
    }
}
export const GetCompanyDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const CompanyId: number = Number(req.params.CompanyID);
        const role = req.user?.role || "Candidate";
        const cacheKey = `company:role:${role}:${CompanyId}`;
        if (role === "Employer") {
            await CompanyService.checkEmployer(req.user!.id);
        }
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy thông tin công ty thành công (từ cache)",
                data: JSON.parse(cachedData)
            });
        }
        const company = await CompanyService.GetCompanyDetail(role, CompanyId);
        await redisClient.set(cacheKey, JSON.stringify(company), { EX: 300 });
        
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin công ty thành công",
            data: company
        });

    } catch (error) {
        next(error);
    }
}
export const GetCompanyDetailOfMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await CompanyService.checkEmployer(req.user!.id);
        const CompanyId = await CompanyService.getCompanyIdOfMe(req.user!.id);
        if (CompanyId === null) {
            throw new AppError("Bạn không thuộc công ty nào", 403);
        }
        const cacheKey = `company-ofme:role:${req.user?.role || "Candidate"}:${CompanyId}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy thông tin công ty của bạn thành công (từ cache)",
                data: JSON.parse(cachedData)
            });
        }
        const role = req.user?.role || "Candidate";
        const company = await CompanyService.GetCompanyDetail(role, CompanyId);
        await redisClient.set(cacheKey, JSON.stringify(company), { EX: 300 });
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin công ty của bạn thành công",
            data: company
        });

    } catch (error) {
        next(error);
    }
}

export const GetAllCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = req.user?.role || "Candidate";
        const cacheKey = `company:role:${role}:all`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách công ty thành công (từ cache)",
                data: JSON.parse(cachedData)
            });
        }
        const companies = await CompanyService.GetAllCompany(role);

        await redisClient.set(cacheKey, JSON.stringify(companies), { EX: 300 });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách công ty thành công",
            data: companies
        });

    } catch (error) {
        next(error);
    }
}

export const getAllCompanyForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const data = await CompanyService.getAllCompanyForAdmin(page, limit);
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách công ty cho admin thành công",
            data: data
        });
    } catch (error) {
        next(error);
    }   
}
export const getCompanyByIdForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId: number = Number(req.params.CompanyID);
        const cacheKey = `company:admin:${companyId}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy thông tin công ty cho admin thành công (từ cache)",
                data: JSON.parse(cachedData)
            });
        }
        const company = await CompanyService.getCompanyDetailForAdmin(companyId);
        await redisClient.set(cacheKey, JSON.stringify(company), { EX: 300 });
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin công ty cho admin thành công",
            data: company
        });

    } catch (error) {
        next(error);
    }
}
export const updateCompanyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId: number = Number(req.params.CompanyID);
        const { status } = req.body;
        await CompanyService.updateCompanyStatusForAdmin(companyId, status.toString());

        const cacheKey = `company:admin:${companyId}`;
        await redisClient.unlink(cacheKey);
        
        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái công ty cho admin thành công",
        });
    } catch (error) {
        next(error);
    }
}