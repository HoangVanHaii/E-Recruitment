

<script setup lang="ts">
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import JobDetail from '../../components/Employer/JobDetail.vue';
import EditJobDetail from '../../components/Employer/EditJobDetail.vue';
import Notify from '../../components/Notify.vue';
import Loading from '../../components/Loading.vue';
import { ref, computed, onMounted } from 'vue';
import { useJobStore } from '../../stores/job';
import { useRouter } from 'vue-router';
import type { IListJob } from '../../types/job';


const router = useRouter();
const useJob = useJobStore();

const showNotify = ref(false);
const messageNotify = ref('');
const isSuccessNotify = ref(true);

const ITEMS_PER_PAGE = 3;
const currentPage = ref(1);

onMounted(() => { fetchJobs(); });

const jobs = computed<IListJob[]>(() => useJob.listJobMe || []);
 

const checkIsExpired = (job: IListJob): boolean => {
    if (!job.ExpiredDate) return false;
    const now = new Date();
    const expireTime = new Date(job.ExpiredDate);
    return now > expireTime;
};

const getStatusLabel = (job: IListJob) => {
    if (checkIsExpired(job)) return 'Hết hạn';
    switch (job.Status) {
        case 'Approved': return 'Đang đăng';
        case 'Pending': return 'Chờ duyệt';
        case 'Rejected': return 'Từ chối';
        default: return job.Status;
    }
};

const getStatusBadgeClass = (job: IListJob) => {
    if (checkIsExpired(job)) return 'bg-slate-100 text-slate-500 border-slate-200';
    if (job.Status === 'Approved') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (job.Status === 'Pending') return 'bg-sky-50 text-sky-600 border-sky-100';
    if (job.Status === 'Rejected') return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-slate-50 text-slate-600 border-slate-200';
};

const getStatusLineColor = (job: IListJob) => {
    if (checkIsExpired(job)) return 'from-slate-400 to-slate-500';
    if (job.Status === 'Approved') return 'from-emerald-400 to-emerald-500';
    if (job.Status === 'Pending') return 'from-sky-400 to-sky-500';
    if (job.Status === 'Rejected') return 'from-red-400 to-red-500';
    return 'from-blue-400 to-blue-500';
};

const tabs = [
    { label: 'Tất cả', value: 'All' },
    { label: 'Đang đăng', value: 'Approved' },
    { label: 'Chờ duyệt', value: 'Pending' },
    { label: 'Bị từ chối', value: 'Rejected' },
    { label: 'Hết hạn', value: 'Expired' }
];
const currentTab = ref('All');
const currentSort = ref<'newest' | 'oldest'>('newest');
const currentSortLabel = ref('Mới nhất');
const isSortOpen = ref(false);
const sortOptions = [{ label: 'Mới nhất', value: 'newest' }, { label: 'Cũ nhất', value: 'oldest' }];

const fetchJobs = async () => {
    await useJob.getJobOfMeStore(currentPage.value, ITEMS_PER_PAGE, currentTab.value);
};

const selectSort = (option: any) => {
    currentSort.value = option.value;
    currentSortLabel.value = option.label;
    isSortOpen.value = false;
    currentPage.value = 1;
    fetchJobs();
};

const handleTabChange = (val: string) => {
    currentTab.value = val;
    currentPage.value = 1; 
    fetchJobs();
};

const paginatedJobs = computed(() => {
    const list = [...jobs.value];
    list.sort((a, b) => {
        const dA = new Date(a.CreatedAt || 0).getTime();
        const dB = new Date(b.CreatedAt || 0).getTime();
        return currentSort.value === 'newest' ? dB - dA : dA - dB;
    });
    return list;
});

const nextPage = async () => { if (useJob.hasNextPage) { currentPage.value++; await fetchJobs(); scrollToTop(); } };
const prevPage = async () => { if (currentPage.value > 1) { currentPage.value--; await fetchJobs(); scrollToTop(); } };
const scrollToTop = () => { document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' }); };

const formatDate = (d?: any) => d ? new Intl.DateTimeFormat('vi-VN').format(new Date(d)) : '';

const isDetailModalOpen = ref(false);
const selectedJobId = ref<number | null>(null);
const openJobDetail = (id: number | null) => { selectedJobId.value = id; isDetailModalOpen.value = true; };

const isEditModalOpen = ref(false);
const selectedEditJobId = ref<number | null>(null);
const openEditModal = (id: number | null) => { selectedEditJobId.value = id; isEditModalOpen.value = true; };

const isDeleteModalOpen = ref(false);
const jobToDeleteId = ref<number | null>(null);
const openDeleteModal = (id: number | null) => { jobToDeleteId.value = id; isDeleteModalOpen.value = true; };
const closeDeleteModal = () => { isDeleteModalOpen.value = false; jobToDeleteId.value = null; };

const handleConfirmDelete = async () => {
    if (!jobToDeleteId.value) return;
    await useJob.deleteJobStore(jobToDeleteId.value);
    if (!useJob.error) {
        showNotify.value = true;
        isSuccessNotify.value = true;
        messageNotify.value = "Tin tuyển dụng đã hết hạn!";
        await fetchJobs();
    }
    closeDeleteModal();
};

const handleSave = async () => {
    await fetchJobs();
    showNotify.value = true;
    isSuccessNotify.value = true;
    messageNotify.value = "Cập nhật thành công!";
    isEditModalOpen.value = false;
};
const handleError = async () => {
    showNotify.value = true;
    isSuccessNotify.value = false;
    messageNotify.value = "Đã có lỗi xảy ra!";
    isEditModalOpen.value = false;
};
</script>
<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />
    <Loading v-if="useJob.loading" />

    <JobDetail 
        :isOpen="isDetailModalOpen" 
        :jobId="selectedJobId" 
        @close="isDetailModalOpen = false" 
    />
    <EditJobDetail 
        :isOpen="isEditModalOpen" 
        :jobId="selectedEditJobId" 
        @close="isEditModalOpen = false" 
        @success="handleSave"
        @failed="handleError"
    />
    
    <div class="flex flex-col lg:flex-row h-screen w-full bg-[#F4F7F9] font-sans text-slate-800 overflow-hidden">
        <SidebarEmployer />

        <div class="flex-1 h-full overflow-y-auto custom-scrollbar relative flex flex-col">
            <div class="p-4 sm:p-8 max-w-7xl mx-auto w-full flex-1">
                
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight">
                            Quản lý tin đăng
                        </h1>
                        <p class="text-sm text-slate-500 mt-1">Theo dõi và quản lý các chiến dịch tuyển dụng của bạn.</p>
                    </div>
                    <button @click="router.push({ path: '/create-job' })" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2">
                        <i class="fas fa-plus"></i> Đăng tin mới
                    </button>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-20 mt-6 mb-6">
                    <div class="flex space-x-1 overflow-x-auto w-full sm:w-auto hide-scrollbar p-1">
                        <button 
                            v-for="tab in tabs" :key="tab.value"
                            @click="handleTabChange(tab.value)"
                            :class="[
                                'whitespace-nowrap font-bold text-sm px-5 py-2 rounded-xl transition-all duration-300',
                                currentTab === tab.value 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200' 
                                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                            ]"
                        >
                            {{ tab.label }}
                        </button>
                    </div>

                    <div class="relative w-full sm:w-48">
                        <button @click="isSortOpen = !isSortOpen" class="w-full flex items-center justify-between pl-4 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-300 transition-colors">
                            <span class="flex items-center gap-2 text-blue-600"><i class="fas fa-sort-amount-down"></i> <span class="text-slate-700">{{ currentSortLabel }}</span></span>
                            <i class="fas fa-chevron-down text-xs text-slate-400 transition-transform duration-300" :class="{'rotate-180': isSortOpen}"></i>
                        </button>
                        <transition name="modal-fade">
                            <div v-if="isSortOpen" class="absolute right-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                                <button v-for="opt in sortOptions" :key="opt.value" @click="selectSort(opt)" 
                                    class="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 font-semibold transition-colors"
                                    :class="currentSort === opt.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'">
                                    {{ opt.label }}
                                </button>
                            </div>
                        </transition>
                    </div>
                </div>

                <div class="space-y-3 relative z-10">
                    <div @click="openJobDetail(job.JobID || null)" v-for="job in paginatedJobs" :key="job.JobID" 
                        class="group bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 transition-all duration-300 relative cursor-pointer">
                        
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b rounded-l-2xl" :class="getStatusLineColor(job)"></div>

                        <div class="flex flex-row sm:flex-col items-center gap-3 sm:w-24 shrink-0 pl-1">
                            <div class="w-16 h-16 rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 flex items-center justify-center shadow-inner">
                                <img v-if="job.CompanyLogo" :src="job.CompanyLogo" alt="Logo" class="w-full h-full object-contain drop-shadow-sm">
                                <i v-else class="fas fa-building text-slate-300 text-3xl"></i>
                            </div>
                            <span class="hidden sm:block text-[10.5px] px-2.5 py-1 rounded-lg font-bold text-center w-full shadow-sm" :class="getStatusBadgeClass(job)">
                                {{ getStatusLabel(job) }}
                            </span>
                        </div>

                        <div class="flex-1 flex flex-col justify-between gap-2">
                            <div>
                                <h3 class="text-lg font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{{ job.Title }}</h3>
                                <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium mt-1.5">
                                    <span class="flex items-center gap-1.5 text-slate-600">
                                        <i class="fas fa-map-marker-alt text-rose-500"></i> {{ job.Location }}
                                    </span>
                                    <span class="flex items-center gap-1.5 text-slate-600">
                                        <i class="fas fa-calendar-alt text-amber-500"></i> Hạn: {{ formatDate(job.ExpiredDate) }}
                                    </span>
                                </div>
                            </div>

                            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 border-dashed mt-2">
                                <div class="flex items-center gap-8">
                                    <div class="text-center sm:text-left group/stat">
                                        <div class="text-base font-black text-violet-600 group-hover/stat:scale-110 transition-transform origin-left">{{ job.ApplicationCount || 0 }}</div>
                                        <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Ứng tuyển</div>
                                    </div>
                                    <div class="text-center sm:text-left group/stat">
                                        <div class="text-base font-black text-emerald-500 group-hover/stat:scale-110 transition-transform origin-left">{{ job.Views || 0 }}</div>
                                        <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">Lượt xem</div>
                                    </div>
                                </div>

                                <div @click.stop class="flex items-center gap-2 w-full sm:w-auto">
                                    <template v-if="!checkIsExpired(job)">
                                        <button v-if="job.Status === 'Pending'" @click="openEditModal(job.JobID || null)" 
                                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-200 transition-all duration-300">
                                            <i class="fas fa-pen mr-1"></i> Sửa
                                        </button>
                                        <button @click="openDeleteModal(job.JobID || null)" 
                                            class="flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-200 transition-all duration-300">
                                            <i class="fas fa-trash-alt mr-1"></i> Gỡ tin
                                        </button>
                                    </template>
                                    <span v-else class="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                        <i class="fas fa-lock mr-1"></i> Đã kết thúc
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="paginatedJobs.length === 0" class="py-24 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                        <div class="w-20 h-20 mx-auto bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <i class="fas fa-inbox text-4xl text-blue-300"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-700">Chưa có tin tuyển dụng nào</h3>
                        <p class="text-slate-400 text-sm mt-1 mb-5">Bạn chưa tạo chiến dịch nào hoặc không có dữ liệu phù hợp.</p>
                        <button @click="router.push({ path: '/create-job' })" class="text-sm font-bold text-blue-600 bg-blue-50 px-5 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                            Tạo tin ngay
                        </button>
                    </div>
                </div>

                <div v-if="useJob.hasNextPage || currentPage > 1" class="flex justify-center items-center gap-3 mt-8 pb-10">
                    <button @click="prevPage" :disabled="currentPage === 1" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-600">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="h-10 px-6 flex items-center justify-center rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-200">
                        Trang {{ currentPage }}
                    </div>
                    <button @click="nextPage" :disabled="!useJob.hasNextPage" class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-600">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <Teleport to="body">
        <transition name="modal-fade">
            <div v-if="isDeleteModalOpen" @click.self="closeDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up border border-slate-100">
                    <div class="p-8 text-center relative overflow-hidden">
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-50 rounded-full blur-2xl -z-10"></div>
                        
                        <div class="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl shadow-inner border border-red-200">
                            <i class="fas fa-calendar-times"></i>
                        </div>
                        <h3 class="text-xl font-black text-slate-800 mb-2">Gỡ tin tuyển dụng</h3>
                        <p class="text-slate-500 text-sm leading-relaxed">Tin này sẽ được chuyển sang trạng thái <span class="font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Hết hạn</span> và ngừng nhận hồ sơ ngay lập tức.</p>
                    </div>
                    <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <button @click="closeDeleteModal" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Hủy</button>
                        <button @click="handleConfirmDelete" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-200 transition-all">Đồng ý gỡ</button>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>
<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.overflow-y-auto::-webkit-scrollbar { width: 6px; }
.overflow-y-auto::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>