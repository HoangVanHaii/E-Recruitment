import { PoolConnection } from "mysql2/promise";
import pool from "../config/database";
import { AppError } from "../utils/appError";
import { ResultSetHeader } from "mysql2";
import { IJobApplication, IJobApplicationList } from "../interface/jobApplication";
import { getJobDetail } from "./job";
import { getResumeDetailByResumeID } from "./resume";
import { analyzeAI } from "../ai/jobApplications";

//

export const analyzeApplicationWithAI = async (ApplicationID: number, JobID: number, ResumeID: number) => {
    const job = await getJobDetail(JobID);
    if (!job) {
        throw new Error(`Job ${JobID} not found`);
    }
    const cv = await getResumeDetailByResumeID(ResumeID);
    if (!cv) {
        throw new Error(`CV not found for candidate ${ResumeID}`);
    }

    const dataAI = await analyzeAI(job, cv, ApplicationID);
    if (!dataAI || typeof dataAI.MatchScore !== "number" ||dataAI.MatchScore < 0 ||
        dataAI.MatchScore > 100 || !dataAI.AI_Summary_Review ) {
        throw new Error(`Invalid AI result for Application ${ApplicationID}`);
    }

    await updateApplicationAI(ApplicationID, dataAI.MatchScore, dataAI.AI_Summary_Review || "");   
}

const updateApplicationAI = async (ApplicationID: number, MatchScore: number, AISummaryReview: string) => {
    const query = `
        UPDATE JobApplications
        SET MatchScore = ?, AI_Summary_Review = ?
        WHERE ApplicationID = ?
    `;
    await pool.query(query, [MatchScore, AISummaryReview, ApplicationID]);
}



export const createJobApplication = async (JobID: number, CandidateID: number, ResumeID: number): Promise<number> => {
    try {
        await checkJob(JobID);
        await checkConflict(JobID, CandidateID);
        const insertSql = `
            INSERT INTO JobApplications
            (JobID, CandidateID, ResumeID)
            VALUES (?, ?, ?)
        `;
        const [result] = await pool.query<ResultSetHeader>(
            insertSql,
            [JobID, CandidateID, ResumeID]
        );

        return result.insertId;

    } catch (error: any) {
        if (error.code === "ER_NO_REFERENCED_ROW_2") {
            throw new AppError("CV không tồn tại", 400);
        }

        throw error;
    }
};
const checkConflict = async (JobID: number, CandidateID: number) => {
    const checkSql = `
        SELECT ApplicationID
        FROM JobApplications
        WHERE JobID = ? AND CandidateID = ?
        LIMIT 1

    `;
    const [exist]: any = await pool.query(checkSql, [
        JobID,
        CandidateID
    ]);

    if (exist.length > 0) {
        throw new AppError("Bạn đã ứng tuyển công việc này rồi", 409);
    }
}
const checkJob = async (JobID: number) => {
    const jobCheckSql = `
        SELECT j.Quantity, j.ExpiredDate
        FROM Jobs j
        LEFT JOIN JobApplications a 
            ON j.JobID = a.JobID
        WHERE j.JobID = ?
    `;

    const [rows]: any = await pool.query(jobCheckSql, [JobID]);

    if (rows.length === 0) {
        throw new AppError("Công việc không tồn tại", 404);
    }
    const jobInfo = rows[0];
    const today = new Date().toISOString().split("T")[0];

    if (jobInfo.ExpiredDate < today) {
        throw new AppError("Công việc đã hết hạn ứng tuyển", 400);
    }
};
//
export const updateApplicationStatus = async (ApplicationID: number, UserID: number, Status: string): Promise<void> => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        const data = await getApplicationWithPermission(connection, ApplicationID, UserID);
        if (data.Status === Status) {
            await connection.commit();
            return;
        }
        if (Status === "Accepted") {
            await checkJobCapacity(connection, data.JobID, data.Quantity);
        }
        const updateSql = `
            UPDATE JobApplications
            SET Status = ?
            WHERE ApplicationID = ?
        `;
        const [result]: any = await connection.query(updateSql, [Status, ApplicationID]);
        if (!result.affectedRows) {
            throw new AppError("Application không tồn tại", 404);
        }
        await connection.commit();
        
    } catch (error) {
        await connection.rollback();
        throw (error);
    }
    finally {
        connection.release();
    }
};
const getApplicationWithPermission = async (connection: PoolConnection, ApplicationID: number, UserID: number) => {
    const query = `
        SELECT ja.Status, ja.JobID, j.Quantity
        FROM JobApplications ja
        JOIN Jobs j ON ja.JobID = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        JOIN Companies c ON e.CompanyID = c.CompanyID
        WHERE ja.ApplicationID = ? AND c.CreatedBy = ?
        FOR UPDATE
    `;
    const [data]: any = await connection.query(query, [ApplicationID, UserID]);
    if (data.length === 0) {
        throw new AppError("Không tìm thấy đơn hoặc bạn không có quyền", 403);
    }
    return data[0];
};

const checkJobCapacity = async (connection: PoolConnection, JobID: number, Quantity: number) => {
    const query = `
        SELECT COUNT(*) AS acceptedCount
        FROM JobApplications
        WHERE JobID = ? AND Status = 'ACCEPTED'
        FOR UPDATE
    `;
    const [data]: any = await connection.query(query, [JobID]);
    const acceptedCount = data[0].acceptedCount;

    if (acceptedCount >= Quantity) {
        throw new AppError("Đã đủ số lượng tuyển", 400);
    }
}
//
export const getSubmittedApplications = async (CandidateID: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT 
            co.CompanyID,
            co.CompanyName,
            j.JobID,
            j.Title AS JobTitle,
            ja.Status AS ApplicationStatus,
            j.ExpiredDate,
            ja.CreatedAt,
            ja.ApplicationID
        FROM JobApplications ja
        JOIN Jobs j ON ja.JobID = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        JOIN Companies co ON e.CompanyID = co.CompanyID
        WHERE ja.CandidateID = ?
        ORDER BY ja.CreatedAt DESC
        LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(query, [CandidateID, limit, offset]);
    return rows;
};

export const getApplicationByJobId = async (JobID: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;
    const query = `
        SELECT 
            app.ApplicationID,
            can.FullName,
            can.ExperienceYears,
            can.AvatarUrl,
            app.MatchScore,
            app.Status,
            app.CreatedAt
        FROM JobApplications app
        JOIN Candidates can 
            ON app.CandidateID = can.CandidateID
        WHERE app.JobID = ?
        ORDER BY app.MatchScore DESC, app.CreatedAt DESC
        LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [JobID, limit, offset]);
    return rows as IJobApplicationList[];   
}

export const updateApplicationStatusCandidate = async (ApplicationID: number, CandidateID: number, Status: string): Promise<void> => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        const oldStatus = await getStatusJobApplication(connection, ApplicationID, CandidateID);
        if (oldStatus !== 'Pending') {
            throw new AppError("Chỉ có thể huỷ đơn đang chờ xử lý", 400);
        }
        if (Status !== 'Cancelled') {
            throw new AppError("Candidate chỉ được huỷ đơn", 403);

        }
        const updateSql = `
            UPDATE JobApplications
            SET Status = ?
            WHERE ApplicationID = ? AND CandidateID = ?
        `;
        const [result]: any = await connection.query(updateSql, [Status, ApplicationID, CandidateID]);
        if (!result.affectedRows) {
            throw new AppError("Cập nhật thất bại", 500);
        }
        await connection.commit();
        
    } catch (error) {
        await connection.rollback();
        throw (error);
    }
    finally {
        connection.release();
    }
};
const getStatusJobApplication = async (connection: PoolConnection, ApplicationID: number, CandidateID: number) => {
    const query = `
        SELECT Status
        FROM JobApplications
        WHERE ApplicationID = ? AND CandidateID = ?
        FOR UPDATE
    `
    const [data]: any = await connection.query(query, [ApplicationID, CandidateID]);
    return data[0].Status;

}
//
const applicationDetailQuery = `
    SELECT
        a.ApplicationID,
        a.Status,
        a.CreatedAt,
        a.MatchScore,
        a.AI_Summary_Review,
        a.ResumeID,
        u.Email,
        c.CandidateID,
        c.FullName,
        c.Phone,
        c.AvatarUrl,
        j.Title AS JobTitle,
        j.SalaryMin,
        j.SalaryMax,
        co.CompanyName
    FROM JobApplications a
    JOIN Candidates c ON a.CandidateID = c.CandidateID
    JOIN Users u ON u.UserID = c.CandidateID
    JOIN Jobs j ON a.JobID = j.JobID
    JOIN Employers e ON j.EmployerID = e.EmployerID
    JOIN Companies co ON e.CompanyID = co.CompanyID
    WHERE a.ApplicationID = ?
    LIMIT 1
    `;
    
export const getApplicationDetail = async (ApplicationID: number): Promise<IJobApplication | null> => {

    const [rows]: any = await pool.query( applicationDetailQuery, [ApplicationID]);

    if (rows.length === 0) return null;
    
    const app = rows[0]; 
    const result: IJobApplication = {
        ApplicationID: app.ApplicationID,
        FullName: app.FullName,
        Phone: app.Phone,
        Email: app.Email,
        AvatarUrl: app.AvatarUrl,
        Status: app.Status,
        CreatedAt: app.CreatedAt,
        MatchScore: app.MatchScore,
        AI_Summary_Review: app.AI_Summary_Review,
        ResumeID: app.ResumeID,
        ResumeDetail: await getResumeDetailByResumeID(app.ResumeID),

        JobTitle: app.JobTitle,
        CompanyName: app.CompanyName,
        Description: app.Description,
        SalaryMin: app.SalaryMin,
        SalaryMax: app.SalaryMax
    };
    
    return result;
};
  
//
export const getJobIdByApplicationId = async (ApplicationID: number): Promise<number> => {
    const query = `
        SELECT JobID
        FROM JobApplications
        WHERE ApplicationID = ?
        LIMIT 1
      `;
    const [rows]: any = await pool.query(query, [ApplicationID]);
  
    if (!rows.length) {
        throw new Error("Application không tồn tại");
    }
  
    return rows[0].JobID;
};

export const getChartStats = async (userId: number, type: string) => {
    try {
      
        const [companyRows]: any = await pool.query(
            "SELECT CompanyID FROM Companies WHERE CreatedBy = ?",
            [userId]
        );
        if (companyRows.length === 0) {
            throw new AppError("Bạn không có công ty", 404);
        }
      
        const companyId = companyRows[0].CompanyID;
      
        let categories: string[] = [];
        let data: number[] = [];
      
        if (type === 'week') {
            const [rows]: any = await pool.query(`
                SELECT 
                DAYOFWEEK(ja.CreatedAt) as day,
                COUNT(*) as total
                FROM JobApplications ja
                JOIN Jobs j ON ja.JobID = j.JobID
                JOIN Employers e ON j.EmployerID = e.EmployerID
                WHERE e.CompanyID = ?
                AND YEARWEEK(ja.CreatedAt, 1) = YEARWEEK(CURRENT_DATE(), 1)
                GROUP BY day
            `, [companyId]);
        
            const map: any = { 2:0,3:0,4:0,5:0,6:0,7:0,1:0 };
        
            rows.forEach((r: any) => {
                map[r.day] = r.total;
            });
        
            categories = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
            data = [map[2], map[3], map[4], map[5], map[6], map[7], map[1]];
        }
      
        if (type === 'month') {
      
            const [rows]: any = await pool.query(`
                SELECT 
                WEEK(ja.CreatedAt, 1) - WEEK(DATE_SUB(ja.CreatedAt, INTERVAL DAYOFMONTH(ja.CreatedAt)-1 DAY),1) + 1 as week,
                COUNT(*) as total
                FROM JobApplications ja
                JOIN Jobs j ON ja.JobID = j.JobID
                JOIN Employers e ON j.EmployerID = e.EmployerID
                WHERE e.CompanyID = ?
                AND MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE())
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE())
                GROUP BY week
            `, [companyId]);
        
            const map: any = {1:0,2:0,3:0,4:0,5:0};
        
            rows.forEach((r: any) => {
                map[r.week] = r.total;
            });
        
            categories = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
            data = [map[1], map[2], map[3], map[4]];
        }
        if (type === 'year') {
            const [rows]: any = await pool.query(`
                SELECT 
                    MONTH(ja.CreatedAt) as month,
                    COUNT(*) as total
                FROM JobApplications ja
                JOIN Jobs j ON ja.JobID = j.JobID
                JOIN Employers e ON j.EmployerID = e.EmployerID
                WHERE e.CompanyID = ?
                    AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE())
                GROUP BY month
            `, [companyId]);
        
            const map: any = {};
            for (let i = 1; i <= 12; i++) map[i] = 0;
      
            rows.forEach((r: any) => {
                map[r.month] = r.total;
            });
      
            categories = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
            data = Object.values(map);
        }
      
        return { categories, data };
    }
    catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error("Lỗi thống kê:", error);
    }
};