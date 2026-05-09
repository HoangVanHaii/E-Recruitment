import pool from "../config/database";
import { Candidate, ICandidateInfo } from "../interface/candidate";
import { GoogleGenAI } from "@google/genai"; 
import * as skillService from "./skill";
import { PoolConnection } from "mysql2/promise";
import CandidateDetail from '../model/candidateDetail';

export const upsertCandidateProfile = async (data: Candidate) => {
    const query = `INSERT INTO Candidates (CandidateID, FullName, Phone, DateOfBirth, Address, AvatarUrl)
                   VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                       FullName = VALUES(FullName),
                       Phone = VALUES(Phone),
                       DateOfBirth = VALUES(DateOfBirth),
                       Address = VALUES(Address),
                       AvatarUrl = VALUES(AvatarUrl)
                  `;
    const values = [
        data.CandidateID, 
        data.FullName, 
        data.Phone || null, 
        data.DateOfBirth || null, 
        data.Address || null, 
        data.AvatarUrl || null
    ];

    const [result]: any = await pool.query(query, values);
    return result;
};

export const upsertCandidateDetailMongo = async (candidateId: number, data: any) => {
    const updateFields: any = {};

    if (data.experience) updateFields.experience = data.experience;
    if (data.education) updateFields.education = data.education;
    if (data.projects) updateFields.projects = data.projects;

    return await CandidateDetail.findOneAndUpdate(
        { candidateId },
        { $set: updateFields },
        { new: true, upsert: true } 
    );
};

export const getCandidateProfile = async (userId: number) => {
    const query = `
        SELECT u.Email, u.Role, u.Status, c.*
        FROM Users u
        JOIN Candidates c ON u.UserID = c.CandidateID
        WHERE u.UserID = ?
    `;
    const [rows]: any = await pool.query(query, [userId]);
    if (rows.length === 0) return null;
    
    const sqlProfile = rows[0];
    const mongoDetail = await CandidateDetail.findOne({ candidateId: userId });

    return {
        ...sqlProfile,
        experience: mongoDetail?.experience || [],
        education: mongoDetail?.education || [],
        projects: mongoDetail?.projects || []
    };
};

export const getCandidateSkills = async (userId: number) => {
    const query = `
        SELECT s.SkillID, s.SkillName, cs.SkillLevel
        FROM CandidateSkills cs
        JOIN Skills s ON cs.SkillID = s.SkillID
        WHERE cs.CandidateID = ?
    `;
    const [rows]: any = await pool.query(query, [userId]);
    return rows;
};


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
const buildSkillAnalysisPrompt = (rawText: string, dictionary: any[]) => {
    return `
        Bạn là một Trưởng phòng Nhân sự cấp cao, cực kỳ nghiêm túc và chuyên nghiệp. Dưới đây là đoạn văn bản ứng viên mô tả kỹ năng của họ:
        "${rawText}"
        
        Và đây là danh sách CÁC KỸ NĂNG CHUẨN đang có trong hệ thống database của tôi:
        ${JSON.stringify(dictionary)}
        
        Nhiệm vụ của bạn:
        1. Trích xuất TẤT CẢ các kỹ năng CHUYÊN MÔN NGHỀ NGHIỆP từ đoạn văn bản trên.
        2. TUYỆT ĐỐI BỎ QUA và loại trừ các từ ngữ tào lao, sở thích cá nhân, hoặc thói quen không phục vụ cho công việc chuyên môn (ví dụ: nhậu, ngủ, chơi game, lười biếng, chửi thề...). Nếu đoạn văn không chứa bất kỳ kỹ năng công việc nào hợp lệ, hãy trả về mảng rỗng [].
        3. Đối chiếu với danh sách chuẩn. Nếu khớp (kể cả đồng nghĩa/viết tắt), hãy lấy 'id' chuẩn.
        4. QUAN TRỌNG: Nếu ứng viên có một kỹ năng CHUYÊN MÔN mới hoàn toàn (không có trong danh sách), hãy trích xuất nó và gán 'id' là chuỗi "new".
        5. CHỈ trả về một mảng JSON với cấu trúc object. TUYỆT ĐỐI không trả về chữ hay giải thích thêm.
        
        Ví dụ định dạng trả về chuẩn:
        [
            { "id": 1, "name": "Digital Marketing" },
            { "id": 5, "name": "English" },
            { "id": "new", "name": "Livestream TikTok" }
        ]
    `;
};

const parseAIResponse = (responseText: string) => {
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Lỗi AI Parse JSON:", cleanedText);
        throw new Error("AI_PARSE_ERROR"); 
    }
};

const mapFinalSkills = (parsedResults: any[], allSkills: any[]) => {
    return parsedResults.map((item: any) => {
        if (item.id === "new") {
            return {
                isNew: true, 
                skillId: null,
                skillName: item.name
            };
        } else {
            const dbSkill = allSkills.find((s: any) => s.SkillID === item.id);
            return {
                isNew: false, 
                skillId: item.id,
                skillName: dbSkill ? dbSkill.SkillName : item.name
            };
        }
    });
};

export const analyzeTextWithAI = async (rawText: string) => {
    const allSkills = await skillService.getAllSkills(); 
    const dictionary = allSkills.map((s: any) => ({ id: s.SkillID, name: s.SkillName }));
    const prompt = buildSkillAnalysisPrompt(rawText, dictionary);
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });
    const parsedResults = parseAIResponse(result.text || "");
    return mapFinalSkills(parsedResults, allSkills);
};

const ensureSkillsExist = async (connection: any, skillsToSave: any[]) => {
    const finalSkillIdsToSave = [];
    
    for (const skill of skillsToSave) {
        let currentSkillId = skill.skillId;

        if (skill.isNew === true || !currentSkillId) {
            const cleanName = skill.skillName.trim();
            const [existing]: any = await connection.query(
                `SELECT SkillID FROM Skills WHERE SkillName = ?`, [cleanName]
            );

            if (existing.length > 0) {
                currentSkillId = existing[0].SkillID;
            } else {
                const [insertResult]: any = await connection.query(
                    `INSERT INTO Skills (SkillName) VALUES (?)`, [cleanName]
                );
                currentSkillId = insertResult.insertId;
            }
        }

        if (currentSkillId) {
            finalSkillIdsToSave.push({
                id: currentSkillId,
                level: skill.level || 'Intermediate'
            });
        }
    }
    return finalSkillIdsToSave;
};

const syncCandidateSkills = async (connection: any, userId: number, finalSkillIdsToSave: any[]) => {
    const wantedSkillIds = finalSkillIdsToSave.map(s => s.id); 

    if (wantedSkillIds.length > 0) {
        await connection.query(
            `DELETE FROM CandidateSkills WHERE CandidateID = ? AND SkillID NOT IN (?)`,
            [userId, wantedSkillIds]
        );
    } else {
        await connection.query(
            `DELETE FROM CandidateSkills WHERE CandidateID = ?`,
            [userId]
        );
    }

    if (finalSkillIdsToSave.length > 0) {
        const valuesToUpsert = finalSkillIdsToSave.map(item => [userId, item.id, item.level]);
        await connection.query(
            `INSERT INTO CandidateSkills (CandidateID, SkillID, SkillLevel) 
             VALUES ? 
             ON DUPLICATE KEY UPDATE SkillLevel = VALUES(SkillLevel)`,
            [valuesToUpsert]
        );
    }
};

export const updateCandidateSkills = async (connection: PoolConnection, userId: number, skillsToSave: any[]) => {
    const finalSkills = await ensureSkillsExist(connection, skillsToSave);
    await syncCandidateSkills(connection, userId, finalSkills);
};

export const saveSkillsTransaction = async (userId: number, skillsToSave: any[]) => {
    const connection = await pool.getConnection(); 
    await connection.beginTransaction();

    try {
        await updateCandidateSkills(connection, userId, skillsToSave);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getCandidatesListForEmployer = async () => {
    const query = `
        SELECT 
            CandidateID, 
            FullName, 
            AvatarUrl, 
            Email, 
            Phone
        FROM Candidates
        ORDER BY CandidateID DESC
    `;
    const [rows]: any = await pool.query(query);
    return rows;
};

export const getMonthlyNewCandidates = async () => {
    const query = `
        SELECT 
            COUNT(CASE
                WHEN YEAR(CreatedAt) = YEAR(CURDATE())
                AND MONTH(CreatedAt) = MONTH(CURDATE())
                THEN 1 END) As currentMonth,

                COUNT(CASE
                    WHEN YEAR(CreatedAt) = YEAR(CURDATE() - INTERVAL 1 MONTH)
                    AND MONTH(CreatedAt) = MONTH(CURDATE() - INTERVAL 1 MONTH)
                    THEN 1 END) As lastMonth 
        FROM Users WHERE Role = 'Candidate'
    `;
    const [rows]: any = await pool.query(query);
    const { currentMonth = 0, lastMonth = 0 } = rows[0];
    const percentageChange = lastMonth === 0 ?
        (currentMonth > 0 ? 100 : 0)
        : ((currentMonth - lastMonth) / lastMonth) * 100;
    return {
        currentMonth,
        lastMonth,
        percentChange: Number(percentageChange.toFixed(1))
    };
}
export const get7DayCandidateStats = async () => {
    const query = `
        SELECT
            DATE(CreatedAt) AS date,
            COUNT(*) AS count
        FROM Candidates
        WHERE CreatedAt >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(CreatedAt)
        ORDER BY DATE(CreatedAt) ASC      
    `;
    const [rows]: any = await pool.query(query);

    const statsMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        statsMap[dateString] = 0;
    }

    rows.forEach((row: any) => {
        const dateString = row.date.toISOString().split('T')[0];
        statsMap[dateString] = row.count;
    });

    return Object.entries(statsMap).map(([date, count]) => ({ date, count }));
}
export const getAllCandidates = async (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    let totalpage : number | undefined = undefined;
    let total : number | undefined = undefined;
    if (page === 1) {
        const countQuery = `SELECT COUNT(*) AS total FROM Candidates`;
        const [countResult]: any = await pool.query(countQuery);
        total = countResult[0].total;
        totalpage = Math.ceil((total || 0) / limit);
    }
    const query = `
        SELECT 
            c.CandidateID, 
            c.FullName, 
            c.AvatarUrl, 
            c.Phone,
            c.CreatedAt,
            c.DateOfBirth,
            c.Address,
            c.ExperienceYears,
            c.Education,
            u.Email, 
            u.Status
        FROM Candidates c
        JOIN Users u ON c.CandidateID = u.UserID
        WHERE u.Role = 'Candidate'
        ORDER BY CandidateID DESC
        LIMIT ? OFFSET ?
    `;
    const [rows]: any = await pool.query(query, [limit, offset]);
    return {
        items: rows as Candidate[],
        ...(total !== undefined) && { totalpage, total }
    }
}

export const getCandidateInfo = async (candidateId: number) => {
    const query = `
        SELECT 
            c.CandidateID,
            c.FullName,
            c.Phone,
            c.DateOfBirth,
            c.Address,
            c.AvatarUrl,
            u.Email
        FROM Candidates c
        JOIN Users u ON c.CandidateID = u.UserID
        WHERE c.CandidateID = ?
    `;

    const [rows]: any = await pool.query(query, [candidateId]);
    return rows[0] as ICandidateInfo;
}