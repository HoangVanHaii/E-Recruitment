import { PoolConnection } from "mysql2/promise";
import { IEmployer, ITopEmployer } from "../interface/employer";
import { AppError } from "../utils/appError";
import { CheckCompanyId } from "./company";
import pool from "../config/database";

export const createEmployer = async (connection: PoolConnection, employer: IEmployer) => {
    
    const employerExist = await checkEmployerID(connection, employer.EmployerID)
    if (employerExist) {
        throw new AppError("Nhân viên đã tồn tại", 409);
    }

    const query = "INSERT INTO employers (EmployerID, CompanyID, Position, ApprovalStatus) VALUES (?, ?, ?, ?)";
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
    const query = "SELECT * FROM employers WHERE EmployerID = ?";
    const [rows]: any = await pool.query(query, [employerID]);
    return rows.length > 0 ? rows[0] as IEmployer : null;
}
export const UpdateStatusEmployer = async (EmployerID: number, UserID: number, ApprovalStatus: string) => {
    const query = `
        UPDATE employers e
        JOIN companies c ON e.CompanyID = c.CompanyID
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
export const getPendingEmployers = async (userId: number) => {

    const query = `
        SELECT 
            e.EmployerID,
            u.Email,
            e.Position,
            e.ApprovalStatus
        FROM employers e
        JOIN companies c ON e.CompanyID = c.CompanyID
        JOIN users u ON u.UserID = e.EmployerID
        WHERE c.CreatedBy = ?
        AND e.ApprovalStatus = 'PENDING'
    `;

    const [rows]: any = await pool.query(query, [userId]);

    return rows;
};
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
        totalpage = Math.ceil(total || 0 / limit);
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
            c.Status AS CompanyStatus
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