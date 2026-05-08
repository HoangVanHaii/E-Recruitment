import { ref } from 'vue';
import { defineStore } from 'pinia';
import { 
    createManualResume, 
    getMyResumes, 
    getResumeDetail, 
    updateManualResume, 
    deleteResume,
    generateSummaryWithAI
} from '../services/resume';
// Import đúng 2 cái interface quan trọng nhất
import type { iResumeDetail, iResume } from '../types/resume';

export const useResumeStore = defineStore('resume', () => {
    // ================= STATE (TRẠNG THÁI) =================
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    
    // Danh sách CV (để hiện ở trang quản lý)
    const resumes = ref<iResume[]>([]); 
    
    // Chi tiết 1 bản CV đang được chọn để Sửa hoặc Xem
    const currentResume = ref<iResumeDetail | null>(null);

    // ================= ACTIONS (HÀNH ĐỘNG) =================

    // 1. AI VIẾT TÓM TẮT
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
            
            const response = await createManualResume(formData);
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

    // 6. XÓA CV
    const deleteResumeStore = async (resumeId: number) => {
        try {
            loading.value = true;
            error.value = false;
            await deleteResume(resumeId);
            
            // Xóa xong thì lọc mảng luôn cho nó mất tiêu trên màn hình (UX xịn)
            resumes.value = resumes.value.filter(r => r.ResumeID !== resumeId);
            return true;
        } catch (err: any) {
            error.value = true;
            return false;
        } finally {
            loading.value = false;
        }
    };

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
        deleteResumeStore
    };
});