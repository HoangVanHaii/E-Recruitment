import e, { Request, Response, NextFunction } from "express";
import *as jobService from "../service/job";
import *as employerService from "../service/employer";
import redisClient from "../config/redisClient";
import { IJobPayload, IJobDetailPayload, IJobFilters } from "../interface/job";
import { AppError } from "../utils/appError";
import { getMonthlyNewCandidates, get7DayCandidateStats } from "../service/candidate";

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters: IJobFilters = {
            Page: parseInt(req.query.page as string) || 1,
            Limit: parseInt(req.query.limit as string) || 10,
            CategoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
            Location: req.query.location as string,
            MinSalary: req.query.minSalary ? parseInt(req.query.minSalary as string) : undefined,
            MaxSalary: req.query.maxSalary ? parseInt(req.query.maxSalary as string) : undefined,
        };
        // console.log("Received filters:", filters);
        const cacheKey = `jobs_list:p${filters.Page}:l${filters.Limit}:c${filters.CategoryId || 'all'}:loc_${filters.Location || 'all'}:min${filters.MinSalary || 'all'}:max${filters.MaxSalary || 'all'}`;
        const cachedJobs = await redisClient.get(cacheKey);
        if (cachedJobs) {
            console.log("Lấy dữ liệu từ Redis cache   ");
            return res.status(200).json({
                success: true,
                message: "Lấy tất cả job thành công",
                data: JSON.parse(cachedJobs)
            });
        }
        const jobs = await jobService.getAllJobs(filters);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(jobs));
        res.status(200).json({
            success: true,
            message: "Lấy tất cả job thành công",
            data: jobs
        });
    } catch (error) {
        next(error);
    }
}
export const getRecommendedJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidateId = req.user!.id;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const jobs = await jobService.getRecommendedJobs(
            candidateId,
            page,
            limit
        );

        return res.json({
            success: true,
            message: "Lấy danh sách công việc được đề xuất thành công",
            data: jobs
        });

    } catch (error) {
        next(error);
    }
};
export const getJobDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = Number(req.params.id);
        const cacheKey = `job_detail:${jobId}`;
        const cachedJobDetail = await redisClient.get(cacheKey);
        if (cachedJobDetail) {
            console.log("Lấy dữ liệu chi tiết công việc từ Redis cache");
            await jobService.incrementJobViews(jobId, req.user?.id, req.ip);
            return res.status(200).json({
                success: true,
                message: "Lấy chi tiết công việc thành công",
                data: JSON.parse(cachedJobDetail)
            });
        }
        const jobDetail = await jobService.getJobDetail(jobId);
        if (!jobDetail) {
            throw new AppError("Không tìm thấy công việc", 404);
        }
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(jobDetail));
        await jobService.incrementJobViews(jobId, req.user?.id, req.ip);
        
        res.status(200).json({
            success: true,
            message: "Lấy công việc chi tiết thành công",
            data: jobDetail
        });
    } catch (error) {
        next(error);
    }
}

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { categoryId, title, quantity, salaryMin, salaryMax, location, jobType, experienceRequired, expiredDate,
            description, requirements, workingSchedule, benefits, tags, interviewProcess
        } = req.body;

        const employerID = Number(req.user!.id);
        const employerProfile = await employerService.checkEmployerProfile(employerID);
        await employerService.CheckCompanyStatus(employerID);

        if (!employerProfile) {
            throw new AppError('Vui lòng tạo hồ sơ nhà tuyển dụng trước khi đăng tuyển', 400)
        }
        if (employerProfile.ApprovalStatus !== "Approved") {
            throw new AppError('Hồ sơ nhà tuyển dụng của bạn đang chờ duyệt hoặc đã bị từ chối', 403);
        }

        const jobPayload: IJobPayload = {
            EmployerID: employerID,
            CategoryID: categoryId,
            Title: title,
            Quantity: quantity || 1,
            SalaryMin: salaryMin,
            SalaryMax: salaryMax,
            Location: location,
            JobType: jobType,
            ExperienceRequired: experienceRequired,
            ExpiredDate:  expiredDate.split('T')[0]
        }
        const rawTextForAi = `
            ${title}
            Location: ${location}
            Type: ${jobType}
            Experience: ${experienceRequired} years

            Skills: ${tags.join(", ")}

            Description:
            ${description}

            Requirements:
            ${requirements}
        `.replace(/\s+/g, ' ').trim();
        const jobDetailPayload: IJobDetailPayload = {
            Description: description,
            Requirements: requirements,
            WorkingSchedule: workingSchedule,
            Benefits: benefits,
            Tags: tags,
            InterviewProcess: interviewProcess,
            RawTextForAi: rawTextForAi
        };

        const jobId = await jobService.createJob(jobPayload, jobDetailPayload);

        await clearJobCaches(employerID);
        jobService.processJobVector(jobId, jobPayload, jobDetailPayload, jobDetailPayload.RawTextForAi).catch(err => {
            console.error(`[AI-BACKGROUND] Lỗi khi nạp Vector cho Job ID: ${jobId}`, err);
        });
        res.status(201).json({ 
            success: true,
            message: "Tạo công việc thành công",
            data: jobId
        });
        

    } catch (error) {
        next(error);
    }
}
export const closeJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const employerId = parseInt(req.user!.id.toString());
        const jobId = Number(req.params.id);
        console.log(`Đang xử lý yêu cầu đóng công việc. EmployerID: ${employerId}, JobID: ${jobId}`);
        const isOwner = await jobService.isJobOwner(employerId, jobId);
        if (!isOwner) {
            throw new AppError('Bạn không phải người tạo là công việc này', 403)
        }
        await jobService.closeJob(jobId);
        
        const cacheKey = `job_detail:${jobId}`;
        await redisClient.del(cacheKey);

        await clearJobCaches(employerId);
        res.status(200).json({
            success: true,
            message: "Ẩn khỏi danh sách thành công"
        });
    } catch (error) {
        next(error);
    }
}
export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = Number(req.params.id);
        const employerId = parseInt(req.user!.id.toString());
        const isOwner = await jobService.isJobOwner(employerId, jobId);
        if (!isOwner) {
            throw new AppError('Bạn không phải là người tạo là công việc này', 403)
        }
        const isPending = await jobService.isJobPending(jobId);
        if (!isPending) {
            throw new AppError('Chỉ được phép chỉnh sửa công việc đang ở trạng thái chờ duyệt', 400)
        }
        const { title, location, salaryMin, salaryMax, jobType, quantity, description, workingSchedule, requirements, benefits, tags, interviewProcess } = req.body;

        const updatePayload = {
            JobId:jobId,
            Title: title,
            Location: location,
            SalaryMin: salaryMin,
            SalaryMax: salaryMax,
            JobType: jobType,
            Quantity: quantity,
            Description: description,
            WorkingSchedule: workingSchedule,
            Requirements: requirements,
            Benefits: benefits,
            Tags: tags,
            InterviewProcess: interviewProcess
        } ;

        await jobService.updateJob(updatePayload);
        const cacheKey = `job_detail:${jobId}`;
        await redisClient.del(cacheKey);
        await clearJobCaches(employerId);

        res.status(200).json({
            success: true,
            message: "Cập nhật công việc thành công",
            data: jobId
        });

    } catch (error) {
        next(error);
    }
}

export const getJobOfMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string || "All";
        const employerID = req.user!.id;
        await clearJobCaches(employerID);
        const cacheKey = `employer_jobs_list:u${employerID}:p${page}:l${limit}:s${status}`;

        const cachedJobs = await redisClient.get(cacheKey);
        if (cachedJobs) {
            console.log("Lấy dữ liệu từ Redis cache");
            return res.status(200).json({
                success: true,
                message: "Lấy công việc của bạn thành công",
                data: JSON.parse(cachedJobs)
            });
        }
        
        const jobs = await jobService.getJobOfMe(req.user!.id, page, limit, status);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(jobs));
        res.status(200).json({
            success: true,
            message: "Lấy công việc của bạn thành công",
            data: jobs
        });
    } catch (error) {
        next(error);
    }
}
export const clearJobCaches = async (employerId: number) => {
    try {
        const jobsListKeys = await redisClient.keys("jobs_list:*");
        if (jobsListKeys.length > 0) {
            await redisClient.unlink(jobsListKeys);
        }

        const employerJobKeys = await redisClient.keys(
            `employer_jobs_list:u${employerId}:*`
        );
        if (employerJobKeys.length > 0) {
            await redisClient.unlink(employerJobKeys);
        }
        console.log("Đã xóa cache jobs list");

    } catch (error) {
        console.error("Lỗi khi xóa cache jobs:", error);
    }
};

export const changeStatusJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobId = parseInt(req.params.id.toString());
        // const adminId = parseInt(req.user!.id.toString());
        const { status } = req.body;
        await jobService.changeStatusJob(jobId, status);
        
        const cacheKey = `job_detail:${jobId}`;
        await redisClient.del(cacheKey);
        await clearJobCaches(req.user!.id);

        res.status(200).json({
            success: true,
            message: "Thay đổi trạng thái công việc thành công"
        });
    } catch (error) {
        next(error);
    }
}
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cacheKey = `job_categories_list`;
        const cachedCategories = await redisClient.get(cacheKey);
        if (cachedCategories) {
            console.log("Lấy danh sách category từ Redis cache");
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách category thành công",
                data: JSON.parse(cachedCategories)
            });
        }
        const categories = await jobService.getAllCatagories();
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(categories));
        res.status(200).json({
            success: true,
            message: "Lấy danh sách category thành công",
            data: categories
        });
    } catch (error) {
        next(error);
    }
}
export const getJobForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobsData = await jobService.getJobForAdmin();
        res.status(200).json({
            success: true,
            message: "Lấy công việc cho admin thành công",
            data: jobsData
        });
    } catch (error) {
        next(error);
    }
}
export const getJobForAdminByStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = req.query.status as string;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const jobsData = await jobService.getJobForAdminByStatus(page, limit, status);
        res.status(200).json({
            success: true,
            message: "Lấy công việc cho admin theo trạng thái thành công",
            data: jobsData
        });
    } catch (error) {
        next(error);
    }
}
export const getStatsMonthlyForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [candidateStats, jobStats, employerStats, jobStatsPending] = await Promise.all([
            getMonthlyNewCandidates(),
            jobService.getMonthlyJobStats(),
            jobService.getMonthlyEmployerStats(),
            jobService.getMonthlyJobStatsPending()
        ]);
        res.status(200).json({
            success: true,
            message: "Lấy thống kê cho admin thành công",
            data: {
                candidateStats,
                jobStats,
                employerStats,
                jobStatsPending
            }
        });
    } catch (error) {
        next(error);
    }
}   
export const get7DayStatsForAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [candidateStats, jobStats] = await Promise.all([
            get7DayCandidateStats(),
            jobService.get7DayJobStats()
        ]);
        res.status(200).json({
            success: true,
            message: "Lấy thống kê 7 ngày cho admin thành công",
            data: {
                candidateStats,
                jobStats
            }
        });
    } catch (error) {
        next(error);
    }
}
export const searchJobByCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categoryId = parseInt(req.params.categoryId as string);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const cacheKey = `jobs_category_${categoryId}:p${page}:l${limit}`;
        const cachedJobs = await redisClient.get(cacheKey);
        if (cachedJobs) {
            console.log("Lấy dữ liệu tìm kiếm theo category từ Redis cache");
            return res.status(200).json({
                success: true,
                message: "Lấy công việc theo category thành công",
                data: JSON.parse(cachedJobs)
            });
        }
        const jobs = await jobService.searchJobByCategory(categoryId, page, limit);
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(jobs));
        res.status(200).json({
            success: true,
            message: "Lấy công việc theo category thành công",
            data: jobs
        });
    } catch (error) {
        next(error);
    }
}