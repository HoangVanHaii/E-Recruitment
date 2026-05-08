import { Request, Response, NextFunction } from "express";
import * as candidateService from '../service/candidate';
import { AppError } from "../utils/appError";
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import * as resumeService from '../service/resume';

export const upsertProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        let avatarUrl = req.body.AvatarUrl; 

        if (req.file) {
            const uploaded = await uploadToCloudinary('Candidates', req.file as Express.Multer.File);
            avatarUrl = uploaded.url;
        }

        const profileData = {
            ...req.body,
            CandidateID: userId,
            AvatarUrl: avatarUrl 
        };

        await candidateService.upsertCandidateProfile(profileData);

        return res.status(200).json({ 
            success: true,
            message: "Cập nhật thông tin cơ bản ứng viên thành công!",
            data: profileData
        });

    } catch (error) {
        next(error);
    }
};

export const updateMasterProfileDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const detailData = req.body; 

        const updatedDetail = await candidateService.upsertCandidateDetailMongo(userId, detailData);

        return res.status(200).json({
            success: true,
            message: "Cập nhật Hồ sơ chi tiết thành công!",
            data: updatedDetail
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const profile = await candidateService.getCandidateProfile(userId);
        if (!profile) {
            throw new AppError("Không tìm thấy thông tin hồ sơ ứng viên!", 404);
        }
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin hồ sơ thành công",
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

export const getSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const profile = await candidateService.getCandidateSkills(userId);
        if (!profile) {
            throw new AppError("Không tìm thấy kỹ năng hồ sơ ứng viên!", 404);
        }
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin kỹ năng hồ sơ thành công",
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

export const analyzeSkillsText = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rawText } = req.body; 
        const finalSkills = await candidateService.analyzeTextWithAI(rawText);

        return res.status(200).json({
            success: true,
            message: "Phân tích kỹ năng thành công!",
            data: finalSkills 
        });
    } catch (error: any) {
        if (error.message === "AI_PARSE_ERROR") {
            next(new AppError("Hệ thống AI đang quá tải không thể phân tích, vui lòng thử lại sau!", 500));
        } else {
            next(error);
        }
    }
};

export const saveAnalyzedSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id; 
        const { skills } = req.body; 

        await candidateService.saveSkillsTransaction(userId, skills);
        return res.status(200).json({
            success: true,
            message: "Cập nhật hồ sơ kỹ năng thành công!"
        });
    } catch (error) {
        next(error);
    }
};

export const getCandidatesForEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidates = await candidateService.getCandidatesListForEmployer();
        
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách ứng viên thành công!",
            data: candidates
        });
    } catch (error) {
        next(error);
    }
};

export const getCandidateDetailForEmployer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = parseInt(req.params.id as string);
        if (isNaN(candidateId)) {
            throw new AppError("Mã ứng viên không hợp lệ!", 400);
        }

        const profile = await candidateService.getCandidateProfile(candidateId);
        if (!profile) {
            throw new AppError("Không tìm thấy thông tin ứng viên này!", 404);
        }

        const skills = await candidateService.getCandidateSkills(candidateId);

        const resumes = await resumeService.getCandidateResumes(candidateId);

        return res.status(200).json({
            success: true,
            message: "Lấy full thông tin ứng viên thành công!",
            data: {
                profile: profile,
                skills: skills || [],
                resumes: resumes || [] 
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAllCandidates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const candidates = await candidateService.getAllCandidates(page, limit);
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách ứng viên thành công!",
            data: candidates
        })
    }
    catch (error) {
        next(error);
    }
}