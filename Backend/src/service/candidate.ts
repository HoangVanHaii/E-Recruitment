import pool from "../config/database";
import { Candidate } from "../interface/candidate";
import { GoogleGenAI } from "@google/genai"; 
import * as skillService from "./skill";
import { PoolConnection } from "mysql2/promise";

export const upsertCandidateProfile = async (connection: PoolConnection, data: Candidate) => {
    console.log("Dữ liệu hồ sơ ứng viên nhận được để upsert:", data);
    const query = `INSERT INTO Candidates (CandidateID, FullName, Phone, DateOfBirth, Address, ExperienceYears, Education, AvatarUrl)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                       FullName = VALUES(FullName),
                       Phone = VALUES(Phone),
                       DateOfBirth = VALUES(DateOfBirth),
                       Address = VALUES(Address),
                       ExperienceYears = VALUES(ExperienceYears),
                       Education = VALUES(Education),
                       AvatarUrl = VALUES(AvatarUrl)
                  `;
    const values = [
        data.CandidateID, 
        data.FullName, 
        data.Phone || null, 
        data.DateOfBirth || null, 
        data.Address || null, 
        data.ExperienceYears || 0, 
        data.Education || null, 
        data.AvatarUrl || null
    ];

    const [result]: any = await connection.query(query, values);
    console.log("Kết quả upsert hồ sơ ứng viên:", result);
    return result;
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
    return rows[0];
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
        Bạn là một Trưởng phòng Nhân sự cấp cao đa ngành nghề. Dưới đây là đoạn văn bản ứng viên mô tả kỹ năng của họ:
        "${rawText}"
        
        Và đây là danh sách CÁC KỸ NĂNG CHUẨN đang có trong hệ thống database của tôi:
        ${JSON.stringify(dictionary)}
        
        Nhiệm vụ của bạn:
        1. Trích xuất TẤT CẢ các kỹ năng từ đoạn văn bản trên.
        2. Đối chiếu với danh sách chuẩn. Nếu khớp (kể cả đồng nghĩa/viết tắt), hãy lấy 'id' chuẩn.
        3. QUAN TRỌNG: Nếu ứng viên có một kỹ năng MỚI HOÀN TOÀN (không có trong danh sách), hãy trích xuất nó và gán 'id' là chuỗi "new".
        4. CHỈ trả về một mảng JSON với cấu trúc object. TUYỆT ĐỐI không trả về chữ hay giải thích thêm.
        
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
    const [rows]: any = await connection.query(
        `SELECT SkillID FROM CandidateSkills WHERE CandidateID = ?`, [userId]
    );
    const currentSkillIds = rows.map((r: any) => r.SkillID); 
    const wantedSkillIds = finalSkillIdsToSave.map(s => s.id); 

    const idsToRemove = currentSkillIds.filter((id: number) => !wantedSkillIds.includes(id)); 
    const itemsToAdd = finalSkillIdsToSave.filter(s => !currentSkillIds.includes(s.id)); 

    if (idsToRemove.length > 0) {
        await connection.query(
            `DELETE FROM CandidateSkills WHERE CandidateID = ? AND SkillID IN (?)`,
            [userId, idsToRemove]
        );
    }

    if (itemsToAdd.length > 0) {
        const valuesToInsert = itemsToAdd.map(item => [userId, item.id, item.level]);
        await connection.query(
            `INSERT INTO CandidateSkills (CandidateID, SkillID, SkillLevel) VALUES ?`,
            [valuesToInsert]
        );
    }
};

export const updateCandidateSkills = async (connection: PoolConnection, userId: number, skillsToSave: any[]) => {
    const finalSkills = await ensureSkillsExist(connection, skillsToSave);
    await syncCandidateSkills(connection, userId, finalSkills);
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
                THEN 1 END) As currentCount,

                COUNT(CASE
                    WHEN YEAR(CreatedAt) = YEAR(CURDATE() - INTERVAL 1 MONTH)
                    AND MONTH(CreatedAt) = MONTH(CURDATE() - INTERVAL 1 MONTH)
                    THEN 1 END) As lastCount 
        FROM Candidates
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
        totalpage = Math.ceil(total || 0 / limit);
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