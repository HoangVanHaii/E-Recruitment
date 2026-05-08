import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { IProfile } from '../types/user';
import { getProfile, login, register, registerSendOtp, updateStatus, verifyOtp } from '../services/auth';
import { useMessageStore } from './message';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { IUser } from '../types/user';


export const useAuthStore = defineStore('auth',() => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const user = ref<IProfile | null>(null);
    const error = ref<boolean>(false);
    const accessToken = ref<string>('');
    const refreshToken = ref<string>('');
    const isLogin = ref<boolean>(false);
    const verifyToken = ref<string>('');
    const role = ref<string>('');
    const emailUser = ref<string>('');
    

    const registerSendOtpStore = async (email: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await registerSendOtp(email);
            emailUser.value = email;
            message.value = data.message || 'Gửi OTP thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi gửi OTP:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi gửi OTP';
        } finally {
            loading.value = false;
        }

    }
    const verifyOtpStore = async (email: string, otp: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';

            const data = await verifyOtp(email, otp);
            message.value = data.message || 'Xác thực OTP thành công';
            verifyToken.value = data.data.verifyToken;

        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi xác thực OTP:", err.ressponse?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi xác thực OTP';
        } finally {
            loading.value = false;
        }
    }
    const registerStore = async (verifyToken: string, password: string, role: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await register(verifyToken, password, role);
            message.value = data.message || 'Đăng ký thành công';
            
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi đăng ký:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký';

        }finally {
            loading.value = false;
        }
    }
    const loginStore = async (email: string, password: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await login(email, password);
            accessToken.value = data.data.accessToken;
            refreshToken.value = data.data.refreshToken;
            role.value = data.data.role;
            isLogin.value = true;
            message.value = data.message || 'Đăng nhập thành công';

            const token = localStorage.getItem('accessToken');
            if (token) {
                connectSocket(token);
                const messageStore = useMessageStore();
                messageStore.initSocketListeners();
            }
            localStorage.setItem("accessToken", data.data.accessToken);
            localStorage.setItem("refreshToken", data.data.refreshToken);
            localStorage.setItem("role", data.data.role);
            
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi đăng nhập:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập';
        } finally {
            loading.value = false;
        }
    }
    const fetchProfile = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getProfile();
            isLogin.value = true;
            user.value = data.data;
            const token = localStorage.getItem('accessToken');
            if (token) {
                connectSocket(token);
                const messageStore = useMessageStore();
                messageStore.initSocketListeners();
            }
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy thông tin người dùng:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin người dùng';
        } finally {
            loading.value = false;
        }
    }
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        disconnectSocket();
        window.location.href = '/login-section';
    };
    const updateStatusStore = async (userId: number, status: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await updateStatus(userId, status);
            message.value = data.message || 'Cập nhật trạng thái người dùng thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi cập nhật trạng thái người dùng:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật trạng thái người dùng';
        } finally {
            loading.value = false;
        }
    }
    return {
        loading,
        message,
        user,
        error,
        isLogin,
        accessToken,
        refreshToken,
        emailUser,
        verifyToken,
        role,
        registerSendOtpStore,
        verifyOtpStore,
        registerStore,
        loginStore,
        fetchProfile,
        handleLogout,
        updateStatusStore
    }

})