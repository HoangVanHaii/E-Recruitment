import api from "./api";
import type { iResumeDetail } from "../types/resume";

export const generateSummaryWithAI = async (payload: any) => {
    const response = await api.post('/resumes/generate-summary', payload);
    return response.data;
};

export const createResume = async (formData: FormData) => {
    const response = await api.post('/resumes/build', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getMyResumes = async () => {
    const response = await api.get('/resumes');
    return response.data;
};

export const getResumeDetail = async (resumeId: number) => {
    const response = await api.get(`/resumes/detail/${resumeId}`);
    return response.data;
};

export const updateManualResume = async (resumeId: number, data: iResumeDetail) => {
    const response = await api.put(`/resumes/${resumeId}`, data);
    return response.data;
};

export const deleteResume = async (resumeId: number) => {
    const response = await api.delete(`/resumes/${resumeId}`);
    return response.data;
};

export const getResumeDetailByEmployer = async (resumeId: number) => {
    const response = await api.get(`/resumes/employer/${resumeId}`);
    return response.data;
}

export const getListResumeOfMe = async () => {
    const response = await api.get('/resumes/of-me');
    return response.data;
}
export const getResumeDetailById = async (ResumeID: number) => {
    const response = await api.get(`/resumes/detail/${ResumeID}`);
    return response.data;
}
