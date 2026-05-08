import api from './api';

export const registerSendOtp = async (email: string) => {
    const response = await api.post('/users/request-otp', { email });
    return response.data;
}
export const verifyOtp = async (email: string, otp: string) => {
    const response = await api.post('/users/verify-otp', { email, otp });
    return response.data;
}
export const register = async (verifyToken: string, password: string, role: string) => {
    const response = await api.post('/users/register', { verifyToken, password, role });
    return response.data;
}
export const login = async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
}
export const getProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
}
export const getCurrentRole = async () => {
    const response = await api.get('/users/role');
    return response.data;
}
export const updateStatus = async (userId: number, status: string) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
}

