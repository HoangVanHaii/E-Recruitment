import { ref } from 'vue';
import { defineStore } from 'pinia';
import { 
    getMyResumes, 
    getResumeDetail, 
    updateManualResume, 
    deleteResume,
    generateSummaryWithAI,
    createResume,
    getListResumeOfMe,
    getResumeDetailById
} from '../services/resume';
import type { iResumeDetail, iResume, iResumeList } from '../types/resume';

export const useResumeStore = defineStore('resume', () => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    
    const resumes = ref<iResume[]>([]); 
    const currentResume = ref<iResumeDetail | null>(null);
    const errors = ref<Record<string, string>>({});
    const generateAISummaryStore = async (payload: any) => {
        try {
            loading.value = true;
            error.value = false;
            const response = await generateSummaryWithAI(payload);
            return response.data; // Trả về đoạn text cho Component hứng
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'AI đang bận, sếp đợi xíu!';
            return null;
        } finally {
            loading.value = false;
        }
    };

    // 2. TẠO CV MỚI (SỬ DỤNG FORMDATA)
    const createResumeStore = async (formData: FormData) => {
        try {
            loading.value = true;
            error.value = false;
            message.value = '';
            
            const response = await createResume(formData);
            message.value = response.message || 'Tạo CV thành công!';
            
            // Xóa cache danh sách cũ để ép FE tải lại list mới có chứa CV vừa tạo
            resumes.value = []; 
            return response.data;
        } catch (err: any) {
            error.value = true;
            message.value = err.response?.data?.message || 'Lỗi khi tạo CV rồi sếp ơi';
            return null;
        } finally {
            loading.value = false;
        }
    };

    // 3. LẤY DANH SÁCH CV
    const fetchMyResumesStore = async () => {
        try {
            loading.value = true;
            error.value = false;
            const response = await getMyResumes();
            resumes.value = response.data || [];
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi lấy danh sách CV:", err);
        } finally {
            loading.value = false;
        }
    };

    // 4. LẤY CHI TIẾT 1 CV (ĐỂ EDIT)
    const fetchResumeDetailStore = async (resumeId: number) => {
        try {
            loading.value = true;
            error.value = false;
            currentResume.value = null; // Clear data cũ cho UI sạch sẽ
            
            const response = await getResumeDetail(resumeId);
            currentResume.value = response.data;
        } catch (err: any) {
            error.value = true;
            message.value = 'Không lấy được chi tiết CV!';
        } finally {
            loading.value = false;
        }
    };

    // 5. CẬP NHẬT CV (DÙNG JSON PAYLOAD)
    const updateResumeStore = async (resumeId: number, data: iResumeDetail) => {
        try {
            loading.value = true;
            error.value = false;
            const response = await updateManualResume(resumeId, data);
            
            message.value = response.message || 'Cập nhật CV thành công!';
            if (response.data) currentResume.value = response.data;
            return response.data;
        } catch (err: any) {
            error.value = true;
            message.value = 'Lỗi cập nhật rồi!';
            return null;
        } finally {
            loading.value = false;
        }
    };

    const deleteResumeStore = async (resumeId: number) => {
        try {
            loading.value = true;
            error.value = false;
            await deleteResume(resumeId);
            
            resumes.value = resumes.value.filter(r => r.ResumeID !== resumeId);
            return true;
        } catch (err: any) {
            error.value = true;
            return false;
        } finally {
            loading.value = false;
        }
    };
    const getListResumeOfMeStore = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getListResumeOfMe();
            const resumes = data.data || [];
            message.value = data.message || 'Lấy danh sách CV thành công';
            return resumes as iResumeList[];
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
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
            return [];
        } finally {
            loading.value = false;
        }
    }
    const getResumeDetailByIdStore = async (ResumeID: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getResumeDetailById(ResumeID); 
            const resume = data.data || null;
            message.value = data.message || 'Lấy chi tiết CV thành công';
            return resume as iResumeDetail;
    
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            if (res?.errors && Array.isArray(res.errors)) {
                const map: Record<string, string> = {};
                res.errors.forEach((e: any) => {
                    map[e.path] = e.msg;
                });
                errors.value = map;
                message.value = res.errors[0]?.msg;
            }
            else {
                message.value = res?.message || 'Đã xảy ra lỗi khi lấy chi tiết CV';
            }
            return null;
        } finally {
            loading.value = false;
        }
    }
    return {
        loading,
        message,
        error,
        resumes,
        currentResume,
        generateAISummaryStore,
        createResumeStore,
        fetchMyResumesStore,
        fetchResumeDetailStore,
        updateResumeStore,
        deleteResumeStore,
        getListResumeOfMeStore,
        getResumeDetailByIdStore
    }

})
