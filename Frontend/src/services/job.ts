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
export const updateJob = async (jobId: number, jobData: FormData) => {   
    const response = await api.put(`/jobs/update-job/${jobId}`, jobData);
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
export const getJobStatsForAdmin = async () => {
    const response = await api.get('/jobs/admin/monthly-new-candidates');
    return response.data;
}
export const get7DayStartsForAdmin = async () => {
    const response = await api.get('/jobs/admin/7-day-stats');
    return response.data;
}
export const getTopJobsForAdmin = async () => {
    const response = await api.get('/jobs/admin/top-jobs');
    return response.data;
}
export const getJobForAdminByStatus = async (status: string, page: number = 1, limit: number = 10) => {
    const response = await api.get('/jobs/admin/jobs-by-status', {
        params: { status, page, limit }
    });
    return response.data;
}
export const changeStatusJob = async (jobId: number, status: string) => {
    const response = await api.put(`/jobs/admin/change-status-job/${jobId}`, { status });
    return response.data;
}
export const searchJobByCategory = async (categoryId: number, page: number = 1, limit: number = 10) => {
    const response = await api.get(`/jobs/search-by-category/${categoryId}`, {
        params: { page, limit }
    });
    return response.data;
}