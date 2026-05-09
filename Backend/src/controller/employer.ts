import { Request, Response, NextFunction } from "express";
import *as employerService from "../service/employer";

export const UpdateStatusEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const EmployerID: number = Number(req.params.EmployerID);
        const ApprovalStatus = req.body.ApprovalStatus;
        await employerService.UpdateStatusEmployer(EmployerID, req.user!.id, ApprovalStatus);
        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái nhân viên thành công"
        })
    } catch (error) {
        next(error);
    }
}
export const getPendingEmployers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as string || "all";
        const data = await employerService.getPendingEmployers(req.user!.id, status);
        res.json({
            success: true,
            message: "Lấy danh sách yêu cầu nhân viên thành công",
            data
        });
    } catch (error) {
        next(error);
    }
};
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await employerService.getDashboardStats(req.user!.id);
        res.json({
            success: true,
            message: "Lấy thống kê dashboard thành công",
            data: stats 
          });
    } catch (error) {
        next(error);
    }
}
export const getTopEmployers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const employers = await employerService.getTopEmployers();
        res.json({
            success: true,
            message: "Lấy danh sách nhà tuyển dụng hàng đầu thành công",
            data: employers
        });
    } catch (error) {
        next(error);
    }
}
export const getLogoTopEmployers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logos = await employerService.getLogoTopEmployers();
        res.json({
            success: true,
            message: "Lấy danh sách logo nhà tuyển dụng hàng đầu thành công",
            data: logos
        });
    } catch (error) {
        next(error);
    }
}
export const getAllEmployers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const employers = await employerService.getAllEmployers(page, limit);
        res.json({
            success: true,
            message: "Lấy danh sách nhà tuyển dụng thành công",
            data: employers
        });
    } catch (error) {
        next(error);
    }
};
