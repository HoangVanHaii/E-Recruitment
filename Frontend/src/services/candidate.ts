import api from "./api";
import type { ICandidateDetail } from "../types/candidate";
import type { ICandidateSkill } from "../types/skill";

export const getProfile = async () => {
    const response = await api.get('/candidates/profile'); 
    return response.data;
}

export const getCandidateInfo = async () => {
    const response = await api.get('/candidates/info'); 
    return response.data;
}

export const upsertProfile = async (formData: FormData) => {
    const response = await api.post('/candidates/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
}

export const updateMasterProfileDetail = async (data: ICandidateDetail) => {
    const response = await api.put('/candidates/profile-detail', data);
    return response.data;
}

export const getCandidateSkills = async () => {
    const response = await api.get('/candidates/skills');
    return response.data;
}

export const analyzeSkillsTextWithAI = async (rawText: string) => {
    const response = await api.post('/candidates/skills/analyze-text', { rawText });
    return response.data;
}

export const saveCandidateSkills = async (skills: ICandidateSkill[]) => {
    const response = await api.post('/candidates/skills', { skills });
    return response.data;
}

export const getAllCandidates = async (page: number, limit: number) => {
    const response = await api.get('/candidates/admin/all-candidates', {
        params: { page, limit }
    });
    return response.data;
};
