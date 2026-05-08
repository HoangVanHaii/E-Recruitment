import api from "./api";

export const getAllJobs = async (filters: {
    page: number;
    limit: number;
    categoryId?: number;
    location?: string;
    minSalary?: number;
    maxSalary?: number;
}) => {
    const response = await api.get("/jobs", { params: filters });
    return response.data;
};
export const getAllCategories = async () => {
    const response = await api.get("/jobs/job-categories");
    return response.data;
}
export const getJobDetail = async (id: number) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
};
export const searchJobs = async (query: string) => {
    const response = await api.get("/jobs/search-ai", { params: { q: query } });
    console.log("SearchJobs response:", response.data);
    return response.data;
}
export const savedJob = async (jobId: number) => {
    const response = await api.post(`/saved-job/${jobId}`);
    return response.data;
};
export const unsaveJob = async (jobId: number) => {
    const response = await api.delete(`/saved-job/unsave-job/${jobId}`);
    return response.data;
}
export const getMySavedJobs = async (page: number, limit: number) => {
    const response = await api.get("/saved-job", { params: { page, limit } });
    return response.data;
}
export const isSavedJob = async (jobId: number) => {
    const response = await api.get(`/saved-job/${jobId}`);
    return response.data;
}
export const createJob = async (jobData: any) => {
    const response = await api.post('/jobs/create-job', jobData);
    return response.data;
}
export const getJobOfMe = async (page: number = 1, limit: number = 6, status: string = "All") => {
    const response = await api.get('/jobs/job-of-me', {
        params: { page, limit, status }
    });
    return response.data;
}
export const deleteJob = async (jobID: number) => {
    const response = await api.delete(`/jobs/soft-delete-job/${jobID}`);
    return response.data;
}
