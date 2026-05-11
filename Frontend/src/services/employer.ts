import api from "./api";

export const GetAllEmployer = async (status: string) => {
    const response = await api.get(`/employers/status?status=${status || 'all'}`);
    return response.data;
}
export const UpdateStatusEmployer = async (EmployerID: number, ApprovalStatus: string) => {
    const response = await api.put(`/employers/${EmployerID}/status`, { ApprovalStatus: ApprovalStatus });
    return response.data;
}
export const getDashboardStats = async () => {
    const response = await api.get('/employers/dashboard-stats');
    return response.data;
}
export const getAllEmployers = async (page: number, limit: number) => {
    const response = await api.get('/employers/all-employers', {
        params: { page, limit }
    });
    return response.data;
}
export const getTopEmployers = async () => {
    const response = await api.get('/employers/top-employers');
    return response.data;
};
export const getLogoTopEmployers = async () => {
    const response = await api.get('/employers/logo-top-employers');
    return response.data;
};
