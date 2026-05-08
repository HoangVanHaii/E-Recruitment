import { GoogleGenAI } from '@google/genai';
import pool from "../config/database"; 
import { AppError } from '../utils/appError';
import { iResumeDetail,iResume } from '../interface/resume';
import { updateCandidateSkills, upsertCandidateProfile } from './candidate';
import ResumeDetail from '../model/resumeDetail';
import { generateAndStoreVector } from '../utils/ai';
import { Candidate } from '../interface/candidate';
const ai = new GoogleGenAI({});

export const generateResumeSummary = async (resumeData: any) => {
    try {
        const targetTitle = resumeData.targetTitle || 'Nhân viên';
        const skills = resumeData.skills && resumeData.skills.length > 0 
            ? resumeData.skills.map((s: any) => s.skillName || s).join(', ') 
            : 'Chưa cập nhật';
        
        let experienceText = 'Chưa có kinh nghiệm thực tế (Fresher/Intern).';
        if (resumeData.experience && resumeData.experience.length > 0) {
            experienceText = resumeData.experience.map((exp: any) => 
                `- ${exp.position} tại ${exp.companyName} (${exp.description || 'Không có mô tả'})`
            ).join('\n');
        }

        let educationText = 'Chưa cập nhật';
        if (resumeData.education && resumeData.education.length > 0) {
            educationText = resumeData.education.map((edu: any) => 
                `- ${edu.degree} ngành ${edu.major} tại ${edu.institution}`
            ).join('\n');
        }

        let projectsText = 'Chưa cập nhật dự án.';
        if (resumeData.projects && resumeData.projects.length > 0) {
            projectsText = resumeData.projects.map((prj: any) => {
                const techs = Array.isArray(prj.technologies) ? prj.technologies.join(', ') : '';
                return `- Dự án: ${prj.projectName} | Vai trò: ${prj.role} | Công nghệ: ${techs}`;
            }).join('\n');
        }

        const prompt = `
        Bạn là một chuyên gia tuyển dụng (HR Director) tài ba. 
        Nhiệm vụ của bạn là viết MỘT đoạn văn ngắn (khoảng 3-4 câu, dưới 100 chữ) để làm phần "Tóm tắt mục tiêu nghề nghiệp (Summary)" cho ứng viên ứng tuyển vị trí: ${targetTitle}.
        
        YÊU CẦU NGHIÊM NGẶT:
        - Giọng văn: Chuyên nghiệp, tự tin, mang danh xưng ngôi thứ nhất (tôi).
        - Nêu bật được thế mạnh cốt lõi, tập trung vào việc đáp ứng được vị trí ${targetTitle}.
        - Trả về ĐÚNG MỘT ĐOẠN VĂN, không có tiêu đề, không có gạch đầu dòng, không giải thích gì thêm.

        DỮ LIỆU CỦA ỨNG VIÊN:
        * Kỹ năng: ${skills}
        * Học vấn:
        ${educationText}
        * Kinh nghiệm: 
        ${experienceText}
        * Dự án nổi bật:
        ${projectsText}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;

    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        throw new AppError("Hệ thống AI đang quá tải, sếp chịu khó tự gõ tóm tắt nhé!", 500);
    }
};

const buildResumeRichText = (data: iResumeDetail) => {
    const skills = data.skills ? data.skills.map((s: any) => s.skillName || s).join(', ') : 'Chưa có';
    const experience = data.experience ? data.experience.map((e: any) => `${e.position} tại ${e.companyName}`).join('. ') : 'Chưa có';
    const education = data.education ? data.education.map((e: any) => `${e.degree} ngành ${e.major}`).join('. ') : 'Chưa có';
    
    return `Tiêu đề CV: ${data.title || ''}. Tóm tắt: ${data.summary || ''}. Kỹ năng chuyên môn: ${skills}. Kinh nghiệm làm việc: ${experience}. Học vấn: ${education}.`;
};

export const buildManualResume = async (candidateId: number, resumeData: iResumeDetail, candidate: Candidate) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        await upsertCandidateProfile(candidate);

        const query = `INSERT INTO Resumes (CandidateID, Title, Summary, TemplateID, IsAnalyzed) VALUES (?, ?, ?, ?, ?)`;
        const [result]: any = await connection.query(query, [
            candidateId, 
            resumeData.title || 'CV Chưa Đặt Tên', 
            resumeData.summary || null, 
            resumeData.templateId || 1, 
            true
        ]);
        const newResumeId = result.insertId;

        const newResumeDetail = new ResumeDetail({
            resumeId: newResumeId,
            templateId: resumeData.templateId || 1,
            title: resumeData.title || 'CV Chưa Đặt Tên',
            AvatarUrl: resumeData.AvatarUrl || null,
            summary: resumeData.summary,
            skills: resumeData.skills || [],
            experience: resumeData.experience || [],
            education: resumeData.education || [],
            projects: resumeData.projects || []
        });
        await newResumeDetail.save();

        if (resumeData.skills && resumeData.skills.length > 0) {
            await updateCandidateSkills(connection, candidateId, resumeData.skills);
        }
        await connection.commit();
        processResumeAI(newResumeId, resumeData).catch(err => {
            console.error("AI background error:", err);
        });
        return { resumeId: newResumeId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const processResumeAI = async (resumeId: number, resumeData: iResumeDetail) => {
    try {
        const richText = buildResumeRichText(resumeData);

        const vectorId = await generateAndStoreVector(
            richText,
            'resume',
            resumeId
        );

        await pool.query(
            'UPDATE Resumes SET VectorID = ?, IsAnalyzed = ? WHERE ResumeID = ?',
            [vectorId, true, resumeId]
        );

    } catch (error) {
        console.error("Lỗi AI resume:", error);
    }
};

export const getCandidateResumes = async (candidateId: number) => {
    const query = `SELECT ResumeID, Title, Summary,TemplateID, IsAnalyzed, CreatedAt FROM Resumes WHERE CandidateID = ? ORDER BY CreatedAt DESC`;
    const [rows]: any = await pool.query(query, [candidateId]);
    return rows;
};

export const getResumeDetail = async (resumeId: number, candidateId: number) => {
    const [rows]: any = await pool.query(`SELECT ResumeID FROM Resumes WHERE ResumeID = ? AND CandidateID = ?`, [resumeId, candidateId]);
    if (rows.length === 0) return null;

    return await ResumeDetail.findOne({ resumeId });
};
export const getResumeDetailByResumeID = async (resumeId: number) => {
    const [rows]: any = await pool.query(`SELECT ResumeID FROM Resumes WHERE ResumeID = ?`, [resumeId]);
    if (rows.length === 0) return null;

    return await ResumeDetail.findOne({ resumeId });
};

export const updateManualResume = async (candidateId: number, resumeId: number, resumeData: iResumeDetail) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
       const query = `UPDATE Resumes SET Title = ?, Summary = ?, TemplateID = ? WHERE ResumeID = ? AND CandidateID = ?`;
        const [sqlResult]: any = await connection.query(query, [
            resumeData.title, 
            resumeData.summary || null, 
            resumeData.templateId || 1, 
            resumeId, 
            candidateId
        ]);
        if (sqlResult.affectedRows === 0) {
            await connection.rollback();
            return null;
        }

        const updatedMongo = await ResumeDetail.findOneAndUpdate(
            { resumeId }, 
            {
                templateId: resumeData.templateId, 
                title: resumeData.title, 
                summary: resumeData.summary,
                skills: resumeData.skills || [], 
                experience: resumeData.experience || [],
                education: resumeData.education || [], 
                projects: resumeData.projects || []
            },
            { returnDocument: 'after' }
        );

        if (resumeData.skills && resumeData.skills.length > 0) {
            await updateCandidateSkills(connection, candidateId, resumeData.skills);
        }

        const richText = buildResumeRichText(resumeData);
        const newVectorId = await generateAndStoreVector(richText, 'resume', resumeId);
        await connection.query('UPDATE Resumes SET VectorID = ? WHERE ResumeID = ?', [newVectorId, resumeId]);

        await connection.commit();
        return updatedMongo;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const deleteResume = async (resumeId: number, candidateId: number) => {
    const [result]: any = await pool.query(`DELETE FROM Resumes WHERE ResumeID = ? AND CandidateID = ?`, [resumeId, candidateId]);
    if (result.affectedRows === 0) return false;

    await ResumeDetail.findOneAndDelete({ resumeId });
    return true;
};

export const getResumeForEmployer = async (resumeId: number) => {
    return await ResumeDetail.findOne({ resumeId });
};

