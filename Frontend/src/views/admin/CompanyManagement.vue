<script setup lang="ts">
import Notify from '../../components/Notify.vue';
import Loading from '../../components/Loading.vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import CompanyDetailModal from '../../components/admin/CompanyDetailModal.vue';
import { useCompanyStore } from '../../stores/company';
import { ref, computed, onMounted, watch } from 'vue';
import type { ICompanyBasic } from '../../types/company';

const currentPage = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const companyStore = useCompanyStore();
const loading = ref(false);
const companies = ref<ICompanyBasic[]>([]);
const isMobileMenuOpen = ref(false);

const searchQuery = ref('');

const statusFilter = ref<string>('All');
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
    Approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: 'fas fa-check-circle' },
    Pending:  { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-600 border-amber-200', icon: 'fas fa-hourglass-half' },
    Rejected: { label: 'Bị từ chối', cls: 'bg-slate-100 text-slate-500 border-slate-200', icon: 'fas fa-times-circle' },
    Banned:   { label: 'Đã khóa', cls: 'bg-red-50 text-red-500 border-red-200', icon: 'fas fa-ban' },
};

const fetchCompanies = async () => {
    loading.value = true;
    try {
        await companyStore.getAllCompanyForAdminStore(currentPage.value, limit.value);
        companies.value = companyStore.listCompanyForAdmin;
        totalItems.value = companyStore.listCompanyForAdmin.length;
    } catch (error) {
        console.error(error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => fetchCompanies());

watch([searchQuery, statusFilter], () => {
    currentPage.value = 1;
    fetchCompanies();
});

const handlePageChange = (newPage: number) => {
    currentPage.value = newPage;
    fetchCompanies();
};
const handleLimitChange = () => {
    currentPage.value = 1;
    fetchCompanies();
};

const isDetailModalOpen = ref(false);
const selectedCompanyId = ref<number | null>(null);

const openDetail = (id: number) => {
    selectedCompanyId.value = id;
    isDetailModalOpen.value = true;
};

type ActionType = 'Approve' | 'Reject' | 'Ban' | 'Unban';
const isActionModalOpen = ref(false);
const companyToAction = ref<ICompanyBasic | null>(null);
const actionType = ref<ActionType>('Approve');

const actionUIConfig = computed(() => {
    switch (actionType.value) {
        case 'Approve': return { title: 'Duyệt công ty?', color: 'emerald', icon: 'fas fa-check-circle', actionText: 'duyệt và kích hoạt' };
        case 'Reject':  return { title: 'Từ chối công ty?', color: 'slate', icon: 'fas fa-times-circle', actionText: 'từ chối phê duyệt' };
        case 'Ban':     return { title: 'Khóa công ty?', color: 'red', icon: 'fas fa-lock', actionText: 'khóa hoạt động' };
        case 'Unban':   return { title: 'Mở khóa công ty?', color: 'emerald', icon: 'fas fa-unlock', actionText: 'mở khóa khôi phục' };
    }
});

const openActionModal = (company: ICompanyBasic, type: ActionType) => {
    companyToAction.value = company;
    actionType.value = type;
    isActionModalOpen.value = true;
};

const closeActionModal = () => {
    isActionModalOpen.value = false;
    setTimeout(() => { companyToAction.value = null; }, 200);
};

const handleAction = async () => {
    if (!companyToAction.value) return;
    

    let newStatus: string = companyToAction.value.Status;
    if (actionType.value === 'Approve') newStatus = 'Approved';
    if (actionType.value === 'Reject') newStatus = 'Rejected';
    if (actionType.value === 'Ban') newStatus = 'Banned';
    if (actionType.value === 'Unban') newStatus = 'Approved'; 
    
    await companyStore.updateCompanyStatusStore(companyToAction.value.CompanyID, newStatus);
    if (companyStore.error) {
        messageNotify.value = companyStore.message || `Lỗi khi ${actionUIConfig.value.actionText} công ty.`;
        isSuccessNotify.value = false;
        showNotify.value = true;
    }
    else {
        messageNotify.value = `Đã ${actionUIConfig.value.actionText} công ty thành công!`;
        isSuccessNotify.value = true;
        showNotify.value = true;
        await fetchCompanies();
    }
    companyToAction.value.Status = newStatus;
    closeActionModal();
};
</script>

<template>
    <Loading v-if="loading" />
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <div class="flex h-screen w-full bg-[#f1f3fb] overflow-hidden font-sans relative">
        <SidebarAdmin :is-open-mobile="isMobileMenuOpen" @close-mobile-menu="isMobileMenuOpen = false" />

        <div class="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
            <div class="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-3">
                    <button class="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" @click="isMobileMenuOpen = true">
                        <i class="fas fa-bars"></i>
                    </button>
                    <div>
                        <h1 class="text-lg font-extrabold text-slate-800 tracking-tight leading-tight">Quản lý Công ty</h1>
                        <p class="text-xs text-slate-400 font-medium">Danh sách doanh nghiệp trên hệ thống</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 px-4 md:px-8 py-6 flex flex-col">
                
                <div class="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div class="relative w-full md:w-80">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]"></i>
                        <input 
                            v-model.lazy="searchQuery" 
                            type="text" 
                            placeholder="Tìm tên công ty, mã số thuế..." 
                            class="w-full py-2.5 pr-3.5 pl-9 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#4c5bd4] focus:ring-[3px] focus:ring-[#4c5bd4]/10"
                        />
                    </div>
                    
                    <div class="flex items-center gap-2 w-full md:w-auto">
                        <span class="text-[13px] font-semibold text-slate-500">Trạng thái:</span>
                        <select 
                            v-model="statusFilter"
                            class="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-700 outline-none focus:border-[#4c5bd4] cursor-pointer"
                        >
                            <option value="All">Tất cả</option>
                            <option value="Pending">Chờ duyệt</option>
                            <option value="Approved">Đã duyệt</option>
                            <option value="Rejected">Bị từ chối</option>
                            <option value="Banned">Đã khóa</option>
                        </select>
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col fade-up">
                    <div class="overflow-x-auto flex-1 custom-scrollbar">
                        <table class="w-full text-[13px] relative min-w-[850px]">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50/50">
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Công ty</th>
                                    <th class="text-left px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Mã số thuế</th>
                                    <th class="text-center px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Thành phố</th>
                                    <th class="text-center px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Trạng thái</th>
                                    <th class="text-right px-6 py-4 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Thao tác</th>
                                </tr>
                            </thead>
                            
                            <tbody>
                                <tr v-for="c in companies" :key="c.CompanyID" class="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div v-if="c.LogoUrl" class="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                                <img :src="c.LogoUrl" class="w-full h-full object-contain" />
                                            </div>
                                            <div v-else class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                                <i class="fas fa-city text-slate-400"></i>
                                            </div>
                                            <div>
                                                <p class="font-bold text-slate-800">{{ c.CompanyName }}</p>
                                                <p class="text-[11px] text-slate-500 mt-0.5">{{ c.Industry }}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td class="px-6 py-4">
                                        <p class="font-mono text-[12px] text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded inline-block">{{ c.TaxCode }}</p>
                                    </td>

                                    <td class="px-6 py-4 text-center text-slate-600 font-medium">
                                        {{ c.City || '—' }}
                                    </td>

                                    <td class="px-6 py-4 text-center">
                                        <span v-if="statusConfig[c.Status]" class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                              :class="statusConfig[c.Status]?.cls">
                                            <i :class="[statusConfig[c.Status]?.icon, 'mr-1']"></i>
                                            {{ statusConfig[c.Status]?.label }}
                                        </span>
                                        <span v-else class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border bg-gray-100 text-gray-500">
                                            {{ c.Status }}
                                        </span>
                                    </td>

                                    <td class="px-6 py-4 text-right">
                                        <div class="flex items-center justify-end gap-1.5">
                                            <button @click="openDetail(c.CompanyID)" class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-[#4c5bd4] bg-[#eef0fd] hover:bg-[#4c5bd4] hover:text-white" title="Xem chi tiết">
                                                <i class="fas fa-eye text-[12px]"></i>
                                            </button>
                                            
                                            <template v-if="c.Status === 'Pending'">
                                                <button @click="openActionModal(c, 'Approve')" class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white" title="Duyệt hồ sơ">
                                                    <i class="fas fa-check text-[12px]"></i>
                                                </button>
                                                <button @click="openActionModal(c, 'Reject')" class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-slate-600 bg-slate-100 hover:bg-slate-600 hover:text-white" title="Từ chối">
                                                    <i class="fas fa-times text-[12px]"></i>
                                                </button>
                                            </template>

                                            <template v-else-if="c.Status === 'Approved'">
                                                <button @click="openActionModal(c, 'Ban')" class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-red-600 bg-red-50 hover:bg-red-600 hover:text-white" title="Khóa công ty">
                                                    <i class="fas fa-lock text-[12px]"></i>
                                                </button>
                                            </template>

                                            <template v-else-if="c.Status === 'Banned'">
                                                <button @click="openActionModal(c, 'Unban')" class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white" title="Mở khóa công ty">
                                                    <i class="fas fa-unlock text-[12px]"></i>
                                                </button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>
                                
                                <tr v-if="companies.length === 0 && !loading">
                                    <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                                        <i class="fas fa-building-circle-xmark text-3xl mb-3 opacity-50 text-slate-300"></i>
                                        <p class="text-[13px]">Không tìm thấy công ty nào phù hợp.</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="px-6 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                        <div class="flex items-center gap-2 text-[12px] text-slate-500">
                            Hiển thị 
                            <select v-model="limit" @change="handleLimitChange" class="bg-white border border-slate-200 rounded px-2 py-1.5 outline-none font-medium">
                                <option :value="10">10</option>
                                <option :value="20">20</option>
                            </select>
                            <span>/ Tổng <b class="text-slate-700">{{ totalItems }}</b> kết quả</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button @click="handlePageChange(currentPage - 1)" :disabled="currentPage === 1" class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 disabled:opacity-40 transition-colors hover:text-[#4c5bd4] hover:border-[#4c5bd4]">
                                <i class="fas fa-chevron-left text-[10px]"></i>
                            </button>
                            <span class="text-[12px] text-slate-600 font-semibold px-2">Trang {{ currentPage }} / {{ Math.ceil(totalItems / limit) || 1 }}</span>
                            <button @click="handlePageChange(currentPage + 1)" :disabled="currentPage >= (Math.ceil(totalItems / limit) || 1)" class="w-7 h-7 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-500 disabled:opacity-40 transition-colors hover:text-[#4c5bd4] hover:border-[#4c5bd4]">
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <CompanyDetailModal 
            :company-id="selectedCompanyId" 
            :is-open="isDetailModalOpen" 
            @close="isDetailModalOpen = false" 
        />
        
        <transition name="scale-up">
            <div v-if="isActionModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[4px]" @click.self="closeActionModal">
                <div class="bg-white rounded-[20px] p-7 px-6 w-full max-w-[360px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    
                    <div class="w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4" 
                         :class="`bg-${actionUIConfig.color}-50 text-${actionUIConfig.color}-600`">
                        <i :class="actionUIConfig.icon" class="text-3xl"></i>
                    </div>
                    
                    <h3 class="text-[17px] font-extrabold text-slate-800 mb-2">
                        {{ actionUIConfig.title }}
                    </h3>
                    
                    <p class="text-[13px] text-slate-500 leading-[1.6] mb-6">
                        Bạn có chắc chắn muốn
                        <strong>{{ actionUIConfig.actionText }}</strong>
                        đối với doanh nghiệp<br />
                        <strong class="text-slate-700">"{{ companyToAction?.CompanyName }}"</strong>?
                    </p>
                    
                    <div class="flex gap-2.5">
                        <button @click="closeActionModal" class="flex-1 p-2.5 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-bold transition-colors hover:bg-slate-200">
                            Huỷ
                        </button>
                        <button
                            @click="handleAction"
                            class="flex-1 p-2.5 text-white rounded-xl text-[13px] font-bold transition-opacity hover:opacity-90"
                            :class="`bg-${actionUIConfig.color}-600`"
                        >
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </transition>

    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.fade-up { animation: fadeUp 0.4s ease both; }
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}

.scale-up-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.scale-up-leave-active { transition: all 0.15s ease; }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(0.95) translateY(10px); }

.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-600 { color: #059669; }
.bg-emerald-600 { background-color: #059669; }

.bg-red-50 { background-color: #fef2f2; }
.text-red-600 { color: #dc2626; }
.bg-red-600 { background-color: #dc2626; }

.bg-slate-50 { background-color: #f8fafc; }
.text-slate-600 { color: #475569; }
.bg-slate-600 { background-color: #475569; }
</style>