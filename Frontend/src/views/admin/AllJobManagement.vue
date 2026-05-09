<script setup lang="ts">
import Notify from '../../components/Notify.vue';
import JobDetail from '../../components/admin/JobDetail.vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import { ref, computed, watch, onMounted } from 'vue';
import { useJobStore } from '../../stores/job';
import { formatDate, formatSalary } from '../../utils/format';
import { useRoute } from 'vue-router';
import type { IJob } from '../../types/job';

const route = useRoute();
const jobStore = useJobStore();

const jobs = ref<IJob[]>([]);
const searchQuery = ref('');
const statusFilter = ref<'All' | 'Pending' | 'Approved' | 'Rejected'>(route.query.status as any || 'All');
const isMobileMenuOpen = ref(false);
const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);


const currentPage = ref(1);
const limit = ref(5);

const fetchJobs = async () => {
    await jobStore.fetchJobForAdminByStatusStore(statusFilter.value === 'All' ? undefined : statusFilter.value, currentPage.value, limit.value);
    
    let filtered = jobStore.listJobForAdmin.filter(j => {
        const matchSearch = !searchQuery.value ||
            j.Title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            j.CompanyName.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchStatus = statusFilter.value === 'All' || j.Status === statusFilter.value;
        return matchSearch && matchStatus;
    });
    jobStore.totalItems = filtered.length;
    jobs.value = filtered;
};

onMounted(async() => {
    await fetchJobs();
});

watch([searchQuery, statusFilter], () => { currentPage.value = 1; fetchJobs(); });
watch(([currentPage, limit]), async () => {
     await fetchJobs();
});
watch(() => route.query.status, (newStatus) => {
    if (newStatus === 'Pending' || newStatus === 'Approved' || newStatus === 'Rejected') {
        statusFilter.value = newStatus;
    } else {
        statusFilter.value = 'All';
    }
});

const isDrawerOpen = ref(false);
const selectedJobId = ref<number | null>(null);

const openDrawer = (job: IJob) => {
    selectedJobId.value = job.JobID ?? null;
    isDrawerOpen.value = true;
};
const closeDrawer = () => {
    isDrawerOpen.value = false;
    setTimeout(() => { selectedJobId.value = null; }, 300);
};

const isActionModalOpen = ref(false);
const jobToAction = ref<IJob | null>(null);
const actionType = ref<'Approve' | 'Reject'>('Approve');

const openActionModal = (job: IJob, type: 'Approve' | 'Reject') => {
    jobToAction.value = job;
    actionType.value = type;
    isActionModalOpen.value = true;
};
const closeActionModal = () => {
    isActionModalOpen.value = false;
    setTimeout(() => { jobToAction.value = null; }, 200);
};

const handleDrawerAction = (payload: { jobId: number; type: 'Approve' | 'Reject' }) => {
    const job = jobs.value.find(j => j.JobID === payload.jobId) ?? null;
    if (job) openActionModal(job, payload.type);
};

const handleUpdateStatus = async () => {
    if (!jobToAction.value) return;
    const newStatus = actionType.value === 'Approve' ? 'Approved' : 'Rejected';
    await jobStore.changeStatusJobStore(jobToAction.value.JobID!, newStatus); 
    if(jobStore.errorLog) {
        messageNotify.value = 'Cập nhật trạng thái thất bại: ' + jobStore.errorLog;
        isSuccessNotify.value = false;
    } else {
        messageNotify.value = `Bài đăng đã được ${actionType.value === 'Approve' ? 'duyệt' : 'từ chối'} thành công.`;
        isSuccessNotify.value = true;
    }
    showNotify.value = true;
    isDrawerOpen.value = false;
    const updateIn = (list: IJob[]) => {
        const t = list.find(j => j.JobID === jobToAction.value?.JobID);
        if (t) t.Status = newStatus;
    };
    updateIn(jobs.value);
    updateIn(jobStore.listJobForAdmin);
    closeActionModal();
};

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
    Approved: { label: 'Đã duyệt',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: 'fas fa-check-circle' },
    Pending:  { label: 'Chờ duyệt',  cls: 'bg-amber-50 text-amber-600 border-amber-200',       icon: 'fas fa-hourglass-half' },
    Rejected: { label: 'Bị từ chối', cls: 'bg-red-50 text-red-500 border-red-200',             icon: 'fas fa-times-circle' },
};

const statCounts = computed(() => ({
    all:      jobStore.listJobForAdmin.length,
    pending:  jobStore.listJobForAdmin.filter(j => j.Status === 'Pending').length,
    approved: jobStore.listJobForAdmin.filter(j => j.Status === 'Approved').length,
    rejected: jobStore.listJobForAdmin.filter(j => j.Status === 'Rejected').length,
}));

const getPillClasses = (key: string, isActive: boolean) => {
    const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-[1.5px] cursor-pointer transition-all ";
    if (!isActive) return base + "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50";
    
    switch (key) {
        case 'All': return base + "bg-[#4c5bd4] text-white border-[#4c5bd4]";
        case 'Pending': return base + "bg-amber-100 text-amber-600 border-amber-200";
        case 'Approved': return base + "bg-emerald-100 text-emerald-600 border-emerald-200";
        case 'Rejected': return base + "bg-red-100 text-red-600 border-red-200";
        default: return base;
    }
};
</script>

<template>
    <div class="flex h-screen w-full bg-[#f1f3fb] overflow-hidden font-sans">
        <SidebarAdmin
            :is-open-mobile="isMobileMenuOpen"
            @close-mobile-menu="isMobileMenuOpen = false"
        />
        <Notify  
            v-if="showNotify" 
            :message="messageNotify" 
            :isSuccess="isSuccessNotify" 
            @close="showNotify = false"
        />
        <div class="flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden">

            <header class="flex items-center justify-between py-3 px-5 md:py-[14px] md:px-8 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] shrink-0 sticky top-0 z-20">
                <div class="flex items-center gap-3">
                    <button class="p-2 -ml-2 rounded-[10px] text-slate-500 hover:bg-slate-100 transition-colors lg:hidden" @click="isMobileMenuOpen = true">
                        <i class="fas fa-bars text-sm"></i>
                    </button>
                    <div>
                        <h1 class="text-base font-extrabold text-slate-800 leading-tight">Tất cả bài đăng</h1>
                        <p class="text-[10px] text-slate-400 font-medium mt-[1px]">Xét duyệt và quản lý tin tuyển dụng</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer">
                    <div class="w-7 h-7 rounded-full bg-[#4c5bd4] flex items-center justify-center shrink-0">
                        <i class="fas fa-user-shield text-white text-xs"></i>
                    </div>
                    <div class="hidden sm:block">
                        <p class="text-xs font-bold text-slate-700 leading-tight">Super Admin</p>
                        <p class="text-[10px] text-slate-400">admin@365timviec.vn</p>
                    </div>
                </div>
            </header>

            <div class="flex-1 overflow-x-hidden p-4 flex flex-col gap-4 md:p-6 md:px-8 md:gap-5" :class="isDrawerOpen ? 'overflow-hidden' : 'overflow-y-auto'">

                <div class="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                    <div class="flex gap-1.5 flex-wrap">
                        <button
                            v-for="pill in [
                                { key: 'All',      label: 'Tất cả',     count: statCounts.all },
                                { key: 'Pending',  label: 'Chờ duyệt',  count: statCounts.pending },
                                { key: 'Approved', label: 'Đã duyệt',   count: statCounts.approved },
                                { key: 'Rejected', label: 'Bị từ chối', count: statCounts.rejected },
                            ]"
                            :key="pill.key"
                            @click="statusFilter = pill.key as typeof statusFilter"
                            :class="getPillClasses(pill.key, statusFilter === pill.key)"
                        >
                            {{ pill.label }}
                            
                        </button>
                    </div>

                    <!-- Search -->
                    <div class="relative w-full md:w-[280px]">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]"></i>
                        <input
                            v-model.lazy="searchQuery"
                            type="text"
                            placeholder="Tìm vị trí hoặc công ty..."
                            class="w-full py-2 pr-3.5 pl-9 bg-white border-[1.5px] border-slate-200 rounded-xl text-[13px] text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-[#4c5bd4] focus:ring-[3px] focus:ring-[#4c5bd4]/10"
                        />
                    </div>
                </div>

                <div class="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col flex-1 fade-up">
                    <div class="overflow-x-auto flex-1 custom-scrollbar">
                        <table class="w-full min-w-[760px] border-collapse text-[13px]">
                            <thead>
                                <tr>
                                    <th class="py-3 px-4 text-[10px] text-left font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Vị trí / Công ty</th>
                                    <th class="py-3 px-4 text-[10px] text-left font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Chi tiết</th>
                                    <th class="py-3 px-4 text-[10px] text-center font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Ứng viên</th>
                                    <th class="py-3 px-4 text-[10px] text-center font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Lương</th>
                                    <th class="py-3 px-4 text-[10px] text-center font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Trạng thái</th>
                                    <th class="py-3 px-4 text-[10px] text-right font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody v-if="jobStore.loading">
                                <tr>
                                    <td colspan="6" class="py-12 px-6 text-center text-slate-400">
                                        <i class="fas fa-spinner fa-spin text-[#4c5bd4] text-xl"></i>
                                    </td>
                                </tr>
                            </tbody>

                            <tbody v-else>
                                <tr
                                    v-for="job in jobs"
                                    :key="job.JobID"
                                    class="group border-b border-slate-50 cursor-pointer transition-colors hover:bg-[#fafbff] last:border-b-0"
                                    @click="openDrawer(job)"
                                >
                                    <td class="p-3.5 px-4 align-middle">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-[10px] border border-slate-100 bg-white overflow-hidden shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                                                <img :src="job.CompanyLogo" class="w-full h-full object-contain" alt="logo" />
                                            </div>
                                            <div class="min-w-0">
                                                <p class="font-bold text-slate-800 text-[13.5px] leading-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px] group-hover:text-[#4c5bd4]">{{ job.Title }}</p>
                                                <p class="text-[11.5px] text-slate-500 mt-0.5">{{ job.CompanyName }}</p>
                                                <p class="text-[10px] text-slate-400 mt-1 flex items-center gap-[3px]">
                                                    <i class="fas fa-calendar-alt text-[9px]"></i>
                                                    {{ formatDate(job.CreatedAt) }}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="p-3.5 px-4 align-middle">
                                        <span class="flex items-center gap-[5px] text-[11.5px] text-slate-500 mb-[3px] last:mb-0"><i class="fas fa-map-marker-alt text-blue-400"></i> {{ job.Location }}</span>
                                        <span class="flex items-center gap-[5px] text-[11.5px] text-slate-500 mb-[3px] last:mb-0"><i class="fas fa-briefcase text-purple-400"></i> {{ job.JobType || '—' }}</span>
                                    </td>

                                    <td class="p-3.5 px-4 align-middle text-center">
                                        <div class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg py-1 px-2.5">
                                            <i class="fas fa-user text-[9px]"></i>
                                            {{ job.ApplicationCount ?? 0 }}
                                        </div>
                                    </td>

                                    <td class="p-3.5 px-4 align-middle text-center">
                                        <span class="text-[11.5px] font-bold text-emerald-600 bg-emerald-50 rounded-lg py-1 px-2.5 whitespace-nowrap">{{ formatSalary(job.SalaryMin, job.SalaryMax) }}</span>
                                    </td>

                                    <td class="p-3.5 px-4 align-middle text-center" @click.stop>
                                        <span class="inline-flex items-center text-[10.5px] font-bold py-1 px-2.5 rounded-full border-[1.5px] border-transparent whitespace-nowrap" :class="statusConfig[job.Status]?.cls">
                                            <i :class="[statusConfig[job.Status]?.icon, 'mr-1 text-[9px]']"></i>
                                            {{ statusConfig[job.Status]?.label }}
                                        </span>
                                    </td>

                                    <td class="p-3.5 px-4 align-middle text-right" @click.stop>
                                        <div class="flex items-center justify-end gap-1">
                                            <button
                                                @click="openDrawer(job)"
                                                class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-[#4c5bd4] bg-[#eef0fd] hover:bg-[#4c5bd4] hover:text-white"
                                                title="Xem chi tiết"
                                            >
                                                <i class="fas fa-eye text-[11px]"></i>
                                            </button>
                                            <template v-if="job.Status === 'Pending'">
                                                <button
                                                    @click="openActionModal(job, 'Approve')"
                                                    class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white"
                                                    title="Duyệt"
                                                >
                                                    <i class="fas fa-check text-[11px]"></i>
                                                </button>
                                                <button
                                                    @click="openActionModal(job, 'Reject')"
                                                    class="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors text-[11px] text-red-600 bg-red-50 hover:bg-red-600 hover:text-white"
                                                    title="Từ chối"
                                                >
                                                    <i class="fas fa-times text-[11px]"></i>
                                                </button>
                                            </template>
                                        </div>
                                    </td>
                                </tr>

                                <tr v-if="jobs.length === 0">
                                    <td colspan="6" class="py-12 px-6">
                                        <div class="flex flex-col items-center justify-center text-center text-slate-400">
                                            <i class="fas fa-folder-open text-4xl mb-3 text-slate-200"></i>
                                            <p class="text-sm font-medium text-slate-500">Không tìm thấy bài đăng nào</p>
                                            <p class="text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex items-center justify-between flex-wrap py-3 px-4 border-t border-slate-100 bg-[#fafafa] gap-2">
                        <div class="flex items-center gap-2 text-xs text-slate-500">
                            Hiển thị
                            <select v-model="limit" class="bg-white border border-slate-200 rounded-lg py-[3px] px-2 text-xs outline-none text-slate-700">
                                <option :value="5">5</option>
                                <option :value="10">10</option>
                                <option :value="20">20</option>
                            </select>
                            / Tổng <span class="font-bold text-slate-700 mx-1">{{ jobStore.totalItems }}</span> bài
                        </div>
                        <div class="flex items-center gap-1">
                            <button @click="currentPage--" :disabled="currentPage === 1" class="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 transition-colors cursor-pointer hover:not(:disabled):border-[#4c5bd4] hover:not(:disabled):text-[#4c5bd4] disabled:opacity-40 disabled:cursor-default">
                                <i class="fas fa-chevron-left text-[10px]"></i>
                            </button>
                            <span class="text-xs font-semibold px-3 text-slate-600">
                                {{ currentPage }} / {{ jobStore.totalPages }}
                            </span>
                            <button @click="currentPage++" :disabled="currentPage >= jobStore.totalPages" class="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 transition-colors cursor-pointer hover:not(:disabled):border-[#4c5bd4] hover:not(:disabled):text-[#4c5bd4] disabled:opacity-40 disabled:cursor-default">
                                <i class="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <JobDetail
            :job-id="selectedJobId"
            :is-open="isDrawerOpen"
            @close="closeDrawer"
            @action="handleDrawerAction"
        />

        <transition name="scale-up">
            <div v-if="isActionModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[4px]" @click.self="closeActionModal">
                <div class="bg-white rounded-[20px] p-7 px-6 w-full max-w-[360px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                    <div class="w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-4" :class="actionType === 'Approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                        <i :class="actionType === 'Approve' ? 'fas fa-check-circle' : 'fas fa-times-circle'" class="text-3xl"></i>
                    </div>
                    <h3 class="text-[17px] font-extrabold text-slate-800 mb-2">
                        {{ actionType === 'Approve' ? 'Duyệt bài đăng?' : 'Từ chối bài đăng?' }}
                    </h3>
                    <p class="text-[13px] text-slate-500 leading-[1.6] mb-6">
                        Bạn có chắc chắn muốn
                        <strong>{{ actionType === 'Approve' ? 'duyệt' : 'từ chối' }}</strong>
                        tin tuyển dụng<br />
                        <strong class="text-slate-700">"{{ jobToAction?.Title }}"</strong>?
                    </p>
                    <div class="flex gap-2.5">
                        <button @click="closeActionModal" class="flex-1 p-2.5 bg-slate-100 text-slate-600 rounded-xl text-[13px] font-bold transition-colors hover:bg-slate-200">Huỷ</button>
                        <button
                            @click="handleUpdateStatus"
                            class="flex-1 p-2.5 text-white rounded-xl text-[13px] font-bold transition-opacity hover:opacity-90"
                            :class="actionType === 'Approve' ? 'bg-emerald-600' : 'bg-red-600'"
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
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }


.scale-up-leave-active { transition: all 0.15s ease; }
from { opacity: 0; transform: translateY(12px); }

.scale-up-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.scale-up-enter-from, .scale-up-leave-to { opacity: 0; transform: scale(0.95); }
to   { opacity: 1; transform: translateY(0); }
</style>