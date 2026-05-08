import api from "./api";

export const getAllEmployers = async (page: number, limit: number) => {
    const response = await api.get('/employers/all-employers', {
        params: { page, limit }
    });
    console.log("Response from getAllEmployers:", response.data);
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