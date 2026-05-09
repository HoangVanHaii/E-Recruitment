import { ref } from 'vue';
import { defineStore } from 'pinia';
import { 
    getProfile, 
    upsertProfile, 
    updateMasterProfileDetail,
    getCandidateSkills,
    analyzeSkillsTextWithAI,
    saveCandidateSkills,
    getCandidateInfo
} from '../services/candidate';
import type { ICandidateProfile, ICandidateDetail } from '../types/candidate';
import type { ICandidateSkill } from '../types/skill';
import type { ICandidate } from "../types/candidate";
import { getAllCandidates } from "../services/candidate";

export const useCandidateStore = defineStore('candidate', () => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const profile = ref<ICandidateProfile | null>(null);
    const allCandidates = ref<ICandidate[]>([]);
    const totalPages = ref<number>(0);
    const total = ref<number>(0);

    
    // Thêm mảng chứa kỹ năng hiện tại của ứng viên
    const candidateSkills = ref<ICandidateSkill[]>([]);

    const fetchAllCandidates = async (page: number, limit: number) => {
        try {
            loading.value = true;
            error.value = false;
            const response = await getAllCandidates(page, limit);
            allCandidates.value = response.data.items;
            if (response.data.totalPages != undefined) {
                totalPages.value = response.data.totalPages;
                total.value = response.data.total;
            }
        } catch (e) {
            console.error("Lỗi khi tải danh sách ứng viên:", e);
            error.value = true;
            throw e;
        } finally {
            loading.value = false;
        }
    };
    const getProfileStore = async () => {
        try {
            loading.value = true;
            const data = await getProfile();
            profile.value = data.data; 
        } catch (err: any) {
            console.error("Lỗi khi lấy Profile:", err.response?.data);
        } finally {
            loading.value = false;
        }
    }
    const getCandidateInfoStore = async () => {
        try {
            loading.value = true;
            const data = await getCandidateInfo();
            return data.data;
        } catch (err: any) {
            console.error("Lỗi khi lấy Profile:", err.response?.data);
        } finally {
            loading.value = false;
        }
    }

    const upsertProfileStore = async (formData: FormData) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await upsertProfile(formData);
            
            if(data.data) {
                 profile.value = data.data;
            }
            message.value = data.message || 'Cập nhật hồ sơ thành công!';
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật hồ sơ';
            console.error("Lỗi khi cập nhật:", err);
        } finally {
            loading.value = false;
        }
    }

    const updateMasterProfileStore = async (payload: ICandidateDetail) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            
            const data = await updateMasterProfileDetail(payload);
    
            if (data.data && profile.value) {
                profile.value = {
                    ...profile.value,
                    ...data.data     
                };
            }

            message.value = data.message || 'Cập nhật chi tiết hồ sơ thành công!';
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật';
            console.error("Lỗi khi cập nhật master profile:", err);
        } finally {
            loading.value = false;
        }
    }

    const fetchSkillsStore = async () => {
        try {
            loading.value = true;
            const data = await getCandidateSkills();
            candidateSkills.value = data.data || [];
        } catch (err: any) {
            console.error("Lỗi lấy kỹ năng:", err);
        } finally {
            loading.value = false;
        }
    };

    const analyzeSkillsWithAIStore = async (rawText: string) => {
        try {
            loading.value = true;
            error.value = false;
            const data = await analyzeSkillsTextWithAI(rawText);
            return data.data;
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'Lỗi AI phân tích kỹ năng';
            return null;
        } finally {
            loading.value = false;
        }
    };

    const saveSkillsStore = async (skillsToSave: ICandidateSkill[]) => {
        try {
            loading.value = true;
            error.value = false;
            const data = await saveCandidateSkills(skillsToSave);
            message.value = data.message || 'Lưu kỹ năng thành công!';
            
            candidateSkills.value = skillsToSave;
            return true;
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'Lỗi lưu kỹ năng';
            return false;
        } finally {
            loading.value = false;
        }
    };

    return {
        loading,
        message,
        error,
        profile,
        candidateSkills,
        getProfileStore,
        upsertProfileStore,
        updateMasterProfileStore,
        fetchSkillsStore,
        analyzeSkillsWithAIStore,
        saveSkillsStore,
        allCandidates,
        totalPages,
        total,
        fetchAllCandidates,
        getCandidateInfoStore
    }
});