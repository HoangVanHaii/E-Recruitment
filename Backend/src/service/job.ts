import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { generateEmbedding } from "./searchAi";
import { pineconeIndex } from "../config/pinecone";
import { IJobPayload, IListJob, IJob, IJobFilters, IJobDetailPayload, IJobDetail, IInterviewRound } from "../interface/job";
import { JobDetailModel } from "../model/job";
import { generateAndStoreVector } from '../utils/ai';

export const insertJobToMySQL = async (pool: PoolConnection, job: IJobPayload) => {
    const jobQuery = "INSERT INTO jobs (EmployerID, CategoryID, Title, Quantity, SalaryMin, SalaryMax, Location, JobType, ExperienceRequired, ExpiredDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const jobValues = [job.EmployerID, job.CategoryID, job.Title, job.Quantity, job.SalaryMin, job.SalaryMax, job.Location, job.JobType, job.ExperienceRequired, job.ExpiredDate];
    const [jobResult]: any = await pool.query(jobQuery, jobValues);
    return jobResult.insertId;
}
export const insertJobDetailToMongoDB = async (jobDetail: IJobDetailPayload, mysqlJobID: number) => {
    await JobDetailModel.create({
        mysqlJobID: mysqlJobID,
        description: jobDetail.Description,
        requirements: jobDetail.Requirements,
        workingSchedule: jobDetail.WorkingSchedule,
        benefits: jobDetail.Benefits,
        tags: jobDetail.Tags,
        interviewProcess: jobDetail.InterviewProcess,
        rowTextForAi: jobDetail.RawTextForAi
    });
}
export const createJob = async (job: IJobPayload, jobDetail: IJobDetailPayload) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const newMysqlId = await insertJobToMySQL(connection, job);
        await insertJobDetailToMongoDB(jobDetail, newMysqlId);     
       
        if (jobDetail.RawTextForAi) {
            const vectorId = await generateAndStoreVector(jobDetail.RawTextForAi, 'job', newMysqlId);
            await connection.query("UPDATE jobs SET VectorID = ? WHERE JobID = ?", [vectorId, newMysqlId]);
        }

        await connection.commit();
        connection.release();
        return newMysqlId;

    } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
    }
}
export const processJobVector = async (jobId: number, job: IJobPayload, jobDetail: IJobDetailPayload, rawTextForAi: string) => {
    try {
        const vector = await generateEmbedding(rawTextForAi);
        await pineconeIndex.upsert({
            records: [
                {
                    id: jobId.toString(),
                    values: vector,
                    metadata: {
                        type: "job",
                        jobId,
                        location: job.Location,
                        title: job.Title,
                        description: jobDetail.Description,
                        requirements: jobDetail.Requirements,
                        tags: jobDetail.Tags,
                        benefits: jobDetail.Benefits.join(', '),
                    }
                }
            ]
        });

        console.log(`[AI-LOG] Đã index thành công Job ID: ${jobId}`);
    } catch (error) {
        console.error(`[AI-ERROR] Job ID ${jobId}:`, error);
    }
};
export const mergeJob = async(jobIds: number[], rows: any) => {
    const mongoDetails = await JobDetailModel.find({
        mysqlJobID: { $in: jobIds }
    }).select('mysqlJobID description').lean();
    const finalJobList = rows.map((job: any) => {
        const detail = mongoDetails.find((m: any) => m.mysqlJobID === job.JobID)
        return {
            ...job,
            description: detail?.description || ""
        }
    })
    return finalJobList;
}
export const getAllJobs = async (filters: IJobFilters) => {
    const { Page, Limit, CategoryId, Location, MinSalary, MaxSalary } = filters;
    const offset = (Page - 1) * Limit;

    let whereClause = `WHERE j.ExpiredDate > NOW() AND j.Status = 'Approved'`;
    const baseParams: any[] = [];

    if (CategoryId) {
        whereClause += " AND j.CategoryID = ?";
        baseParams.push(CategoryId);
    }
    if (Location) {
        whereClause += " AND j.Location LIKE ?";
        baseParams.push(`%${Location}%`);
    }
    if (MinSalary && MaxSalary) {
        whereClause += " AND j.SalaryMin >= ? AND j.SalaryMax <= ?";
        baseParams.push(MinSalary, MaxSalary);
    }

    let total: number | undefined = undefined;
    let totalPages: number | undefined = undefined;

    if (Page === 1) {
        const countQuery = `
            SELECT COUNT(*) as totalItems
            FROM jobs j
            JOIN employers e ON j.EmployerID = e.EmployerID
            JOIN companies c ON e.CompanyID = c.CompanyID
            ${whereClause}
        `;
        const [countResult]: any = await pool.query(countQuery, baseParams);
        total = countResult[0].totalItems;
        totalPages = Math.ceil( (total || 0 ) / Limit);
    }

    // nếu có score thì order by score, không thì order by createdAt
    const dataQuery = `
        SELECT j.JobID, j.Title, j.Location, j.CreatedAt, j.SalaryMin, j.SalaryMax, j.JobType, c.CompanyName, c.LogoUrl AS CompanyLogo, j.Status, r.Score
        FROM jobs j
        JOIN employers e ON j.EmployerID = e.EmployerID
        JOIN companies c ON e.CompanyID = c.CompanyID
        LEFT JOIN JobRecommendations r ON j.JobID = r.JobID
        ${whereClause}
        ORDER BY CASE WHEN r.Score IS NOT NULL THEN r.Score END DESC, j.CreatedAt DESC
        LIMIT ? OFFSET ?
    `;
    const dataParams = [...baseParams, Limit, offset];
    const [rows]: any = await pool.query(dataQuery, dataParams);

    const jobIds = rows.map((job: any) => job.JobID);
    const finalJobList = await mergeJob(jobIds, rows);

    return {
        items: finalJobList as IJob[],
        ...(total !== undefined && { total, totalPages })
    };
}
export const getRecommendedJobs = async (candidateId: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;

    const [rows]: any = await pool.query(
        `
        SELECT 
            j.JobID,
            j.Title,
            j.Location,
            j.CreatedAt,
            c.CompanyName,
            c.LogoUrl AS CompanyLogo,
            r.Score
        FROM JobRecommendations r
        JOIN jobs j ON r.JobID = j.JobID
        JOIN employers e ON j.EmployerID = e.EmployerID
        JOIN companies c ON e.CompanyID = c.CompanyID
        WHERE r.CandidateID = ?
        ORDER BY r.Score DESC
        LIMIT ? OFFSET ?
        `,
        [candidateId, limit, offset]
    );

    const jobIds = rows.map((job: any) => job.JobID);
    const finalJobList = await mergeJob(jobIds, rows);

    return finalJobList;
};
export const getJobDetail = async (jobId: number) => {
    const query = `SELECT j.JobID, j.Title, j.Location, j.CreatedAt, j.SalaryMin, j.SalaryMax, j.JobType, c.CompanyName, c.LogoUrl AS CompanyLogo, j.Status, j.Quantity, e.EmployerID
        FROM jobs j
        JOIN Employers e ON j.EmployerID = e.EmployerID
        JOIN Companies c ON e.CompanyID = c.CompanyID
        WHERE j.JobID = ?`;
    const [mysqlResult, jobDetailDoc] = await Promise.all([
        pool.query(query, [jobId]),
        JobDetailModel.findOne({ mysqlJobID: jobId }).lean()
    ]);
    const [rows]: any = mysqlResult;
    if (rows.length === 0 || !jobDetailDoc) {
        return null;
    }
    const job: IJob = rows[0];
    const jobDetail: IJobDetail = {
        JobID: job.JobID!,
        EmployerID: rows[0].EmployerID,
        Title: job.Title,
        Location: job.Location,
        CreatedAt: job.CreatedAt!,
        CompanyName: job.CompanyName,
        CompanyLogo: job.CompanyLogo,
        Status: job.Status,
        Quantity: rows[0].Quantity,
        SalaryMax: rows[0].SalaryMax,
        SalaryMin: rows[0].SalaryMin,
        JobType: rows[0].JobType,
        Description: jobDetailDoc.description,
        WorkingSchedule: jobDetailDoc.workingSchedule || undefined,
        Requirements: jobDetailDoc.requirements,
        Benefits: jobDetailDoc.benefits,
        RawTextForAi: jobDetailDoc.rowTextForAi || "",
        Tags: jobDetailDoc.tags,
        InterviewProcess: (jobDetailDoc.interviewProcess as unknown as IInterviewRound[]) || undefined
    }
    return jobDetail;
}
export const closeJob = async (jobId: number) => {
    const query = `UPDATE jobs set ExpiredDate = NOW() WHERE JobID = ?`
    await pool.query(query, [jobId]);
    return true;
}
export const updateJob = async (payload: any) => {
    const mysqlSetFields: string[] = [];
    const mysqlValues: any[] = [];

    if (payload.Title !== undefined) {
        mysqlSetFields.push("Title = ?");
        mysqlValues.push(payload.Title);
    }
    if (payload.Location !== undefined) {
        mysqlSetFields.push("Location = ?");
        mysqlValues.push(payload.Location);
    }
    if (payload.SalaryMin !== undefined) {
        mysqlSetFields.push("SalaryMin = ?");
        mysqlValues.push(payload.SalaryMin);
    }
    if (payload.SalaryMax !== undefined) {
        mysqlSetFields.push("SalaryMax = ?");
        mysqlValues.push(payload.SalaryMax);
    }
    if (payload.JobType !== undefined) {
        mysqlSetFields.push("JobType = ?");
        mysqlValues.push(payload.JobType);
    }
    if (payload.Quantity !== undefined) {
        mysqlSetFields.push("Quantity = ?");
        mysqlValues.push(payload.Quantity);
    }

    const currentJobId = payload.JobID || payload.JobId;

    if (mysqlSetFields.length > 0) {
        const mysqlQuery = `UPDATE jobs SET ${mysqlSetFields.join(', ')} WHERE JobID = ?`;
        mysqlValues.push(payload.JobID);

        const [mysqlResult]: any = await pool.query(mysqlQuery, mysqlValues);
        if (mysqlResult.affectedRows === 0) {
            throw new Error("Không tìm thấy công việc để cập nhật!");
        }
    }

    const mongoUpdateData: any = {};

    if (payload.Description !== undefined) mongoUpdateData.description = payload.Description;
    if (payload.WorkingSchedule !== undefined) mongoUpdateData.workingSchedule = payload.WorkingSchedule;
    if (payload.Requirements !== undefined) mongoUpdateData.requirements = payload.Requirements;
    if (payload.Benefits !== undefined) mongoUpdateData.benefits = payload.Benefits;
    if (payload.Tags !== undefined) mongoUpdateData.tags = payload.Tags;
    if (payload.InterviewProcess !== undefined) mongoUpdateData.interviewProcess = payload.InterviewProcess;

    if (Object.keys(mongoUpdateData).length > 0) {
        await JobDetailModel.findOneAndUpdate(
            { mysqlJobID: payload.JobID },
            { $set: mongoUpdateData }
        );
    }

    const titleText = payload.Title || '';
    const descText = payload.Description || '';
    const reqText = payload.Requirements || '';
    const benefitsText = payload.Benefits ? payload.Benefits.join(" ") : '';
    const tagsText = payload.Tags ? payload.Tags.join(" ") : '';
    
    const rawTextForAi = `${titleText} ${descText} ${reqText} ${benefitsText} ${tagsText}`.trim();

    if (rawTextForAi) {
        await generateAndStoreVector(rawTextForAi, 'job', currentJobId);
    }

    return true;
}
export const getJobOfMe = async (userId: number, page: number, limit: number, status: string) => {
    const offset = (page - 1) * limit;
    const queryParams: any[] = [userId];

    let query = `
        SELECT 
            j.JobID, 
            j.Title, 
            j.Location, 
            j.CreatedAt, 
            c.CompanyName, 
            c.LogoUrl AS CompanyLogo, 
            j.Status,
            j.ExpiredDate,
            COUNT(ja.ApplicationID) AS ApplicationCount
        FROM jobs j
        JOIN employers e ON j.EmployerID = e.EmployerID
        JOIN companies c ON e.CompanyID = c.CompanyID
        LEFT JOIN jobApplications ja ON j.JobID = ja.JobID
        WHERE e.EmployerID = ?
    `;

    if (status !== 'All') {
        if (status === 'Expired') {
            query += ` AND j.ExpiredDate < NOW() `;
        } else {
            query += ` AND j.Status = ? AND j.ExpiredDate >= NOW() `;
            queryParams.push(status);
        }
    }

    query += `
        GROUP BY 
            j.JobID, 
            j.Title, 
            j.Location, 
            j.CreatedAt, 
            c.CompanyName, 
            c.LogoUrl, 
            j.Status,
            j.ExpiredDate
        ORDER BY j.CreatedAt DESC 
        LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const [rows]: any = await pool.query(query, queryParams);

    const jobIds = rows.map((job: any) => job.JobID);
    const finalJobList = await mergeJob(jobIds, rows);

    return finalJobList as IListJob[];
};
export const isJobOwner = async (employerId: number, jobId: number) => {
    const query = `SELECT EmployerID FROM jobs WHERE JobID = ? AND EmployerID = ?`;
    const value = [jobId, employerId]
    const [rows]: any = await pool.query(query, value);
    return rows.length > 0;
}

export const getAllJobVectors = async () => {
    const query = `
        SELECT 
            JobID, 
            vectorID
        FROM jobs 
        WHERE ExpiredDate > NOW() 
          AND vectorId IS NOT NULL
    `;
    const [rows]: any = await pool.query(query);
    return rows;
}
export const getJobsByIds = async (jobIds: number[], placeholders: string) => {
    if (!jobIds.length) return [];
    const [mysqlResult, mongoDetails] = await Promise.all([
        pool.query(`
            SELECT j.JobID, j.Title, j.Location, j.CreatedAt, c.CompanyName, c.LogoUrl AS CompanyLogo, j.Status
            FROM jobs j
            JOIN employers e ON j.EmployerID = e.EmployerID
            JOIN companies c ON e.CompanyID = c.CompanyID
            WHERE j.JobID IN (${placeholders})
            ORDER BY FIELD(j.JobID, ${placeholders})
            LIMIT 20
        `, [...jobIds, ...jobIds]),

        JobDetailModel.find({
            mysqlJobID: { $in: jobIds }
        }).select('mysqlJobID description requirements tags').lean()
    ]);

    const jobs = mysqlResult[0] as any[];
    const detailMap = new Map(mongoDetails.map(d => [d.mysqlJobID, d]));

    const finalJobList = jobs.map((job) => {
        const detail: any = detailMap.get(job.JobID);
        return {
            ...job,
            description: cleanText(detail?.description || ""),
            requirements: detail?.requirements || "",
            tags: detail?.tags || []
        };
    });

    return finalJobList;
}
const cleanText = (text: string) => text.replace(/<\/?[^>]+(>|$)/g, "");

export const getRowTextForAI = async (jobId: number) => {
    const jobDetail = await JobDetailModel.findOne({ mysqlJobID: jobId }).select('rowTextForAi').lean();
    return jobDetail?.rowTextForAi || "";
}
export const isJobPending = async (jobId: number) => {
    const query = `SELECT Status FROM jobs WHERE JobID = ?`;
    const [rows]: any = await pool.query(query, [jobId]);
    if (rows.length === 0) {
        throw new Error("Không tìm thấy công việc!");
    }
    return rows[0].Status === 'Pending';
}
export const changeStatusJob = async (jobId: number, newStatus: string) => {
    const query = `UPDATE jobs set Status = ? WHERE JobID = ?`
    await pool.query(query, [newStatus, jobId]);
    return true;
}
export const getAllCatagories = async () => {
    const query = `SELECT CategoryID, CategoryName FROM jobcategories`;
    const [rows]: any = await pool.query(query);
    return rows;
}   
export const searchJobsByKeyword = async (q: string) => {
    const sql = `
        SELECT JobID
        FROM jobs
        WHERE Title LIKE ?
           OR Location LIKE ?
        LIMIT 20
    `;

    const [rows] = await pool.query(sql, [`%${q}%`, `%${q}%`]);
    return rows as any[];
};