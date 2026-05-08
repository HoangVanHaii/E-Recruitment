import { ref } from 'vue';
import { defineStore } from 'pinia';
import type{ iResumeDetail, iResumeList } from '../types/resume';
import { CreateResume, getListResumeOfMe, getResumeDetailById } from '../services/resume';


export const useResumeStore = defineStore('resume',() => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const errors = ref<Record<string, string>>({});


    const createResumeStore = async (resume: FormData) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await CreateResume(resume);
            message.value = data.message || 'Tạo CV thành công';
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
        } finally {
            loading.value = false;
        }

    }
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
        createResumeStore,
        getListResumeOfMeStore,
        getResumeDetailByIdStore
    }

})