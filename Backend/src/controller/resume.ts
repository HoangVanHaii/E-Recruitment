import { Request, Response, NextFunction } from "express";
import * as resumeService from '../service/resume';
import { AppError } from "../utils/appError";
import { iResumeDetail } from '../interface/resume'
import redisClient from '../config/redisClient';
import { RecommendJobsByAI } from "../service/searchAi";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { Candidate } from "../interface/candidate";

export const generateSummaryWithAI = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resumeData = req.body;
        const generatedText = await resumeService.generateResumeSummary(resumeData);

        if (!generatedText) {
            throw new AppError("Hệ thống AI đang quá tải, sếp chịu khó tự gõ tóm tắt nhé!", 500);
        }

        return res.status(200).json({
            success: true,
            message: "AI đã viết xong tóm tắt cực mượt!",
            data: generatedText
        });
    } catch (error) {
        console.log("Lỗi khi gọi AI:", error);
        next(error);
    }
};

export const createManualResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;
        const resumeData: iResumeDetail = req.body;
        if (req.file) {
            const uploaded = await uploadToCloudinary("Resumes", req.file as Express.Multer.File);
            resumeData.AvatarUrl = uploaded.url;
        } else if (req.body.ExistingAvatarUrl) {
            resumeData.AvatarUrl = req.body.ExistingAvatarUrl;
        } else {
            return res.status(400).json({ 
                success: false, 
                message: "Vui lòng cung cấp ảnh đại diện cho CV!" 
            });
        }

        const { FullName, Phone, DateOfBirth, Address } = req.body;
        const candidateProfile: Candidate = {
            CandidateID: candidateId,
            FullName,
            Phone,
            DateOfBirth,
            Address,
            AvatarUrl: resumeData.AvatarUrl
        };
        const result = await resumeService.buildManualResume(candidateId, resumeData, candidateProfile);
        if (redisClient) {
            await redisClient.del(`resumes:list:${candidateId}`);
            await redisClient.del('all_skills');
        }

        // const resumeDetail = await resumeService.getResumeDetail(result.resumeId, candidateId);
        // if (resumeDetail) {
        //     RecommendJobsByAI(resumeDetail)
        //         .then(() => console.log("Đã gợi ý job xong cho CV mới của candidate:", candidateId))
        //         .catch(err => console.error("Lỗi khi đề xuất việc làm lúc tạo mới:", err));
        // }

        return res.status(201).json({
            success: true,
            message: "Tạo CV và đồng bộ Profile Kỹ năng thành công mỹ mãn!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const getMyResumes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;
        
        if (redisClient) {
            const cachedResumes = await redisClient.get(`resumes:list:${candidateId}`);
            if (cachedResumes) {
                return res.status(200).json({
                    success: true,
                    message: "Lấy danh sách CV từ Redis cực mượt!",
                    data: JSON.parse(cachedResumes)
                });
            }
        }
        
        const resumes = await resumeService.getCandidateResumes(candidateId);

        if (redisClient && resumes.length > 0) {
            await redisClient.setEx(`resumes:list:${candidateId}`, 3600, JSON.stringify(resumes));
        }

        return res.status(200).json({
            success: true,
            data: resumes
        });
    } catch (error) {
        next(error);
    }
};

export const getResumeDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;
        const resumeId = parseInt(req.params.resumeId as string);

        const detail = await resumeService.getResumeDetail(resumeId, candidateId);
        
        if (!detail) {
            throw new AppError("Không tìm thấy CV này hoặc sếp không có quyền xem!", 404);
        }

        return res.status(200).json({
            success: true,
            data: detail
        });
    } catch (error) {
        next(error);
    }
};

export const updateManualResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;
        const resumeId = parseInt(req.params.resumeId as string);
        
        const resumeData: iResumeDetail = req.body;

        const result = await resumeService.updateManualResume(candidateId, resumeId, resumeData);
        
        if (!result) {
            throw new AppError("Không tìm thấy CV này hoặc sếp không có quyền chỉnh sửa!", 404);
        }

        if (redisClient) {
            await redisClient.del(`resumes:list:${candidateId}`);
            await redisClient.del('all_skills');
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật CV thành công rực rỡ!",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const deleteResume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;
        const resumeId = parseInt(req.params.resumeId as string);

        const isDeleted = await resumeService.deleteResume(resumeId, candidateId);
        
        if (!isDeleted) {
            throw new AppError("Không tìm thấy CV để xóa hoặc sếp không có quyền!", 404);
        }

        if (redisClient) {
            await redisClient.del(`resumes:list:${candidateId}`);
        }

        return res.status(200).json({
            success: true,
            message: "Đã xóa CV thành công!"
        });
    } catch (error) {
        next(error);
    }
};

export const getResumeDetailByEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resumeId = parseInt(req.params.resumeId as string);

        const detail = await resumeService.getResumeForEmployer(resumeId);
        
        if (!detail) {
            throw new AppError("Không tìm thấy CV này hoặc ứng viên đã xóa!", 404);
        }
        
        return res.status(200).json({
            success: true,
            message: "HR lấy chi tiết CV thành công!",
            data: detail
        });
    } catch (error) {
        next(error);
    }
};
export const getListResumes = async (req: Request, res: Response, next: NextFunction) => {  
    try {
        const candidateId = req.user!.id;
        const resumes = await resumeService.getListResume(candidateId);
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách CV thành công!",
            data: resumes
        });
    } catch (error) {
        next(error);
    }
}