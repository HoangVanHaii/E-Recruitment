import pool from "../config/database";
import redisClient from "../config/redisClient";
import { IProfile } from "../interface/user";

export const searchUserByEmail = async (email: string) => {
    const query = "SELECT * FROM users WHERE Email = ?";
    const [rows]: any = await pool.query(query, [email]);
    return rows[0];
}
export const searchUserById = async (userId: number) => {
    const query = "SELECT * FROM users WHERE UserID = ?";
    const [rows]: any = await pool.query(query, [userId]);
    return rows[0];
}
export const createUser = async (email: string, password: string, role: string) => {
    const query = "INSERT INTO users (Email, PasswordHash, Role) VALUES (?, ?, ?)";
    const values = [email, password, role ?? 'Candidate'];
    const [result]: any = await pool.query(query, values);
    return result.insertId;
}
export const getAllUsers = async () => {
    const query = "SELECT UserID, Email, Role, Status FROM users";
    const [rows]: any = await pool.query(query);
    return rows;
}
// export const getProfileCandidate = async (userId: number) => {
//     const query = "SELECT CandidateId, FullName, AvatarUrl FROM candidates WHERE CandidateID = ?";
//     const [rows]: any = await pool.query(query, [userId]);
//     const candidate: IProfile = {
//         ProfileID: rows[0].CandidateId,
//         Name: rows[0].FullName,
//         ImgUrl: rows[0].AvatarUrl
//     }
//     return candidate;
// }
// export const getProfileEmployer = async (userId: number) => {
//     //join đến companies để lấy CompanyName
//     const query = `SELECT e.EmployerID, c.CompanyName, c.LogoUrl 
//                    FROM employers e 
//                    JOIN companies c ON e.CompanyID = c.CompanyID
//                    WHERE e.EmployerID = ?`;
//     const [rows]: any = await pool.query(query, [userId]);
//     const employer: IProfile = {
//         ProfileID: rows[0].EmployerID,
//         Name: rows[0].CompanyName,
//         ImgUrl: rows[0].LogoUrl
//     }
//     return employer;
// }
export const getProfileWithCache = async (userId: number) => {
    const cacheKey = `profile:u${userId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const profile = await getProfile(userId);

    await redisClient.set(cacheKey, JSON.stringify(profile), { EX: 3600 });

    return profile;
};
export const getProfile = async (userId: number) => {
    const query = `
            SELECT CandidateId as ProfileID, FullName as Name, AvatarUrl as ImgUrl FROM candidates WHERE CandidateID = ?
            UNION
            SELECT e.EmployerID as ProfileID, c.CompanyName as Name, c.LogoUrl as ImgUrl
            FROM employers e 
            JOIN companies c ON e.CompanyID = c.CompanyID
            WHERE e.EmployerID = ?`;
    const [rows]: any = await pool.query(query, [userId, userId]);
    return rows[0] as IProfile;
};
export const updateUserStatus = async (userId: number, status: string) => {
    const query = "UPDATE users SET Status = ? WHERE UserID = ?";
    await pool.query(query, [status, userId]);
}
export const getCurrentRole = async (userId: number) => {
    const query = `SELECT Role FROM users WHERE UserID = ?`
    const [rows]: any = await pool.query(query, [userId]);
    return rows[0].Role
}