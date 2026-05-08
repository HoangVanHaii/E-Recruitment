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