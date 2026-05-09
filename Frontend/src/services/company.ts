import api from "./api";

export const CreateCompany = async (formData: FormData) => {
    const response = await api.post('/company', formData);
    return response.data;
}
export const GetAllCompany = async () => {
    const response = await api.get('/company');
    return response.data;
}
export const requestCompany = async (companyID: number, Position: string) => {
    const response = await api.post(`/company/${companyID}/request`, { Position });
    return response.data;
}
export const getCompanyOfMe = async () => {
    const response = await api.get('/company/me');
    return response.data;
}
export const GetCompanyDetailOfMe = async () => {
    const response = await api.get(`/company/Detail/ofme`);
    return response.data;
}
export const UpdateCompany = async (companyID: number, formData: FormData) => {
    const response = await api.put(`/company/${companyID}`, formData);
    return response.data;
}
export const getAllCompanyForAdmin = async (page?: number, limit?: number) => {
    const params: any = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const response = await api.get('/company/admin/all', { params });
    return response.data;
}
export const getCompanyByIdForAdmin = async (companyID: number) => {
    const response = await api.get(`/company/admin/${companyID}`);
    return response.data;
}
export const updateCompanyStatus = async (companyID: number, status: string) => {
    const response = await api.put(`/company/admin/${companyID}/status`, { status });
    return response.data;
}