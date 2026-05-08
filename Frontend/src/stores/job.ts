import { ref } from 'vue';
import { defineStore } from 'pinia';
import { createJob, deleteJob, getJobOfMe } from '../services/job';
import type{ IListJob, IJob, IJobDetail } from '../types/job';
import { getAllCategories, getAllJobs, getJobDetail, getMySavedJobs, isSavedJob, savedJob, searchJobs, unsaveJob } from '../services/job';

export const useJobStore = defineStore('job',() => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const errors = ref<Record<string, string>>({});
    const listJobMe = ref<IListJob[]>([]);
    const hasNextPage = ref(false);

    const jobs = ref<IJob[]>([]);
    const totalPages = ref<number>(1);
    const errorLog = ref<string>('');
    const listCategoryJobs = ref<{ CategoryID: number; CategoryName: string }[]>([]);
    const listSavedJobs = ref<IJob[]>([]);
    const savedJobsTotalPages = ref<number>(1);
    const jobDetail = ref<IJobDetail | null>(null);
    const listJobSearch = ref<IJob[]>([]);

    const fetchJobs = async (filters: any) => {
        if (filters.minSalary) filters.minSalary *= 1000000;
        if (filters.maxSalary) filters.maxSalary *= 1000000;
        try {
            loading.value = true;
            errorLog.value = '';

            const response = await getAllJobs(filters);

            jobs.value = response.data.items || [];

            if (response.data.totalPages !== undefined) {
                totalPages.value = response.data.totalPages;
            }

            if (jobs.value.length === 0) {
                totalPages.value = 1;
            }

        } catch (err: any) {
            console.error("Lỗi khi lấy danh sách job:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách job';
        } finally {
            loading.value = false;
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await getAllCategories();
            listCategoryJobs.value = response.data || [];
        } catch (err: any) {
            console.error("Lỗi khi lấy danh sách category:", err.response?.data);
        }
    }
    const fetchJobDetail = async (id: number) => {
        try {
            loading.value = true;
            errorLog.value = '';
            const response = await getJobDetail(id);
            jobDetail.value = response.data || null;
        } catch (err: any) {
            console.error("Lỗi khi lấy chi tiết job:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy chi tiết job';
        } finally {
            loading.value = false;
        }
    };


    const handleSavedJob = async (jobId: number) => {
        try {
            await savedJob(jobId);
            listSavedJobs.value.push(jobs.value.find(j => j.JobID === jobId) as IJob);
        } catch (err: any) {
            console.error("Lỗi khi lưu job:", err.response?.data);
        }
    };
    const handleUnsaveJob = async (jobId: number) => {
        try {
            listSavedJobs.value = listSavedJobs.value.filter(job => job.JobID !== jobId);
            await unsaveJob(jobId);
        } catch (err: any) {
            console.error("Lỗi khi bỏ lưu job:", err.response?.data);
        }
    };
    const fetchMySavedJobs = async (page: number, limit: number) => {
        try {
            loading.value = true;
            errorLog.value = '';
            const response = await getMySavedJobs(page, limit);
            listSavedJobs.value = response.data.items || [];
            savedJobsTotalPages.value = response.data.totalPages || 1;
            if (listSavedJobs.value.length === 0) {
                savedJobsTotalPages.value = 1;
            }   
        } catch (err: any) {
            console.error("Lỗi khi lấy danh sách job đã lưu:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy danh sách job đã lưu';
        } finally {
            loading.value = false;
        }
    };
    const checkIsSavedJob = async (jobId: number) => {
        try {
            const isSaved = await isSavedJob(jobId);
            return isSaved.data;
        } catch (error) {
            console.error("Lỗi khi kiểm tra trạng thái lưu job:", error);
            return false;
        }
    }
    const fetchJobSearch = async (query: string) => {
        try {
            errorLog.value = '';
            const response = await searchJobs(query);
            listJobSearch.value = response.data || [];
        } catch (err: any) {
            console.error("Lỗi khi tìm kiếm job:", err.response?.data);
            error.value = err.response?.data?.message || 'Đã xảy ra lỗi khi tìm kiếm job';
        } 
    }

    const createJobStore = async (job: any) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await createJob(job);
            message.value = data.message || 'Tạo công việc thành công';
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error response from createJob:', res);
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
    const getJobOfMeStore = async (page: number = 1, limit: number = 6, status: string = "All") => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getJobOfMe(page, limit, status);
            const jobs = data.data || [];
            if (page > 1 && jobs.length === 0) {
                hasNextPage.value = false;
                message.value = 'Không còn công việc nào nữa';
                return false;
            }
            listJobMe.value = jobs || [];
            message.value = data.message || 'Lấy công việc thành công';
            hasNextPage.value = data.data.length === limit;
            return true;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error response from getJobOfMe:', res);
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
            return false;
        } finally {
            loading.value = false;
        }
    }
    const getJobDetailStore = async (jobID: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getJobDetail(jobID);
            message.value = data.message || 'Lấy công việc thành công';
            return data.data || null;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error response from getJobDetail:', res);
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
    const deleteJobStore = async (jobID: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await deleteJob(jobID);
            message.value = data.message || 'Xóa công việc thành công';
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error response from deleteJob:', res);
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

    return {
        loading,
        message,
        error,
        listJobMe,
        hasNextPage,
        createJobStore,
        getJobOfMeStore,
        getJobDetailStore,
        deleteJobStore,
        jobs,
        totalPages,
        errorLog,
        listCategoryJobs,
        listSavedJobs,
        savedJobsTotalPages,
        jobDetail,
        listJobSearch,
        fetchJobs,
        fetchCategories,
        fetchJobDetail,
        handleSavedJob,
        handleUnsaveJob,
        fetchMySavedJobs,
        checkIsSavedJob,
        fetchJobSearch
    }

})