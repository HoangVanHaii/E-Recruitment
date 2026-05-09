import { ref } from 'vue';
import { defineStore } from 'pinia';
import { CreateCompany, GetAllCompany, getAllCompanyForAdmin, getCompanyByIdForAdmin, GetCompanyDetailOfMe, getCompanyOfMe, requestCompany, UpdateCompany, updateCompanyStatus } from '../services/company';
import type { ICompanyBasic, ICompanyDetail, ICompanyResponse, ICompanyOfMe } from '../types/company';

export const useCompanyStore = defineStore('company',() => {
    const loading = ref<boolean>(false);
    const message = ref<string>('');
    const error = ref<boolean>(false);
    const listCompany = ref<ICompanyResponse[]>([]);
    const errors = ref<Record<string, string>>({});
    const totalPages = ref<number>(0);
    const listCompanyForAdmin = ref<ICompanyBasic[]>([]);
    const companyDetailForAdmin = ref<ICompanyDetail | null>(null);
    const CompanyOfMe = ref<ICompanyOfMe | null>(null);

    

    const createCompanyStore = async (formData: FormData) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await CreateCompany(formData);
            message.value = data.message || 'Tạo công ty thành công';
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error createCompany', res);
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
    const getAllCompanyStore = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await GetAllCompany();
            listCompany.value = data.data || [];
            message.value = data.message || 'Lấy danh sách công ty thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy danh sách công ty:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy ds công ty';
        } finally {
            loading.value = false;
        }
    }
    const requestCompanyStore = async (companyID: number, Position: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await requestCompany(companyID, Position);
            message.value = data.message || 'Gửi yêu cầu thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi gửi yêu cầu:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi gửi yêu cầu';
        } finally {
            loading.value = false;
        }
    }
    const getCompanyOfMeStore = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await getCompanyOfMe();
            message.value = data.message || 'Lấy thông tin công ty thành công';
            CompanyOfMe.value = data.data || null;
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy danh sách công ty của tôi:", err.response?.data);
            message.value = err.response?.data?.message || 'Lấy thông tin công ty thất bại';
        } finally {
            loading.value = false;
        }
    }
    const getCompanyDetailOfMeStore = async () => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await GetCompanyDetailOfMe();
            message.value = data.message || 'Lấy thông tin công ty thành công';
            return data.data || null;
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy công ty của tôi:", err.response?.data);
            message.value = err.response?.data?.message || ':ỗi khi lấy thông tin công ty của tôi';
        } finally {
            loading.value = false;
        }    
    }
    const UpdateCompanyStore = async (companyID: number, formData: FormData) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const data = await UpdateCompany(companyID, formData);
            message.value = data.message || 'Cập nhật công ty thành công';
        } catch (err: any) {
            error.value = true;
            const res = err.response?.data;
            console.error('Error updateCompany', res);
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
    const getAllCompanyForAdminStore = async (page: number, limit: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const response = await getAllCompanyForAdmin(page, limit);
            listCompanyForAdmin.value = response.data.items || [];
            if(response.data.totalPages !== undefined){
                totalPages.value = response.data.totalPages;
            }
            message.value = response.message || 'Lấy danh sách công ty thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy danh sách công ty:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy ds công ty';
        } finally {
            loading.value = false;
        }
    }
    const getCompanyDetailForAdminStore = async (companyId: number) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const response = await getCompanyByIdForAdmin(companyId);
            companyDetailForAdmin.value = response.data || null;
            message.value = response.message || 'Lấy thông tin công ty thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi lấy thông tin công ty:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi lấy thông tin công ty';
        } finally {
            loading.value = false;
        }
    }
    const updateCompanyStatusStore = async (companyId: number, status: string) => {
        try {
            error.value = false;
            loading.value = true;
            message.value = '';
            const response = await updateCompanyStatus(companyId, status);
            message.value = response.message || 'Cập nhật trạng thái công ty thành công';
        } catch (err: any) {
            error.value = true;
            console.error("Lỗi khi cập nhật trạng thái công ty:", err.response?.data);
            message.value = err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật trạng thái công ty';
        } finally {
            loading.value = false;
        }
    }
    return {
        loading,
        message,
        error,
        listCompany,
        totalPages,
        companyDetailForAdmin,
        listCompanyForAdmin,
        CompanyOfMe,
        createCompanyStore,
        getAllCompanyStore,
        requestCompanyStore,
        getCompanyOfMeStore,
        getCompanyDetailOfMeStore,
        UpdateCompanyStore,
        getAllCompanyForAdminStore,
        getCompanyDetailForAdminStore,
        updateCompanyStatusStore
    }

})