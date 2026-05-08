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