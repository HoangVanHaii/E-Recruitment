import api from "./api";

export const CreateResume = async (resumeData: FormData) => {
    const response = await api.post('/resumes/build', resumeData);
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