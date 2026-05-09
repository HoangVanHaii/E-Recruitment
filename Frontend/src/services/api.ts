import axios from "axios";
import { disconnectSocket } from "./socket";
const api = axios.create({
    baseURL: import.meta.env.REACT_APP_API_BASE_URL || 'https://jobportal-rs7w.onrender.com/api',
});
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && originalRequest.url.includes('/login')) {
            return Promise.reject(error);
        }
        // if (error.response?.status === 403) {
        //     console.error("Bạn không có quyền truy cập!");
        //     window.location.href = '/403'; // Điều hướng sang trang 403
        //     return Promise.reject(error);
        // }
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    // handleLogout();
                    return Promise.reject(error);
                }
                const res = await axios.post(`${api.defaults.baseURL}/users/refresh-token`, {
                    refreshToken: refreshToken
                });

                if (res.status === 200) {
                    const newAccessToken = res.data.data;
                    localStorage.setItem('accessToken', newAccessToken);
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                handleLogout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    disconnectSocket();
};

export default api;