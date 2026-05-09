<script setup lang="ts">
import Notify from '../../components/Notify.vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import { ref, onMounted, watch } from 'vue';
import { useCandidateStore } from '../../stores/candidate';
import { useAuthStore } from '../../stores/auth';
import type { ICandidate } from '../../types/candidate';

const authStore = useAuthStore();
const candidateStore = useCandidateStore();
const candidates = ref<ICandidate[]>([]);
const searchQuery = ref('');
const statusFilter = ref<'All' | 'Active' | 'Banned'>('All');
const isMobileMenuOpen = ref(false);

const currentPage = ref(1);
const limit = ref(5);
const totalItems = ref(0);

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);


const fetchCandidates = async () => {
    await candidateStore.fetchAllCandidates(currentPage.value, limit.value);
    let filtered = candidateStore.allCandidates.filter(c => {
        
        const matchSearch = c.FullName.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                            (c.Email && c.Email.toLowerCase().includes(searchQuery.value.toLowerCase()));
        const matchStatus = statusFilter.value === 'All' || c.Status === statusFilter.value;
        return matchSearch && matchStatus;
    });

    totalItems.value = filtered.length;
    candidates.value = filtered
};

watch([searchQuery, statusFilter], () => {
    currentPage.value = 1;
    fetchCandidates();
});

watch([currentPage, limit], () => {
    fetchCandidates();
});

onMounted(async () => {
    await fetchCandidates();
});

// ── XỬ LÝ MODAL ──
const isViewModalOpen = ref(false);
const selectedCandidate = ref<ICandidate | null>(null);

const openViewModal = (candidate: ICandidate) => {
    selectedCandidate.value = candidate;
    isViewModalOpen.value = true;
};
const closeViewModal = () => {
    isViewModalOpen.value = false;
    setTimeout(() => { selectedCandidate.value = null; }, 200);
};

const isConfirmModalOpen = ref(false);
const candidateToToggle = ref<ICandidate | null>(null);

const openConfirmModal = (candidate: ICandidate) => {
    candidateToToggle.value = candidate;
    isConfirmModalOpen.value = true;
};
const closeConfirmModal = () => {
    isConfirmModalOpen.value = false;
    setTimeout(() => { candidateToToggle.value = null; }, 200);
};

const toggleAccountStatus = async () => {
    if (candidateToToggle.value) {
        const newStatus = candidateToToggle.value.Status === 'Active' ? 'Banned' : 'Active';
        await authStore.updateStatusStore(candidateToToggle.value.CandidateID, newStatus);
        if(candidateStore.error) {
            messageNotify.value = "Có lỗi xảy ra. Vui lòng thử lại.";
            isSuccessNotify.value = false;
        } else {
            messageNotify.value = `Tài khoản đã được ${newStatus === 'Active' ? 'mở khóa' : 'khóa'} thành công.`;
            isSuccessNotify.value = true;
            const target = candidates.value.find(e => e.CandidateID === candidateToToggle.value?.CandidateID);
            if (target) target.Status = newStatus;
        }
        showNotify.value = true;
       
        const targetInAll = candidateStore.allCandidates.find(e => e.CandidateID === candidateToToggle.value?.CandidateID);
        if (targetInAll) targetInAll.Status = newStatus;
    }
    closeConfirmModal();
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa cập nhật';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                        <h1 class="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Quản lý ứng viên</h1>
                        <p class="text-xs text-slate-400 font-medium">Xem và quản lý tài khoản người tìm việc</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 md:px-8 py-6 flex flex-col">
                
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div class="relative w-full sm:w-80">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <input 
                            v-model.lazy="searchQuery" 
                            type="text" 
                            placeholder="Tìm theo tên hoặc email (Nhấn Enter)..." 
                            class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#4c5bd4] focus:ring-1 focus:ring-[#4c5bd4] transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <span class="text-xs font-semibold text-slate-500">Trạng thái:</span>
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

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col fade-up">
                    <div class="overflow-x-auto flex-1">
                        <table class="w-full text-[13px] relative min-w-[800px]">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50/50">
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Ứng viên</th>
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Liên hệ</th>
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Ngày sinh</th>
                                    <th class="text-center px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Trạng thái</th>
                                    <th class="text-right px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Thao tác</th>
                                </tr>
                            </thead>
                            
                            <tbody v-if="candidateStore.loading" class="animate-pulse">
                                <tr>
                                    <td colspan="5" class="px-6 py-12 text-center">
                                        <i class="fas fa-spinner fa-spin text-[#4c5bd4] text-2xl"></i>
                                        <p class="text-xs text-slate-400 mt-2">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            </tbody>

                            <tbody v-else>
                                <tr 
                                    v-for="candidate in candidates" 
                                    :key="candidate.CandidateID"
                                    class="border-b border-slate-50 hover:bg-slate-50/70 transition-colors group"
                                >
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div v-if="candidate.AvatarUrl" class="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                                                <img :src="candidate.AvatarUrl" class="w-full h-full object-cover" />
                                            </div>
                                            <div v-else class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                                <i class="fas fa-user text-slate-400"></i>
                                            </div>
                                            <div>
                                                <p class="font-bold text-slate-800">{{ candidate.FullName }}</p>
                                                <p class="text-[11px] text-slate-400 mt-0.5">Tham gia: {{ formatDate(candidate.CreatedAt) }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="text-slate-700 font-medium">{{ candidate.Email || 'Chưa có Email' }}</p>
                                        <p class="text-slate-400 text-[11.5px] mt-0.5">{{ candidate.Phone || 'Chưa cập nhật SĐT' }}</p>
                                    </td>
                                    <td class="px-6 py-4 text-slate-600">
                                        {{ formatDate(candidate.DateOfBirth) }}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <span 
                                            class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                            :class="candidate.Status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'"
                                        >
                                            <i :class="candidate.Status === 'Active' ? 'fas fa-check-circle mr-1' : 'fas fa-lock mr-1'"></i>
                                            {{ candidate.Status === 'Active' ? 'Hoạt động' : 'Đã khóa' }}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <button @click="openViewModal(candidate)" class="w-8 h-8 rounded-lg flex items-center justify-center text-[#4c5bd4] bg-blue-50 hover:bg-[#4c5bd4] hover:text-white transition-colors" title="Xem chi tiết">
                                                <i class="fas fa-eye text-xs"></i>
                                            </button>
                                            <button @click="openConfirmModal(candidate)" :class="['w-8 h-8 rounded-lg flex items-center justify-center transition-colors', candidate.Status === 'Active' ? 'text-red-500 bg-red-50 hover:bg-red-500 hover:text-white' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white']" :title="candidate.Status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'">
                                                <i :class="candidate.Status === 'Active' ? 'fas fa-ban' : 'fas fa-unlock'" class="text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                <tr v-if="candidates.length === 0">
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                                        <i class="fas fa-box-open text-3xl mb-3 opacity-50"></i>
                                        <p class="text-sm">Không tìm thấy ứng viên nào.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between mt-auto">
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                            Hiển thị 
                            <select v-model="limit" class="bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#4c5bd4]">
                                <option :value="5">5</option>
                                <option :value="10">10</option>
                                <option :value="20">20</option>
                                <option :value="50">50</option>
                            </select>
                            <span class="hidden sm:inline">/ Tổng <span class="font-bold text-slate-700">{{ totalItems }}</span> ứng viên</span>
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
                                <span class="hidden sm:inline">Trang</span> {{ currentPage }} / {{ candidateStore.totalPages }}
                            </span>
                            
                            <button 
                                @click="currentPage++" 
                                :disabled="currentPage >= candidateStore.totalPages"
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
            
            <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-up flex flex-col max-h-full">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 class="font-extrabold text-slate-800 text-lg">Hồ sơ Ứng viên</h3>
                    <button @click="closeViewModal" class="text-slate-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div v-if="selectedCandidate" class="p-6 overflow-y-auto custom-scrollbar">
                    <div class="flex flex-col sm:flex-row gap-6 mb-6">
                        <div class="shrink-0 flex flex-col items-center sm:items-start">
                            <div class="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-100">
                                <img v-if="selectedCandidate.AvatarUrl" :src="selectedCandidate.AvatarUrl" class="w-full h-full object-cover" />
                                <div v-else class="w-full h-full flex items-center justify-center text-slate-400 text-3xl">
                                    <i class="fas fa-user"></i>
                                </div>
                            </div>
                            <div class="mt-3 text-center sm:text-left">
                                <span 
                                    class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border"
                                    :class="selectedCandidate.Status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'"
                                >
                                    {{ selectedCandidate.Status === 'Active' ? 'Đang hoạt động' : 'Đã bị khóa' }}
                                </span>
                            </div>
                        </div>
                        
                        <div class="flex-1 space-y-4">
                            <div>
                                <h4 class="text-xl font-bold text-slate-800">{{ selectedCandidate.FullName }}</h4>
                                <p class="text-sm text-[#4c5bd4] font-medium mt-0.5">Ứng viên #{{ selectedCandidate.CandidateID }}</p>
                            </div>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                                    <p class="font-medium text-slate-700 mt-0.5 break-all">{{ selectedCandidate.Email || 'Chưa cập nhật' }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Số điện thoại</p>
                                    <p class="font-medium text-slate-700 mt-0.5">{{ selectedCandidate.Phone || 'Chưa cập nhật' }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ngày sinh</p>
                                    <p class="font-medium text-slate-700 mt-0.5">{{ selectedCandidate.DateOfBirth || 'Chưa cập nhật' }}</p>
                                </div>
                                <div>
                                    <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Địa chỉ</p>
                                    <p class="font-medium text-slate-700 mt-0.5">{{ selectedCandidate.Address || 'Chưa cập nhật' }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- <div class="border-t border-slate-100 pt-5 space-y-4">
                        <h5 class="font-bold text-slate-700 text-sm uppercase tracking-wide">Học vấn & Kinh nghiệm</h5>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Trình độ học vấn</p>
                                <p class="font-medium text-slate-700"><i class="fas fa-graduation-cap mr-2 text-[#4c5bd4]"></i>{{ selectedCandidate.Education || 'Chưa cập nhật' }}</p>
                            </div>
                            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Số năm kinh nghiệm</p>
                                <p class="font-medium text-slate-700"><i class="fas fa-briefcase mr-2 text-[#4c5bd4]"></i>{{ selectedCandidate.ExperienceYears !== undefined ? `${selectedCandidate.ExperienceYears} năm` : 'Chưa cập nhật' }}</p>
                            </div>
                        </div> 
                    </div>-->
                </div>
            </div>
        </div>

        <div v-if="isConfirmModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" @click="closeConfirmModal"></div>
            
            <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all scale-up">
                <div 
                    class="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                    :class="candidateToToggle?.Status === 'Active' ? 'bg-red-100 text-red-500' : 'bg-emerald-100 text-emerald-500'"
                >
                    <i :class="candidateToToggle?.Status === 'Active' ? 'fas fa-exclamation-triangle' : 'fas fa-unlock'" class="text-2xl"></i>
                </div>
                
                <h3 class="text-lg font-extrabold text-slate-800 mb-2">
                    {{ candidateToToggle?.Status === 'Active' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?' }}
                </h3>
                
                <p class="text-sm text-slate-500 mb-6 leading-relaxed">
                    Bạn có chắc chắn muốn {{ candidateToToggle?.Status === 'Active' ? 'khóa' : 'mở khóa' }} tài khoản của ứng viên <strong class="text-slate-700">{{ candidateToToggle?.FullName }}</strong> không?
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
                        :class="candidateToToggle?.Status === 'Active' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
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