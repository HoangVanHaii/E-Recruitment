
<script setup lang="ts">
import SidebarEmployer from '../../components/Employer/SidebarEmployer.vue';
import Notify from '../../components/Notify.vue';
import Loading from '../../components/Loading.vue';
import ApplicationsView from './ApplicationsView.vue';
import JobDetail from '../../components/Employer/JobDetail.vue';
import { useJobStore } from '../../stores/job';
import { ref, computed, onMounted } from 'vue';

const isDetailModalOpen = ref(false);
const JobId = ref<number | null>(null);
const openJobDetail = (id: number | null) => { JobId.value = id; isDetailModalOpen.value = true; };


const isViewingApplications = ref(false);
const selectedJobId = ref<number | null>(null);
const selectedJobTitle = ref<string>('');

const viewApplications = (jobId?: number, jobName?: string) => {
    if (!jobId) return;
    selectedJobId.value = jobId;
    selectedJobTitle.value = jobName || '';
    isViewingApplications.value = true;
};

const handleBackToJobs = async () => {
    isViewingApplications.value = false;
    selectedJobId.value = null;
    selectedJobTitle.value = '';
};


const showNotify = ref<Boolean>(false);
const messageNotify = ref<string>('');
const isSuccessNotify = ref(true);
const useJob = useJobStore();

const ITEMS_PER_PAGE = 6;
const currentPage = ref<number>(1);

const sortOrder = ref('newest');

const fetchJobs = async () => {
    
    const hasData = await useJob.getJobOfMeStore(currentPage.value, ITEMS_PER_PAGE);
    
    if (!hasData && currentPage.value > 1) {
        currentPage.value--; 
        showNotify.value = true;
        isSuccessNotify.value = false;
        messageNotify.value = useJob.message || "Đã hiển thị toàn bộ hồ sơ. Không còn trang tiếp theo.";
    }
};

onMounted(() => {
    fetchJobs();
});

const displayedJobs = computed(() => {
    let result = [...(useJob.listJobMe || [])];    
    result.sort((a, b) => {
        const dateA = new Date(a.CreatedAt || 0).getTime();
        const dateB = new Date(b.CreatedAt || 0).getTime();
        return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
});

const totalItems = computed(() => {
    return displayedJobs.value.length; 
});


const scrollToTop = () => {
    document.querySelector('.overflow-y-auto')?.scrollTo({ top: 0, behavior: 'smooth' });
};

const nextPage = async () => {
    if (useJob.hasNextPage) {
        currentPage.value++;
        await fetchJobs();
        scrollToTop();
    }
};

const prevPage = async () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        await fetchJobs();
        scrollToTop();
    }
};

const formatDate = (date?: Date | string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
</script>
<template>
    <Notify  
        v-if="showNotify" 
        :message="messageNotify" 
        :isSuccess="isSuccessNotify" 
        @close="showNotify = false"
    />

    <Loading v-if="useJob.loading && !isViewingApplications" />
    
    <div class="flex flex-col lg:flex-row h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
        
        <SidebarEmployer />

        <div 
            ref="mainContent"
            class="flex-1 h-full overflow-y-auto custom-scrollbar flex flex-col relative"
        >
            <transition name="fade-content" >
                
                <div v-if="!isViewingApplications" class="flex-1 flex flex-col">

                    <div class="relative bg-gradient-to-br from-[#3B5BFA] via-[#4c6ef5] to-[#748ffc] px-8 pt-10 pb-16 overflow-hidden">
                        <div class="absolute -top-8 -right-8 w-48 h-48 bg-white/5 rounded-full"></div>
                        <div class="absolute bottom-0 right-24 w-32 h-32 bg-white/5 rounded-full"></div>
                        <div class="absolute top-4 right-40 w-16 h-16 bg-white/10 rounded-full"></div>

                        <div class="relative max-w-7xl mx-auto flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-xl shrink-0">
                                <i class="fas fa-address-book text-2xl text-white"></i>
                            </div>
                            <div>
                                <h1 class="text-2xl font-extrabold text-white tracking-tight">Hồ sơ ứng tuyển</h1>
                                <p class="text-sm text-blue-100 mt-0.5">Quản lý và xét duyệt các ứng viên đã nộp hồ sơ vào chiến dịch của bạn.</p>
                            </div>
                        </div>
                    </div>

                    <div class="max-w-7xl mx-auto w-full px-6 sm:px-8 -mt-8 relative z-20">
                        <div class="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 p-4 sm:p-5 flex items-center gap-5">
                            
                            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                                <i class="fas fa-file-alt text-lg"></i>
                            </div>

                            <div>
                                <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mb-1">
                                    Tình trạng chiến dịch
                                </p>
                                <div class="flex items-center gap-2">
                                    <span class="text-3xl font-black text-slate-900">
                                        {{ totalItems }}
                                    </span>
                                    <span class="text-sm font-bold text-slate-500 leading-none">
                                        chiến dịch đang tuyển dụng
                                    </span>
                                </div>
                            </div>

                            <div class="ml-auto hidden sm:flex items-center gap-2">
                                <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hệ thống sẵn sàng</span>
                            </div>
                        </div>
                    </div>

                    <div class="max-w-7xl mx-auto w-full px-6 sm:px-8 pt-6 pb-4 flex-1">
                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            
                            <div 
                                v-for="(job, idx) in displayedJobs"4
                                :key="job.JobID" 
                                class="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col"
                                :style="`animation-delay: ${idx * 60}ms`"
                            >
                                <div class="h-1.5 w-full bg-gradient-to-r from-[#3B5BFA] to-[#748ffc]"></div>

                                <div class="p-4 flex flex-col gap-2 flex-1">
                                    <div class="flex items-center gap-3 cursor-pointer " @click="openJobDetail(job.JobID || null)"
                                    >
                                        <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                            <i class="fas fa-building text-blue-500 text-sm"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Công ty</p>
                                            <p class="font-bold text-slate-800 text-sm truncate">{{ job.CompanyName || 'Công ty ẩn danh' }}</p>
                                        </div>
                                    </div>

                                    <div class="h-px bg-slate-100"></div>

                                    <div class="flex items-start gap-2.5">
                                        <i class="fas fa-thumbtack text-rose-400 text-xs mt-1 shrink-0"></i>
                                        <p class="font-extrabold text-slate-800 text-sm leading-snug line-clamp-2">{{ job.Title }}</p>
                                    </div>

                                    <div class="flex items-center justify-between mt-auto">
                                        <div class="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <i class="fas fa-calendar text-[10px]"></i>
                                            <span>{{ formatDate(job.CreatedAt) }}</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                            <i class="fas fa-users text-[10px]"></i>
                                            <span>{{ job.ApplicationCount || 0 }} ứng viên</span>
                                        </div>
                                    </div>

                                    <button 
                                        @click="viewApplications(job.JobID, job.Title)" 
                                        class=" w-fit mx-auto mt-1 bg-[#3B5BFA] hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-2 px-20 rounded-md text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-md shadow-blue-500/20"
                                    >
                                        <i class="fas fa-eye text-[11px]"></i>
                                        XEM ỨNG VIÊN
                                    </button>
                                </div>
                            </div>

                            <div v-if="displayedJobs.length === 0 && !useJob.loading" class="col-span-full py-28 flex flex-col items-center gap-4 text-center">
                                <div class="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                    <i class="fas fa-folder-open text-3xl text-slate-300"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-extrabold text-slate-600">Chưa có dữ liệu</h3>
                                    <p class="text-sm text-slate-400 mt-1">Không tìm thấy chiến dịch nào phù hợp.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-center items-center gap-4 pt-2 pb-4 border-t border-slate-200 mt-auto">
                        <button 
                            @click="prevPage" 
                            :disabled="currentPage === 1" 
                            class="w-8 h-8 flex items-center justify-center rounded-md font-bold transition-all border shadow-sm"
                            :class="currentPage === 1 ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-60' : 'bg-white text-slate-600 border-slate-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'"
                        >
                            <i class="fas fa-chevron-left text-sm"></i>
                        </button>
                        
                        <div class="h-8 px-6 flex items-center justify-center rounded-lg text-sm font-extrabold bg-blue-600 border border-blue-600 text-white shadow-md shadow-blue-600/30">
                            Trang {{ currentPage }}
                        </div>
                        
                        <button 
                            @click="nextPage" 
                            :disabled="!useJob.hasNextPage" 
                            class="w-8 h-8 flex items-center justify-center rounded-md font-bold transition-all border shadow-sm"
                            :class="!useJob.hasNextPage ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-60' : 'bg-white text-slate-600 border-slate-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'"
                        >
                            <i class="fas fa-chevron-right text-sm"></i>
                        </button>
                    </div>
                </div>

                <ApplicationsView 
                    v-else 
                    :jobId="selectedJobId" 
                    :jobTitle="selectedJobTitle"
                    @back="handleBackToJobs" 
                />

            </transition>
        </div>
    </div>
    <JobDetail 
        :isOpen="isDetailModalOpen" 
        :jobId="JobId" 
        @close="isDetailModalOpen = false" 
    />
</template>
<style scoped>
.fade-content-enter-active, .fade-content-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-content-enter-from { opacity: 0; transform: translateY(12px); }
.fade-content-leave-to   { opacity: 0; transform: translateY(-12px); }

.dropdown-fade-enter-active, .dropdown-fade-leave-active { transition: all 0.2s ease; }
.dropdown-fade-enter-from, .dropdown-fade-leave-to { opacity: 0; transform: translateY(-6px); }

.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 99px; }

.grid > div {
    animation: cardIn 0.35s ease both;
}
@keyframes cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>