<script setup lang="ts">
import { ref, watch , onMounted} from 'vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import { useEmployerStore } from '../../stores/employer';
import { useAuthStore } from '../../stores/auth';
import type { IEmployerForAdmin } from '../../types/employer';
import Notify from '../../components/Notify.vue';

const employerStore = useEmployerStore();
const authStore = useAuthStore();
const employers = ref<IEmployerForAdmin[]>([]);
const searchQuery = ref('');
const statusFilter = ref<'All' | 'Active' | 'Banned'>('All');
const approvalFilter = ref<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
const isMobileMenuOpen = ref(false);

const currentPage = ref(1);
const limit = ref(5);
const totalItems = ref(0);

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const fetchEmployers = async () => {
    await employerStore.fetchAllEmployers(currentPage.value, limit.value);
    let filtered = employerStore.allEmployers.filter(e => {
        const matchSearch = e.Email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            e.CompanyName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            e.Position.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchStatus = statusFilter.value === 'All' || e.UserStatus === statusFilter.value;
        const matchApproval = approvalFilter.value === 'All' || e.EmployerStatus === approvalFilter.value;
        
        return matchSearch && matchStatus && matchApproval;
    });

    totalItems.value = filtered.length;
    employers.value = filtered;
};

watch([searchQuery, statusFilter, approvalFilter], () => {
    currentPage.value = 1;
    fetchEmployers();
});

watch([currentPage, limit], () => {
    fetchEmployers();
});

onMounted(async () => {
    await fetchEmployers();
});

const isViewModalOpen = ref(false);
const selectedEmployer = ref<IEmployerForAdmin | null>(null);

const openViewModal = (emp: IEmployerForAdmin) => {
    selectedEmployer.value = emp;
    isViewModalOpen.value = true;
};
const closeViewModal = () => {
    isViewModalOpen.value = false;
    setTimeout(() => { selectedEmployer.value = null; }, 200);
};

const isConfirmModalOpen = ref(false);
const employerToToggle = ref<IEmployerForAdmin | null>(null);

const openConfirmModal = (emp: IEmployerForAdmin) => {
    employerToToggle.value = emp;
    isConfirmModalOpen.value = true;
};
const closeConfirmModal = () => {
    isConfirmModalOpen.value = false;
    setTimeout(() => { employerToToggle.value = null; }, 200);
};

const toggleAccountStatus = async () => {
    if (employerToToggle.value) {
        const newStatus = employerToToggle.value.UserStatus === 'Active' ? 'Banned' : 'Active';
        await authStore.updateStatusStore(employerToToggle.value.EmployerID, newStatus);
        if(authStore.error) {
            messageNotify.value = "Có lỗi xảy ra. Vui lòng thử lại.";
            isSuccessNotify.value = false;
        } else {
            messageNotify.value = `Tài khoản đã được ${newStatus === 'Active' ? 'mở khóa' : 'khóa'} thành công.`;
            isSuccessNotify.value = true;
            const target = employers.value.find(e => e.EmployerID === employerToToggle.value?.EmployerID);
            if (target) target.UserStatus = newStatus;
        }
        showNotify.value = true;
       
        const targetInAll = employerStore.allEmployers.find(e => e.EmployerID === employerToToggle.value?.EmployerID);
        if (targetInAll) targetInAll.UserStatus = newStatus;
    }
    closeConfirmModal();
};


const approvalStatusMap: Record<string, { label: string; class: string; icon: string }> = {
    Approved: { label: 'Đã duyệt', class: 'bg-blue-50 text-[#4c5bd4] border-blue-200', icon: 'fas fa-check-circle' },
    Pending:  { label: 'Chờ duyệt', class: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'fas fa-hourglass-half' },
    Rejected: { label: 'Từ chối', class: 'bg-slate-100 text-slate-500 border-slate-300', icon: 'fas fa-times-circle' },
};
</script>

<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <div class="flex h-screen w-full bg-[#f1f3fb] overflow-hidden font-sans relative">

        <SidebarAdmin 
            :is-open-mobile="isMobileMenuOpen"
            @close-mobile-menu="isMobileMenuOpen = false"
        />

        <div class="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
            
            <div class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                    <button 
                        class="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                        @click="isMobileMenuOpen = true"
                        aria-label="Mở menu"
                    >
                        <i class="fas fa-bars"></i>
                    </button>
                    <div>
                        <h1 class="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Quản lý Nhà tuyển dụng</h1>
                        <p class="text-xs text-slate-400 font-medium">Xem và quản lý tài khoản doanh nghiệp</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-all">
                        <div class="w-7 h-7 rounded-full bg-[#4c5bd4] flex items-center justify-center shrink-0">
                            <i class="fas fa-user-shield text-white text-xs"></i>
                        </div>
                        <div class="hidden sm:block">
                            <p class="text-xs font-bold text-slate-700 leading-tight">Super Admin</p>
                            <p class="text-[10px] text-slate-400">admin@365timviec.vn</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 md:px-8 py-6 flex flex-col">
                
                <div class="flex flex-col xl:flex-row items-center justify-between gap-4 mb-6">
                    <div class="relative w-full xl:w-96">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <input 
                            v-model.lazy="searchQuery" 
                            type="text" 
                            placeholder="Tìm theo email, vị trí hoặc tên công ty..." 
                            class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4] transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-slate-500">Phê duyệt:</span>
                            <select 
                                v-model="approvalFilter"
                                class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4] transition-all"
                            >
                                <option value="All">Tất cả</option>
                                <option value="Approved">Đã duyệt</option>
                                <option value="Pending">Chờ duyệt</option>
                                <option value="Rejected">Từ chối</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-slate-500">Tài khoản:</span>
                            <select 
                                v-model="statusFilter"
                                class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4] transition-all"
                            >
                                <option value="All">Tất cả</option>
                                <option value="Active">Hoạt động</option>
                                <option value="Banned">Đã khóa</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col fade-up">
                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-[13px] relative min-w-[800px]">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50/50">
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Đại diện / Liên hệ</th>
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Công ty</th>
                                    <th class="text-center px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Hồ sơ C.Ty</th>
                                    <th class="text-center px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Tài khoản</th>
                                    <th class="text-right px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Thao tác</th>
                                </tr>
                            </thead>
                            
                            <tbody v-if="employerStore.loading">
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center">
                                        <i class="fas fa-spinner fa-spin text-[#4c5bd4] text-2xl"></i>
                                        <p class="text-xs text-slate-400 mt-2">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            </tbody>

                            <tbody v-else>
                                <tr 
                                    v-for="emp in employers" 
                                    :key="emp.EmployerID"
                                    class="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
                                >
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                <i class="fas fa-user text-slate-400"></i>
                                            </div>
                                            <div>
                                                <p class="font-bold text-slate-800">{{ emp.Email }}</p>
                                                <p class="text-[11.5px] text-slate-500 mt-0.5">{{ emp.Position }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div v-if="emp.LogoUrl" class="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                                <img :src="emp.LogoUrl" class="w-full h-full object-cover" />
                                            </div>
                                            <div v-else class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                <i class="fas fa-building text-slate-400"></i>
                                            </div>
                                            <div>
                                                <p class="font-bold text-slate-700 truncate max-w-[180px]">{{ emp.CompanyName }}</p>
                                                <p class="text-[11px] text-slate-400 mt-0.5">{{ emp.Industry }}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-6 py-4 text-center">
                                        <span 
                                            class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                            :class="approvalStatusMap[emp.EmployerStatus].class"
                                        >
                                            <i :class="[approvalStatusMap[emp.EmployerStatus].icon, 'mr-1']"></i>
                                            {{ approvalStatusMap[emp.EmployerStatus].label }}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4 text-center">
                                        <span 
                                            class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                            :class="emp.UserStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'"
                                        >
                                            <i :class="emp.UserStatus === 'Active' ? 'fas fa-check-circle mr-1' : 'fas fa-lock mr-1'"></i>
                                            {{ emp.UserStatus === 'Active' ? 'Hoạt động' : 'Đã khóa' }}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <button @click="openViewModal(emp)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#4c5bd4] bg-blue-50 hover:bg-[#4c5bd4] hover:text-white transition-colors" title="Xem chi tiết">
                                                <i class="fas fa-eye text-xs"></i>
                                            </button>
                                            <button @click="openConfirmModal(emp)" :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-colors', emp.UserStatus === 'Active' ? 'text-red-500 bg-red-50 hover:bg-red-500 hover:text-white' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white']" :title="emp.UserStatus === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'">
                                                <i :class="emp.UserStatus === 'Active' ? 'fas fa-ban' : 'fas fa-unlock'" class="text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <tr v-if="employers.length === 0">
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                                        <i class="fas fa-building text-3xl mb-3 opacity-50"></i>
                                        <p class="text-sm">Không tìm thấy nhà tuyển dụng nào.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4 mt-auto">
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                            Hiển thị 
                            <select v-model="limit" class="bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#4c5bd4]">
                                <option :value="5">5</option>
                                <option :value="10">10</option>
                                <option :value="20">20</option>
                            </select>
                            <span class="hidden sm:inline">/ Tổng <span class="font-bold text-slate-700">{{ totalItems }}</span> NTD</span>
                        </div>

                        <div class="flex items-center gap-1">
                            <button 
                                @click="currentPage--" 
                                :disabled="currentPage === 1"
                                class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <i class="fas fa-chevron-left text-[10px]"></i>
                            </button>
                            
                            <span class="text-xs text-slate-600 font-medium px-2">
                                <span class="hidden sm:inline">Trang</span> {{ currentPage }} / {{ employerStore.totalpages || 1 }}
                            </span>
                            
                            <button 
                                @click="currentPage++" 
                                :disabled="currentPage >= employerStore.totalpages"
                                class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div v-if="isViewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeViewModal"></div>
            
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all scale-up flex flex-col max-h-full">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 class="font-extrabold text-slate-800 text-lg">Hồ sơ Nhà tuyển dụng</h3>
                    <button @click="closeViewModal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div v-if="selectedEmployer" class="p-6 overflow-y-auto custom-scrollbar">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        <div class="space-y-5">
                            <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <i class="fas fa-user-tie text-[#4c5bd4] text-lg"></i>
                                <h4 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Người đại diện</h4>
                            </div>
                            
                            <div class="flex items-center gap-4">
                                <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-100 shadow-sm shrink-0">
                                    <i class="fas fa-user text-2xl text-slate-300"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-slate-800 text-base break-all">{{ selectedEmployer.Email }}</p>
                                    <p class="text-sm text-slate-500 mt-0.5">{{ selectedEmployer.Position }}</p>
                                </div>
                            </div>
                            
                            <div class="space-y-3 text-[13px]">
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Trạng thái tài khoản</p>
                                    <div class="mt-1">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border" :class="selectedEmployer.UserStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'">
                                            {{ selectedEmployer.UserStatus === 'Active' ? 'Đang hoạt động' : 'Đã bị khóa' }}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Mã định danh (ID)</p>
                                    <p class="font-mono text-slate-700 mt-0.5 bg-slate-50 px-2 py-1 inline-block rounded text-[12px] border border-slate-100">EMP-{{ selectedEmployer.EmployerID }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div class="flex items-center gap-3 pb-3 border-b border-slate-100">
                                <i class="fas fa-building text-[#4c5bd4] text-lg"></i>
                                <h4 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Doanh nghiệp</h4>
                            </div>

                            <div class="flex items-center gap-4">
                                <div v-if="selectedEmployer.LogoUrl" class="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                    <img :src="selectedEmployer.LogoUrl" class="w-full h-full object-cover" />
                                </div>
                                <div v-else class="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                                    <i class="fas fa-image text-slate-400 text-xl"></i>
                                </div>
                                <div>
                                    <p class="font-bold text-slate-800 text-base">{{ selectedEmployer.CompanyName }}</p>
                                    <div class="mt-1">
                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border" :class="approvalStatusMap[selectedEmployer.EmployerStatus].class">
                                            {{ approvalStatusMap[selectedEmployer.EmployerStatus].label }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="space-y-3 text-[13px]">
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Lĩnh vực hoạt động</p>
                                    <p class="font-medium text-slate-700 mt-0.5">{{ selectedEmployer.Industry }}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div v-if="isConfirmModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" @click="closeConfirmModal"></div>
            
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all scale-up">
                <div 
                    class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    :class="employerToToggle?.UserStatus === 'Active' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'"
                >
                    <i :class="employerToToggle?.UserStatus === 'Active' ? 'fas fa-exclamation-triangle' : 'fas fa-unlock'" class="text-2xl"></i>
                </div>
                
                <h3 class="text-lg font-extrabold text-slate-800 mb-2">
                    {{ employerToToggle?.UserStatus === 'Active' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?' }}
                </h3>
                
                <p class="text-sm text-slate-500 mb-6 leading-relaxed">
                    Bạn có chắc chắn muốn {{ employerToToggle?.UserStatus === 'Active' ? 'khóa' : 'mở khóa' }} tài khoản của đại diện <strong class="text-slate-700">{{ employerToToggle?.Email }}</strong> thuộc công ty <strong class="text-slate-700">{{ employerToToggle?.CompanyName }}</strong> không?
                </p>
                
                <div class="flex items-center gap-3">
                    <button 
                        @click="closeConfirmModal"
                        class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        @click="toggleAccountStatus"
                        class="flex-1 py-2.5 text-white text-sm font-bold rounded-xl transition-colors"
                        :class="employerToToggle?.UserStatus === 'Active' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-up {
    animation: fadeUp 0.4s ease both;
}
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}

.scale-up {
    animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes scaleUp {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
}
</style>