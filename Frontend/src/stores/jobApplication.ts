import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getApplicationDetail, getJobApplications, updateStatusApplication ,applyJob, getSubmittedApplications, getChartStats} from '../services/jobApplication';
import type { IAppliedJob, IJobApplicationList } from '../types/jobApplication';

export const useApplicationStore = defineStore('application',() => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const errors = ref<Record<string, string>>({});
    const listApplications = ref<IJobApplicationList[]>([]);

    const submittedApplications = ref<IAppliedJob[]>([]);
    const hasNextPage = ref(false);

    const getApplicationByJobId = async (jobID: number, page: number = 1, limit: number = 6) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getJobApplications(jobID, page, limit);
            const applications = data.data || [];
            console.log('Fetched applications for jobID', jobID, 'page', page, 'limit', limit, 'applications:', applications);
            if (page > 1 && applications.length === 0) {
                hasNextPage.value = false;
                message.value = 'Không còn đơn ứng tuyển nào nữa';
                return false;
            }
            listApplications.value = applications || [];
            message.value = data.message || 'Lấy đơn ứng tuyển thành công';
            hasNextPage.value = data.data.length === limit;
            return true;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error getApplications', res);
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
    const getApplicationDetailStore = async (applicationID: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getApplicationDetail(applicationID);
            const application = data.data || null;
            message.value = data.message || 'Lấy chi tiết đơn ứng tuyển thành công';
            return application;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error getApplicationDetail', res);
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
            return null;
        } finally {
            loading.value = false;
        }
    }
    const updateApplicationStatusStore = async (applicationID: number, status: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await updateStatusApplication(applicationID, status);
            message.value = data.message || 'Cập nhật trạng thái đơn ứng tuyển thành công';
            return true;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error updateApplicationStatus', res);
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
    const getChartStatsStore = async (type: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getChartStats(type);
            const stats = data.data || null;
            message.value = data.message || 'Lấy thống kê đơn ứng tuyển thành công';
            return stats;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error getChartStats', res);
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
            return null;
        } finally {
            loading.value = false;
        }
    }
    const getSubmittedApplicationsStore = async (page: number = 1, limit: number = 10) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getSubmittedApplications(page, limit);
            console.log("dữ liệu trả về:", data);
            submittedApplications.value = data.data || [];
            message.value = data.message || 'Lấy danh sách đã nộp thành công';
            return true;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error getSubmittedApplications', res);
            if (res?.errors && Array.isArray(res.errors)) {
                const map: Record<string, string> = {};
                res.errors.forEach((e: any) => { map[e.path] = e.msg; });
                errors.value = map;
                message.value = res.errors[0]?.msg;
            } else {
                message.value = res?.message || 'Đã xảy ra lỗi';
            }
            return false;
        } finally {
            loading.value = false;
        }
    }

    const applyJobStore = async (JobID: number, ResumeID: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await applyJob(JobID, ResumeID);
            message.value = data.message || 'Ứng tuyển thành công';
            return true;
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error applyJob', res);
            if (res?.errors && Array.isArray(res.errors)) {
                const map: Record<string, string> = {};
                res.errors.forEach((e: any) => { map[e.path] = e.msg; });
                errors.value = map;
                message.value = res.errors[0]?.msg;
            } else {
                message.value = res?.message || 'Đã xảy ra lỗi';
            }
            return false;
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        message,
        error,
        errors,
        listApplications,
        hasNextPage,
        submittedApplications,
        getApplicationByJobId,
        getApplicationDetailStore,
        updateApplicationStatusStore,
        getSubmittedApplicationsStore, 
        applyJobStore ,
        getChartStatsStore,
    }

})