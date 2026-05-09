import { GoogleGenerativeAI } from "@google/generative-ai";
import { pineconeIndex } from "../config/pinecone";
import { iResumeDetail } from "../interface/resume";
import pool from "../config/database";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const expandQuery = async (q: string): Promise<string> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Bạn là chuyên gia phân tích ý định tìm kiếm việc làm.
        Nhiệm vụ: Chuyển câu lệnh tìm kiếm của người dùng thành một danh sách các từ khóa, kỹ năng và ngành nghề liên quan để tìm kiếm trong database.
        
        Quy tắc đặc biệt:
        - Nếu người dùng tìm kiếm phủ định (ví dụ: "không phải code", "phi kỹ thuật"), hãy liệt kê các ngành nghề KHÔNG liên quan đến lập trình như: "Lao động phổ thông, Marketing, Nhân sự, F&B, Chăm sóc khách hàng, Làm vườn".
        - Nếu người dùng tìm kiếm kỹ thuật, hãy mở rộng như bình thường.
        
        Từ khóa từ người dùng: "${q}"
        
        Chỉ trả về chuỗi các từ khóa mở rộng, cách nhau bằng dấu phẩy. Không giải thích gì thêm.`;

        const result = await model.generateContent(prompt);
        const expandedText = result.response.text();

        // console.log(`[AI-Expansion] Gốc: ${q} -> Mở rộng: ${expandedText}`);
        return expandedText || q;
    } catch (error) {
        console.error("Expand Query lỗi:", error);
        return q;
    }
};
export const generateEmbedding = async (text: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        console.error("Lỗi khi tạo Embedding với Gemini:", error);
        throw error;
    }
};
export const searchJobsByAI = async (searchQuery: string, topK: number = 10) => {
    const expandedQuery = await expandQuery(searchQuery);
    const queryVector = await generateEmbedding(expandedQuery);

    const queryResponse = await pineconeIndex.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter: {
            type: { $eq: 'job' }
        }
    });

    const MIN_SCORE = 0.65;
    return queryResponse.matches
        .filter((m: any) => {
            const isValidScore = (m.score || 0) >= MIN_SCORE;
            const isValidId = m.id !== null && m.id !== "" && !isNaN(Number(m.id));
            return isValidScore && isValidId;
        })
        .map((match: any) => ({
            jobId: match.id !== undefined ? Number(match.id) : 999999999,
            score: match.score || 0,
            metadata: match.metadata || {}
        }));
};
export const rerankWithAI = async (query: string, jobs: any[]) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const jobContext = jobs.map((j, i) => ({
            index: i,
            title: j.Title,
            tags: j.tags,
            requirements: j.requirements.substring(0, 300)
        }));

        const prompt = `Bạn là chuyên gia lọc hồ sơ. Người dùng tìm kiếm: "${query}".
        Dựa vào danh sách JSON dưới đây:
        ${JSON.stringify(jobContext)}

        NHIỆM VỤ:
        1. Chỉ giữ lại những công việc thực sự liên quan đến ngành nghề/kỹ năng trong từ khóa tìm kiếm.
        2. LOẠI BỎ các công việc khác ngành (Ví dụ: Search "code" thì loại bỏ "cây xanh", "thực phẩm", "tuyển dụng").
        3. Trả về mảng JSON chứa index của các job phù hợp, ưu tiên job xịn nhất lên đầu.
        
        TRẢ VỀ DUY NHẤT MẢNG JSON. Ví dụ: [0, 1]`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const match = text.match(/\[(\s*\d+\s*,?)*\]/);

        if (!match) return jobs;

        const sortedIndexes: number[] = JSON.parse(match[0]);
        return sortedIndexes.map(idx => jobs[idx]).filter(Boolean);

    } catch (error) {
        return jobs; 
    }
};
export const generateJobInsights = async (searchQuery: string, jobText: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
        Bạn là HR Director. Ứng viên đang tìm kiếm: "${searchQuery}".
        Thông tin công việc: "${jobText}".
        Hãy viết ĐÚNG 2 câu ngắn gọn (dưới 40 chữ) giải thích tại sao công việc này phù hợp với họ. Xưng "bạn". Không dùng gạch đầu dòng.
        `;
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Lỗi khi sinh Insight:", error);
        throw error;
    }
};


///////////////////////////////////////
export const RecommendJobsByAI = async (resume: iResumeDetail) => {
    await deleteJobRecommentCandidate(1);

    const resumeText = buildResumeText(resume);
    const resumeVector = await generateEmbedding(resumeText);
    const queryResponse = await pineconeIndex.query({
        vector: resumeVector,
        topK: 20,
        includeMetadata: true, 
    });
    const candidateId = 1;
    saveJobRecommendations(candidateId, queryResponse.matches);

}
export const saveJobRecommendations = async ( candidateId: number, matches: any[]) => {
    await Promise.all(
        matches.map(item =>
            pool.query(
                `INSERT INTO JobRecommendations (CandidateID, JobID, Score)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 Score = VALUES(Score),
                 RecommendedAt = CURRENT_TIMESTAMP`,
                [
                    candidateId,
                    Number(item.id),
                    item.score
                ]
            )
        )
    );
};
export const deleteJobRecommentCandidate = async (candidateId: number) => {
    await pool.query(
        `DELETE FROM JobRecommendations WHERE CandidateID = ?`,
        [candidateId]
    );
};
export const buildResumeText = (resume: iResumeDetail): string => {
    const skillsText = resume.skills?.map(s => 
        `${s.skillName}${s.level ? ` (${s.level})` : ""}`
    ).join(", ");
    const experienceText = resume.experience?.map(exp => `
        - ${exp.position} at ${exp.companyName}
        (${exp.startDate?.toISOString().slice(0,7)} - ${exp.isCurrent ? "Present" : exp.endDate?.toISOString().slice(0,7)})
        ${exp.description || ""}
    `).join("\n");
    const educationText = resume.education?.map(edu => `
        - ${edu.degree} in ${edu.major} at ${edu.institution}
        (${edu.startDate?.toISOString().slice(0,7)} - ${edu.endDate?.toISOString().slice(0,7)})
        ${edu.gpa ? `GPA: ${edu.gpa}` : ""}
    `).join("\n");
    const projectText = resume.projects?.map(p => `
        - ${p.projectName} (${p.role})
        Technologies: ${p.technologies.join(", ")}
        ${p.description || ""}
    `).join("\n");
    return `
    Candidate Profile

    Title: ${resume.title || ""}
    Summary: ${resume.summary || ""}

    Skills:
    ${skillsText || ""}

    Work Experience:
    ${experienceText || ""}

    Education:
    ${educationText || ""}

    Projects:
    ${projectText || ""}
    `;
};