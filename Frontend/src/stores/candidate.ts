import { defineStore } from "pinia";
import { ref } from "vue";
import type { ICandidate } from "../types/candidate";
import { getAllCandidates } from "../services/candidate";

export const useCandidateStore = defineStore("candidate", () => {
    const loading = ref<boolean>(false);
    const error = ref<string>('');
    const allCandidates = ref<ICandidate[]>([]);
    const totalPages = ref<number>(0);
    const total = ref<number>(0);

    const fetchAllCandidates = async (page: number, limit: number) => {
        try {
            loading.value = true;
            error.value = '';
            const response = await getAllCandidates(page, limit);
            allCandidates.value = response.data.items;
            if (response.data.totalPages != undefined) {
                totalPages.value = response.data.totalPages;
                total.value = response.data.total;
            }
        } catch (e) {
            console.error("Lỗi khi tải danh sách ứng viên:", e);
            error.value = "Không thể tải danh sách ứng viên";
            throw e;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        error,
        allCandidates,
        totalPages,
        total,
        fetchAllCandidates
    };
});