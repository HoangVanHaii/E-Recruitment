import { Request, Response, NextFunction } from "express";
import * as jobSkillService from '../service/jobSkill';

export const getJobSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = parseInt(req.params.jobId as string);

        const skills = await jobSkillService.getSkillsByJobId(jobId);
        
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách kỹ năng của Job thành công!",
            data: skills
        });
    } catch (error) {
        next(error);
    }
};

export const syncJobSkills = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = parseInt(req.params.jobId as string);
        const { skillIds } = req.body; 

        await jobSkillService.syncJobSkills(jobId, skillIds);

        return res.status(200).json({
            success: true,
            message: "Cập nhật kỹ năng cho bài đăng thành công!"
        });
    } catch (error) {
        next(error);
    }
};

export const removeJobSkill = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = parseInt(req.params.jobId as string);
        const skillId = parseInt(req.params.skillId as string);

        await jobSkillService.removeSkillFromJob(jobId, skillId);

        return res.status(200).json({
            success: true,
            message: "Đã xóa kỹ năng khỏi Job!"
        });
    } catch (error) {
        next(error);
    }
};