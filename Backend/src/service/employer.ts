import { PoolConnection } from "mysql2/promise";
import { IEmployer, ITopEmployer } from "../interface/employer";
import { AppError } from "../utils/appError";
import { CheckCompanyId } from "./company";
import pool from "../config/database";

export const createEmployer = async (connection: PoolConnection, employer: IEmployer) => {
    
    const employerExist = await checkEmployerID(connection, employer.EmployerID)
    if (employerExist) {
        throw new AppError("Bạn đã gửi yêu cầu rồi!", 409);
    }

    const query = "INSERT INTO Employers (EmployerID, CompanyID, Position, ApprovalStatus) VALUES (?, ?, ?, ?)";
    const values = [employer.EmployerID, employer.CompanyID, employer.Position, employer.ApprovalStatus];
    await connection.query(query, values);
    return employer.EmployerID;

}
export const checkEmployerID = async (connection: PoolConnection, EmployerID: Number):Promise<boolean> => {
    const query = `SELECT EmployerID FROM Employers WHERE EmployerID = ?`
    const [result]: any = await connection.query(query, [EmployerID]);
    return result.length > 0
}
export const checkEmployerProfile = async (employerID: number) => {
    const query = "SELECT * FROM Employers WHERE EmployerID = ?";
    const [rows]: any = await pool.query(query, [employerID]);
    return rows.length > 0 ? rows[0] as IEmployer : null;
}
export const CheckCompanyStatus = async (employerID: number) => {
    const query = `SELECT c.Status
                FROM Employers e
                JOIN Companies c ON e.CompanyID = c.CompanyID
                WHERE e.EmployerID = ?  
        `
    const [rows]: any = await pool.query(query, [employerID]);
    if (rows.length === 0) {
        throw new AppError('Không tìm thấy công ty', 404);
    }
    const status = rows[0].Status;

    if (status === 'Approved') {
        return true;
    } 
    else if (status === 'Pending') {
        throw new AppError('Hồ sơ công ty đang chờ xét duyệt', 403);
    } 
    else if (status === 'Rejected') {
        throw new AppError('Hồ sơ công ty đã bị từ chối', 403);
    } 
    else if (status === 'Banned') {
        throw new AppError('Tài khoản công ty đã bị khóa', 403);
    } 
    else {
        throw new AppError('Trạng thái công ty không hợp lệ', 500);
    }
}
export const UpdateStatusEmployer = async (EmployerID: number, UserID: number, ApprovalStatus: string) => {
    const query = `
        UPDATE Employers e
        JOIN Companies c ON e.CompanyID = c.CompanyID
        SET e.ApprovalStatus = ?
        WHERE e.EmployerID = ? 
        AND c.CreatedBy = ?
    `;

    const [result]: any = await pool.query(query, [
        ApprovalStatus,
        EmployerID,
        UserID
    ]);
    if (!result.affectedRows) {
        throw new AppError("Không có quyền hoặc nhân viên không tồn tại", 404);
    }
}
export const getPendingEmployers = async (userId: number, status: string) => {

    const company = await getCompanyByUser(userId);

    if (!company) {
        throw new AppError("Bạn không phải người tạo công ty", 403);
    }

    let query = `
        SELECT 
            e.EmployerID,
            u.Email,
            e.Position,
            e.ApprovalStatus
        FROM Employers e
        JOIN Users u ON u.UserID = e.EmployerID
        WHERE e.CompanyID = ? AND e.EmployerID != ?
    `;

    const params: any[] = [company.CompanyID, userId];

    if (status !== "all") {
        query += " AND e.ApprovalStatus = ?";
        params.push(status);
    }

    const [rows]: any = await pool.query(query, params);

    return rows;
};
export const getCompanyByUser = async (userId: number) => {
    const [rows]: any = await pool.query(
        "SELECT CompanyID FROM Companies WHERE CreatedBy = ?",
        [userId]
    );
    return rows[0] || null;
};

const getJobStats = async (companyId: number) => {
    const [[rows]]: any = await pool.query(`
        SELECT
            COUNT(CASE 
                WHEN MONTH(j.CreatedAt) = MONTH(CURRENT_DATE()) 
                AND YEAR(j.CreatedAt) = YEAR(CURRENT_DATE()) 
                THEN 1 END) AS nowCount,

            COUNT(CASE 
                WHEN MONTH(j.CreatedAt) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                AND YEAR(j.CreatedAt) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
                THEN 1 END) AS prevCount

        FROM Jobs j
        JOIN Employers e ON j.EmployerID = e.EmployerID
        WHERE e.CompanyID = ?
    `, [companyId]);

    return rows;
};
const getApplicationStats = async (companyId: number) => {
    const [[rows]]: any = await pool.query(`
        SELECT
            COUNT(CASE 
                WHEN MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE()) 
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE()) 
                THEN 1 END) AS nowCount,

            COUNT(CASE 
                WHEN MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
                THEN 1 END) AS prevCount

        FROM JobApplications ja
        JOIN Jobs j ON ja.JobID = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        WHERE e.CompanyID = ?
    `, [companyId]);

    return rows;
};
const getHiredStats = async (companyId: number) => {
    const [[rows]]: any = await pool.query(`
        SELECT
            COUNT(CASE 
                WHEN ja.Status = 'Accepted'
                AND MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE()) 
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE()) 
                THEN 1 END) AS nowCount,

            COUNT(CASE 
                WHEN ja.Status = 'Accepted'
                AND MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
                THEN 1 END) AS prevCount

        FROM JobApplications ja
        JOIN Jobs j ON ja.JobID = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        WHERE e.CompanyID = ?
    `, [companyId]);

    return rows;
};
const getRejectedStats = async (companyId: number) => {
    const [[rows]]: any = await pool.query(`
        SELECT
            COUNT(CASE 
                WHEN ja.Status = 'Rejected'
                AND MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE()) 
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE()) 
                THEN 1 END) AS nowCount,

            COUNT(CASE 
                WHEN ja.Status = 'Rejected'
                AND MONTH(ja.CreatedAt) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                AND YEAR(ja.CreatedAt) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)
                THEN 1 END) AS prevCount

        FROM JobApplications ja
        JOIN Jobs j ON ja.JobID = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        WHERE e.CompanyID = ?
    `, [companyId]);

    return rows;
};
const calcTrend = (now: number, prev: number) => {
    if (prev === 0 && now === 0) {
        return {
            value: 0,
            percentage: 0,
            trendUp: true   
        };
    }

    if (prev === 0) {
        return {
            value: now,
            percentage: 100,
            trendUp: true
        };
    }

    const percent = Math.round(((now - prev) / prev) * 100);

    return {
        value: now,
        percentage: Math.abs(percent),
        trendUp: percent >= 0
    };
};
export const getDashboardStats = async (userId: number) => {

    const [companyRows]: any = await pool.query(
        "SELECT CompanyID FROM Companies WHERE CreatedBy = ?",
        [userId]
    );

    if (companyRows.length === 0) {
        throw new AppError("Bạn không có công ty", 404);
    }

    const companyId = companyRows[0].CompanyID;

    const [job, app, hired, rejected] = await Promise.all([
        getJobStats(companyId),
        getApplicationStats(companyId),
        getHiredStats(companyId),
        getRejectedStats(companyId)
    ]);

    return {
        jobs: calcTrend(job.nowCount, job.prevCount),
        applications: calcTrend(app.nowCount, app.prevCount),
        hired: calcTrend(hired.nowCount, hired.prevCount),
        rejected: calcTrend(rejected.nowCount, rejected.prevCount)
    };
}
export const getTopEmployers = async () => {
    const query = `
        SELECT c.CompanyName, c.Address as Location, c.LogoUrl, COUNT(j.JobID) AS JobCount
        FROM Employers e
        JOIN Companies c ON e.CompanyID = c.CompanyID
        JOIN Jobs j ON j.EmployerID = e.EmployerID
        WHERE e.ApprovalStatus = 'APPROVED'
        GROUP BY c.CompanyName, c.Address, c.LogoUrl
        ORDER BY JobCount DESC
        LIMIT 5
    `;
    const [rows]: any = await pool.query(query);
    return rows as ITopEmployer[];
};  
export const getLogoTopEmployers = async () => {
    const query = `
        SELECT c.LogoUrl
        FROM Employers e
        JOIN Companies c ON e.CompanyID = c.CompanyID
        JOIN Jobs j ON j.EmployerID = e.EmployerID
        WHERE e.ApprovalStatus = 'APPROVED'
        GROUP BY c.CompanyName, c.Address, c.LogoUrl
        ORDER BY COUNT(j.JobID) DESC
        LIMIT 10
    `;
    const [rows]: any = await pool.query(query);
    return rows.map((row: any) => row.LogoUrl) as string[];
}
export const getAllEmployers = async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    let totalpage : number | undefined = undefined;
    let total : number | undefined = undefined;
    if (page === 1) {
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM Users u
            JOIN Employers e ON u.UserID = e.EmployerID
            LEFT JOIN Companies c ON e.CompanyID = c.CompanyID
            WHERE u.Role = 'Employer'
        `;
        const [countResult]: any = await pool.query(countQuery);
        total = countResult[0].total;
        totalpage = Math.ceil((total || 0) / limit);
    }
    const query = `
        SELECT 
            u.UserID AS EmployerID,
            u.Email,
            e.Position,
            u.Status AS UserStatus,
            c.CompanyName,
            c.LogoUrl,
            c.Industry,
            e.ApprovalStatus AS EmployerStatus
        FROM Users u
        JOIN Employers e ON u.UserID = e.EmployerID
        LEFT JOIN Companies c ON e.CompanyID = c.CompanyID
        WHERE u.Role = 'Employer'
        ORDER BY u.CreatedAt DESC
        LIMIT ? OFFSET ?
    `;

    const [rows]: any = await pool.query(query, [limit, offset]);
    return {
        items: rows as IEmployer[],
        ...(total !== undefined) && { totalpage, total }
    }
};