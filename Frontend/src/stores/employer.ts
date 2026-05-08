import { defineStore } from "pinia";
import { ref } from "vue";
import { getAllEmployers, getLogoTopEmployers, getTopEmployers } from "../services/employer";
import type { IEmployerForAdmin } from "../types/employer";
export const useEmployerStore = defineStore("employer", () => {
    const allEmployers = ref<IEmployerForAdmin[]>([]);
    const loading = ref<boolean>(false);
    const error = ref<string>('');
    const totalpages = ref<number>(0);
    const total = ref<number>(0);
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
            error.value = '';
            const response = await getAllEmployers(page, limit);
            allEmployers.value = response.data.items;
            if(response.data.totalPages != undefined) {
                totalpages.value = response.data.totalPages;
                total.value = response.data.total;
            }
        } catch (e) {
            console.error("Lỗi khi load tất cả nhà tuyển dụng:", e);
            error.value = "Không thể tải danh sách nhà tuyển dụng";
            throw e;
        } finally {
            loading.value = false;
        }
    };
    const fetchLogoTopEmployers = async () => {
        try {
            const response = await getLogoTopEmployers();
            return response.data;
        } catch (error) {
            console.error("Lỗi khi load logo top nhà tuyển dụng:", error);
            throw error;
        }
    }
    return { fetchTopEmployers, fetchAllEmployers, fetchLogoTopEmployers,allEmployers, loading, error, totalpages, total };
});