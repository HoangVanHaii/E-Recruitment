import { Request, Response, NextFunction } from "express";
import * as JobApplicationService from "../service/jobApplycation";
import redisClient from "../config/redisClient";
import { addJobToQueue } from "../service/cvQueue";

export const ApplyJob = async (req: Request,res: Response, next: NextFunction) => {
    try {
        const { JobID, ResumeID } = req.body;
        const CandidateID = req.user!.id;
        const applicationID = await JobApplicationService.createJobApplication(JobID, CandidateID, ResumeID);
        const keySubmitteds = await redisClient.keys(`application:submitted:candidate:${CandidateID}:*`);
        if (keySubmitteds.length > 0) {
            await redisClient.del(keySubmitteds); 
        }

        const keys = await redisClient.keys(`application:job:${JobID}:*`);
        if (keys.length > 0) {
            await redisClient.unlink(keys);
        }
        addJobToQueue(applicationID, JobID, ResumeID);

        return res.status(201).json({
            success: true,
            message: "Ứng tuyển thành công",
            data: {
                ApplicationID: applicationID
            }
        });

    } catch (error) {
        next(error);
    }
};
export const UpdateApplicationStatus = async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const ApplicationID = Number(req.params.ApplicationID);
        const status = req.body.Status;

        const UserID = req.user!.id;
        if (req.user?.role === "Candidate") {
            await JobApplicationService.updateApplicationStatusCandidate(ApplicationID, UserID, status);
        }
        else{
            await JobApplicationService.updateApplicationStatus(ApplicationID, UserID, status);
        }

        const JobID = JobApplicationService.getJobIdByApplicationId(ApplicationID);

        const keys = await redisClient.keys(`application:job:*`);

        if (keys.length > 0) {
            await redisClient.unlink(keys);
        }
        await redisClient.unlink(`applications:detail:${ApplicationID}`);

        const keySubmitteds = await redisClient.keys(`application:submitted:candidate:${UserID}:*`);
        if (keySubmitteds.length > 0) {
            await redisClient.del(keySubmitteds); 
        }

        return res.status(200).json({
            success: true,
            message: "Cập nhật trạng thái thành công"
        });

    } catch (error) {
        next(error);
    }
};
export const getSubmittedApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const CandidateID = req.user!.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 6; 
        const cacheKey = `application:submitted:candidate:${CandidateID}:page:${page}:limit:${limit}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách đã nộp thành công",
                data: JSON.parse(cachedData)
            });
        }
        const data = await JobApplicationService.getSubmittedApplications(CandidateID, page, limit);
        await redisClient.set(cacheKey, JSON.stringify(data), { EX: 60 * 5 });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách đã nộp thành công",
            data: data
        });

    } catch (error) {
        next(error);
    }
}
export const getListApplicationByJobId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const JobID = Number(req.params.JobID)
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const cacheKey = `application:job:${JobID}:page:${page}:limit:${limit}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách các đơn ứng tuyển (cache)",
                data: JSON.parse(cachedData)
            });
        }
        const data = await JobApplicationService.getApplicationByJobId(JobID, page, limit);
        await redisClient.set(cacheKey, JSON.stringify(data), { EX: 60 * 5 });

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách các đơn ứng tuyển thành công",
            data: data
        });

    } catch (error) {
        next(error);
    }
}
export const getApplicationDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ApplicationID = Number(req.params.ApplicationID)
        const cacheKey = `applications:detail:${ApplicationID}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            // return res.status(200).json({
            //     success: true,
            //     message: "Lấy đơn ứng tuyển thành công (redis)",
            //     data: JSON.parse(cached)
            // });
        }
        const data = await JobApplicationService.getApplicationDetail(ApplicationID);
        await redisClient.set(cacheKey, JSON.stringify(data), { EX: 60 * 5 });
        if (req.user?.role === "Employer") {
            await JobApplicationService.updateApplicationStatus(ApplicationID, req.user.id, 'Reviewed');
        }
        return res.status(200).json({
            success: true,
            message: "Lấy đơn ứng tuyển thành công",
            data: data
        });

    } catch (error) {
        next(error);
    }
}

export const getChartStatsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const type = req.query.type as string || 'week';
        const data = await JobApplicationService.getChartStats(userId, type);
        return res.status(200).json({
            success: true,
            message: "Lấy thống kê ứng tuyển thành công",
            data: data
        });
  
    } catch (err) {
        next(err);
    }
};