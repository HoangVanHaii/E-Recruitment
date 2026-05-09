import pool from "../config/database";
import { mergeJob } from "./job";


export const savedJob = async (candidateId: number, jobId: number) => {
    const query = "INSERT INTO SavedJobs (CandidateID, JobID) VALUES (?, ?)";
    const [result] = await pool.query(query, [candidateId, jobId]);
    return result;
}

export const removeSavedJob = async (candidateId: number, jobId: number) => {
    const query = "DELETE FROM SavedJobs WHERE CandidateID = ? AND JobID = ?";
    const [result] = await pool.query(query, [candidateId, jobId]);
    return result;
}
export const getSavedJobs = async (candidateId: number, page: number, limit: number) => {
    const offset = (page - 1) * limit;

    let total: number | undefined;
    let totalPages: number | undefined;

    if (page === 1) {
        const countQuery = `
            SELECT COUNT(*) as totalItems
            FROM SavedJobs sj
            JOIN Jobs j ON sj.jobId = j.JobID
            WHERE sj.CandidateID = ?
        `;
        const [countResult]: any = await pool.query(countQuery, [candidateId]);

        total = countResult[0].totalItems;
        totalPages = Math.ceil((total || 0) / limit);
    }

    const dataQuery = `
        SELECT 
            j.JobID, j.Title, j.Location, j.CreatedAt, j.SalaryMin, j.SalaryMax,
            c.CompanyName, c.LogoUrl AS CompanyLogo,
            sj.SavedAt AS SavedAt 
        FROM SavedJobs sj
        JOIN Jobs j ON sj.jobId = j.JobID
        JOIN Employers e ON j.EmployerID = e.EmployerID
        JOIN Companies c ON e.CompanyID = c.CompanyID
        WHERE sj.CandidateID = ?
        ORDER BY sj.SavedAt DESC
        LIMIT ? OFFSET ?
    `;

    const [rows]: any = await pool.query(dataQuery, [candidateId, limit, offset]);

    if (rows.length === 0) {
        return {
            items: [],
            ...(total !== undefined && { total, totalPages })
        };
    }

    const jobIds = rows.map((job: any) => job.JobID);
    const finalJobList = await mergeJob(jobIds, rows);

    return {
        items: finalJobList,
        ...(total !== undefined && { total, totalPages })
    };
};
export const isSavedJob = async (candidateId: number, jobId: number): Promise<boolean> => {
    const query = "SELECT 1 FROM SavedJobs WHERE CandidateID = ? AND JobID = ? LIMIT 1";
    const [rows]: any = await pool.query(query, [candidateId, jobId]);
    return rows.length > 0;
}