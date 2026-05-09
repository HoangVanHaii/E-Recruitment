<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useJobStore } from '../stores/job';
import { formatSalary, formatDate } from '../utils/format';
import { 
    MapPin, Calendar, CircleDollarSign, Briefcase, 
    ChevronLeft, ChevronRight, ArrowLeft, SearchX 
} from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();

const { listJobSearch, totalPages, loading } = storeToRefs(jobStore);

const categoryId = ref(Number(route.params.id));
const categoryName = ref(route.query.name || '');

const currentPage = ref(1);
const limit = ref(9); 

const fetchJobs = async () => {
    if (!categoryId.value) return;
    await jobStore.fetchJobSearchByCategory(categoryId.value, currentPage.value, limit.value);
};

onMounted(async () => {
    await fetchJobs();
});

watch(currentPage, () => {
    fetchJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const viewJobDetail = (jobId: number) => {
    router.push({ name: 'job-detail', params: { id: jobId } });
};

const goBack = () => {
    router.push({ name: 'home' });
};
</script>

<template>
    <div class="bg-[#f1f3fb] min-h-[calc(100vh-70px)] pb-20 pt-8 px-4 font-sans text-slate-800">
        <div class="max-w-6xl mx-auto">
            
            <button 
                @click="goBack" 
                class="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-6 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit"
            >
                <ArrowLeft class="w-4 h-4" />
                Quay lại trang chủ
            </button>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 lg:p-8">
                
                <div class="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
                    <div class="bg-blue-100 p-2.5 rounded-xl shadow-inner">
                        <Briefcase class="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 class="font-black text-lg md:text-xl text-slate-800 uppercase tracking-tight">
                            Việc làm theo danh mục
                        </h2>
                        <p v-if="categoryName" class="text-sm text-slate-500 mt-0.5 font-medium">
                            Kết quả tìm kiếm cho: <span class="font-bold text-blue-600">{{ categoryName }}</span>
                        </p>
                    </div>
                </div>

                <div v-if="loading" class="flex flex-col justify-center items-center py-16">
                    <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-b-blue-600 mb-4"></div>
                    <span class="text-blue-600 font-bold text-sm">Đang tải danh sách việc làm...</span>
                </div>

                <div v-else-if="listJobSearch.length === 0" class="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <SearchX class="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 class="text-lg font-extrabold text-slate-700">Chưa có công việc nào</h3>
                    <p class="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
                        Hiện tại chưa có tin tuyển dụng nào thuộc danh mục này. Vui lòng quay lại sau hoặc tìm kiếm danh mục khác nhé!
                    </p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl">
                    <div 
                        v-for="job in listJobSearch" 
                        :key="job.JobID" 
                        @click="viewJobDetail(job.JobID!)"
                        class="flex items-start gap-3 bg-white border border-slate-200 p-4 rounded-xl hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                    >
                        <div class="flex-shrink-0">
                            <div class="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden p-1 shadow-sm group-hover:border-blue-400 transition-colors">
                                <img :src="job.CompanyLogo || '/src/assets/bg-login.jpg'" class="w-full h-full object-contain mix-blend-multiply"/>
                            </div>
                        </div>
                        
                        <div class="flex-1 flex flex-col min-w-0 h-full justify-between">
                            <div>
                                <h3 class="text-blue-700 font-extrabold text-[15px] leading-snug truncate group-hover:text-blue-500 transition-colors" :title="job.Title">
                                    {{ job.Title }}
                                </h3>
                                <p class="text-slate-500 text-[13px] font-semibold truncate mt-1" :title="job.CompanyName">
                                    {{ job.CompanyName }}
                                </p>
                            </div>
                            
                            <div class="space-y-2 mt-3">
                                <div class="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                                    <MapPin class="w-3.5 h-3.5 text-slate-400" />
                                    <span class="truncate">{{ job.Location }}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                                        <Calendar class="w-3.5 h-3.5" />
                                        <span>{{ formatDate(job.CreatedAt) }}</span>
                                    </div>
                                    <div class="flex items-center gap-1 text-[#d866d3] font-bold text-xs bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                                        <CircleDollarSign class="w-3.5 h-3.5" />
                                        <span>{{ formatSalary(job.SalaryMin, job.SalaryMax) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="totalPages > 1 && !loading" class="flex flex-col items-center mt-10 border-t border-slate-100 pt-8">
                    <div class="flex gap-4 items-center">
                        <button 
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1"
                            class="p-2 border border-slate-200 bg-white rounded-full hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-500 shadow-sm"
                        >
                            <ChevronLeft class="w-5 h-5" />
                        </button>
                        
                        <div class="flex gap-2">
                            <button 
                                v-for="page in totalPages" 
                                :key="page"
                                @click="goToPage(page)"
                                class="h-2 rounded-full transition-all duration-300"
                                :class="[currentPage === page ? 'w-10 bg-blue-600 shadow-md shadow-blue-500/30' : 'w-6 bg-slate-200 hover:bg-slate-300']"
                            ></button>
                        </div>
                        
                        <button 
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage === totalPages"
                            class="p-2 border border-slate-200 bg-white rounded-full hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-500 shadow-sm"
                        >
                            <ChevronRight class="w-5 h-5" />
                        </button>
                    </div>
                    <p class="text-xs text-slate-400 mt-4 font-semibold uppercase tracking-wider">
                        Trang {{ currentPage }} / {{ totalPages }}
                    </p>
                </div>

            </div>
        </div>
    </div>
</template>