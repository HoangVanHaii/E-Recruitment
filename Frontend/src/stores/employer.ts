import { ref } from 'vue';
import { defineStore } from 'pinia';
import { GetAllEmployer, getDashboardStats, UpdateStatusEmployer } from '../services/employer';
import { getAllEmployers, getLogoTopEmployers, getTopEmployers } from "../services/employer";
import type { IEmployerForAdmin } from "../types/employer";

export const useEmployerStore = defineStore('employer', () => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const allEmployers = ref<IEmployerForAdmin[]>([]);
    const totalpages = ref<number>(0);
    const total = ref<number>(0);
    const errors = ref<Record<string, string>>({});
    
    
    const updateStatusEmployerStore = async (EmployerID: number, ApprovalStatus: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            await UpdateStatusEmployer(EmployerID, ApprovalStatus);
            
            message.value = 'Cập nhật trạng thái nhân viên thành công';
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error updateStatusEmployerStore', res);
            if (res?.errors && Array.isArray(res.errors)) {
                const map: Record<string, string> = {};
                res.errors.forEach((e: any) => {
                    map[e.path] = e.msg;
                });
                errors.value = map;
                message.value = res.errors[0]?.msg;
            }
            else {
                message.value = res?.message || 'Đã xảy ra lỗi';
            }
        } finally {
            loading.value = false;
        }
    }
    const getEmployerStatusStore = async (status: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await GetAllEmployer(status);
            message.value = data.message || 'Lấy danh sách yêu cầu nhân viên thành công';
            return data.data || [];
        } catch (err: any) {
            error.value = true;
            console.log('Error getEmployerStatusStore', err);
            console.error("Lỗi khi lấy danh sách yêu cầu nhân viên:", err.response?.data);
            message.value = err.response?.data?.message || 'Lỗi khi lấy ds yêu cầu nhân viên';
        } finally {
            loading.value = false;
        }
    }
    const getDashboardStatsStore = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getDashboardStats();
            message.value = data.message || 'Lấy thống kê dashboard thành công';
            return data.data || {};
        } catch (err: any) {
            error.value = true;
            console.log('Error getDashboardStatsStore', err);
            console.error("Lỗi khi lấy thống kê dashboard:", err.response?.data);
            message.value = err.response?.data?.message || 'Lỗi khi lấy thống kê dashboard';
        } finally {
            loading.value = false;
        }
    }
     const fetchTopEmployers = async () => {
        try {
            const topEmployersData = await getTopEmployers();
            return topEmployersData.data;
        } catch (error) {
            console.error("Lỗi khi load top nhà tuyển dụng:", error);
            throw error;
        }
    };
    const fetchAllEmployers = async (page: number, limit: number) => { 
        try {
            loading.value = true;
            error.value = false;
            const response = await getAllEmployers(page, limit);
            allEmployers.value = response.data.items;
            if (response.data.totalpage != undefined) {
                totalpages.value = response.data.totalpage;
                total.value = response.data.total;
            }
        } catch (e) {
            console.error("Lỗi khi load tất cả nhà tuyển dụng:", e);
            error.value = true;
            throw e;
        } finally {
            loading.value = false;
        }
    };
    const fetchLogoTopEmployers = async () => {
        try {
            const response = await getLogoTopEmployers();
            return response.data;
        } catch (er) {
            console.error("Lỗi khi load logo top nhà tuyển dụng:", er);
            error.value = true;
            throw er;
        }
    }
    return {
        loading,
        message,
        error,
        errors,
        updateStatusEmployerStore,
        getEmployerStatusStore,
        getDashboardStatsStore,
      fetchTopEmployers,
      fetchAllEmployers, 
      fetchLogoTopEmployers,
      allEmployers,
      totalpages,
      total
    }

})
