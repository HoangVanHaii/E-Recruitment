import api from "./api";

export const getAllCandidates = async (page: number, limit: number) => {
    const response = await api.get('/candidates/admin/all-candidates', {
        params: { page, limit }
    });
    return response.data;
};