import api from "./api";

export const getJobApplications = async (jobID: number, page: number = 1, limit: number = 6) => {
    const response = await api.get(`/job-application/job/${jobID}`, {
        
        params: { page, limit }
    });
    return response.data;
}
export const getApplicationDetail = async (applicationID: number) => {
    const response = await api.get(`/job-application/${applicationID}`);
    return response.data;
}
export const updateStatusApplication = async (applicationID: number, status: string) => {
    const response = await api.put(`/job-application/${applicationID}/status`, { Status: status });
    return response.data;
}

export const applyJob = async (JobID: number, ResumeID: number) => {
    const response = await api.post('/job-application', { JobID, ResumeID });
    return response.data;
}

export const getSubmittedApplications = async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/job-application/ofme', {
        params: { page, limit }
    });
    return response.data;
}
export const getChartStats = async (type: string) => {
    const response = await api.get('/job-application/stats', { params: { type } });
    return response.data;
}
export const ApplyJob = async (JobID: number, ResumeID: number) => {
    const response = await api.post(`/job-application/`, {JobID, ResumeID});
    return response.data;
}